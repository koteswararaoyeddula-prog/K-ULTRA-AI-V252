
/* ============================================
   @K-UNIQUE — CLOUDFLARE WORKERS BACKEND
   Version 1.0.0
   PRIMARY: Cloudflare Workers AI
   FALLBACK: Google Gemini API
   ============================================ */

const CONFIG = {
  VERSION: "1.0.0",

  AI_MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",

  GEMINI_MODEL: "gemini-2.5-flash",

  MAX_MESSAGE_LENGTH: 12000,
  MAX_HISTORY: 20,

  AI_TIMEOUT: 45000,
  GEMINI_TIMEOUT: 45000
};

/* ============================================
   RESPONSE HELPERS
   ============================================ */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";

  const allowed = String(env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);

  const permitted =
    allowed.includes("*") ||
    allowed.includes(origin);

  return {
    permitted,
    headers: {
      "Access-Control-Allow-Origin":
        allowed.includes("*") ? "*" : (permitted ? origin : "null"),

      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type, Authorization",

      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  };
}

/* ============================================
   FIREBASE TOKEN VERIFICATION
   ============================================ */

async function verifyFirebaseToken(request, env) {
  const projectId = env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project ID is not configured.");
  }

  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const token = authorization.slice(7).trim();
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid authentication token.");
  }

  let header;
  let payload;

  try {
    header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    throw new Error("Invalid authentication token.");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid token signature type.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    payload.aud !== projectId ||
    payload.iss !== `https://securetoken.google.com/${projectId}` ||
    !payload.sub ||
    payload.exp <= now ||
    payload.iat > now + 60
  ) {
    throw new Error("Authentication token is expired or invalid.");
  }

  const keyResponse = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );

  if (!keyResponse.ok) {
    throw new Error("Could not verify Firebase signing keys.");
  }

  const keyData = await keyResponse.json();

  const jwk = keyData.keys.find(
    key => key.kid === header.kid
  );

  if (!jwk) {
    throw new Error("Unknown Firebase signing key.");
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const base64 = parts[2]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const signature = Uint8Array.from(
    atob(base64),
    character => character.charCodeAt(0)
  );

  const signedData = new TextEncoder().encode(
    `${parts[0]}.${parts[1]}`
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    signature,
    signedData
  );

  if (!valid) {
    throw new Error("Firebase token signature verification failed.");
  }

  return payload;
}

/* ============================================
   AI INPUT HELPERS
   ============================================ */

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-CONFIG.MAX_HISTORY)
    .filter(item =>
      item &&
      ["user", "assistant", "model"].includes(item.role) &&
      typeof item.content === "string"
    )
    .map(item => ({
      role: item.role === "assistant" || item.role === "model"
        ? "assistant"
        : "user",
      content: item.content.slice(0, CONFIG.MAX_MESSAGE_LENGTH)
    }));
}

function extractWorkersAIResponse(result) {
  if (typeof result === "string") {
    return result;
  }

  return (
    result?.response ||
    result?.generated_text ||
    result?.result?.response ||
    result?.choices?.[0]?.message?.content ||
    ""
  );
}

/* ============================================
   PRIMARY AI — CLOUDFLARE WORKERS AI
   ============================================ */

async function callWorkersAI(env, messages) {
  if (!env.AI) {
    throw new Error("Cloudflare Workers AI binding is missing.");
  }

  const operation = env.AI.run(CONFIG.AI_MODEL, {
    messages,
    max_tokens: 2048,
    temperature: 0.7
  });

  let timer;

  try {
    const result = await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Workers AI timeout.")),
          CONFIG.AI_TIMEOUT
        );
      })
    ]);

    const response = extractWorkersAIResponse(result);

    if (!response || typeof response !== "string") {
      throw new Error("Workers AI returned an empty response.");
    }

    return response.trim();

  } finally {
    clearTimeout(timer);
  }
}

/* ============================================
   SECONDARY AI — GOOGLE GEMINI
   ============================================ */

async function callGemini(env, messages) {
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API secret is not configured.");
  }

  const contents = messages.map(item => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }]
  }));

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    CONFIG.GEMINI_TIMEOUT
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        }),
        signal: controller.signal
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || `Gemini HTTP ${response.status}`
      );
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text.trim();

  } finally {
    clearTimeout(timer);
  }
}

/* ============================================
   AI PROVIDER ROUTER
   PRIMARY FIRST, FALLBACK ONLY ON FAILURE
   ============================================ */

async function generateAIResponse(env, message, history) {
  const messages = [
    {
      role: "system",
      content:
        "You are @K-UNIQUE AI, a helpful, intelligent, " +
        "multilingual AI assistant. Give clear and accurate answers."
    },
    ...history,
    {
      role: "user",
      content: message
    }
  ];

  // First attempt: Cloudflare Workers AI.
  try {
    const response = await callWorkersAI(env, messages);

    return {
      response,
      provider: "cloudflare-workers-ai",
      fallbackUsed: false
    };

  } catch (primaryError) {
    console.error(
      "[K-UNIQUE] Primary AI failed:",
      primaryError.message
    );
  }

  // Second attempt: Gemini only if primary fails.
  try {
    const response = await callGemini(env, messages);

    return {
      response,
      provider: "google-gemini",
      fallbackUsed: true
    };

  } catch (fallbackError) {
    console.error(
      "[K-UNIQUE] Gemini fallback failed:",
      fallbackError.message
    );

    throw new Error(
      "Both AI providers are currently unavailable."
    );
  }
}

/* ============================================
   CHAT ENDPOINT
   ============================================ */

async function handleChat(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const message = typeof body.message === "string"
    ? body.message.trim()
    : "";

  if (!message) {
    return json({ success: false, error: "Message is required." }, 400);
  }

  if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    return json({ success: false, error: "Message is too long." }, 413);
  }

  const history = cleanHistory(body.history);

  try {
    const result = await generateAIResponse(
      env,
      message,
      history
    );

    return json({
      success: true,
      response: result.response,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      version: CONFIG.VERSION
    });

  } catch (error) {
    console.error("[K-UNIQUE Chat]", error.message);

    return json({
      success: false,
      error: "AI service is temporarily unavailable. Please try again."
    }, 503);
  }
}

/* ============================================
   HEALTH CHECK
   ============================================ */

function handleHealth(env) {
  return json({
    success: true,
    application: "@K-UNIQUE",
    version: CONFIG.VERSION,
    status: "online",
    workersAI: Boolean(env.AI),
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
}

/* ============================================
   MAIN ROUTER
   ============================================ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = getCorsHeaders(request, env);

    if (!cors.permitted) {
      return json(
        { success: false, error: "Origin not allowed." },
        403
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors.headers
      });
    }

    let response;

    try {
      if (request.method === "GET" && path === "/api/health") {
        response = handleHealth(env);

      } else if (request.method === "POST" && path === "/api/chat") {

        if (env.REQUIRE_AUTH === "true") {
          try {
            await verifyFirebaseToken(request, env);
          } catch (error) {
            response = json({
              success: false,
              error: error.message
            }, 401);
          }
        }

        if (!response) {
          response = await handleChat(request, env);
        }

      } else {
        response = json({
          success: false,
          error: "Endpoint not found."
        }, 404);
      }

    } catch (error) {
      console.error("[K-UNIQUE Backend]", error);

      response = json({
        success: false,
        error: "Internal server error."
      }, 500);
    }

    const headers = new Headers(response.headers);

    for (const [key, value] of Object.entries(cors.headers)) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
    
