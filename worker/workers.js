
/* ============================================
   @K-UNIQUE — CLOUDFLARE WORKERS BACKEND
   VERSION: 1.1.0

   PRIMARY: Cloudflare Workers AI
   FALLBACK: Google Gemini 2.5 Flash
   AUTH: Firebase ID Token
============================================ */

const CONFIG = {
  VERSION: "1.1.0",

  AI_MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  GEMINI_MODEL: "gemini-2.5-flash",

  MAX_MESSAGE_LENGTH: 12000,
  MAX_HISTORY: 20,

  AI_TIMEOUT: 45000,
  GEMINI_TIMEOUT: 45000,
  MAX_OUTPUT_TOKENS: 2048
};

/* ============================================
   JSON RESPONSE
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

/* ============================================
   CORS
============================================ */

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";

  const allowed = String(env.ALLOWED_ORIGINS || "")
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
        allowed.includes("*")
          ? "*"
          : permitted
            ? origin
            : "null",

      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  };
}

/* ============================================
   FIREBASE JWT HELPERS
============================================ */

function decodeBase64Url(value) {
  let base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  return atob(base64);
}

function decodeJwtPart(value) {
  const decoded = decodeBase64Url(value);

  const bytes = Uint8Array.from(
    decoded,
    character => character.charCodeAt(0)
  );

  return JSON.parse(new TextDecoder().decode(bytes));
}

/* ============================================
   FIREBASE SIGNING KEY CACHE
============================================ */

let firebaseKeysCache = null;
let firebaseKeysExpiry = 0;

async function getFirebaseSigningKeys() {
  const now = Date.now();

  if (firebaseKeysCache && now < firebaseKeysExpiry) {
    return firebaseKeysCache;
  }

  const response = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve Firebase signing keys.");
  }

  const data = await response.json();

  if (!Array.isArray(data.keys)) {
    throw new Error("Invalid Firebase signing key response.");
  }

  firebaseKeysCache = data.keys;

  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAge = cacheControl.match(/max-age=(\d+)/i);

  firebaseKeysExpiry = now + (
    maxAge
      ? Number(maxAge[1]) * 1000
      : 3600000
  );

  return firebaseKeysCache;
}

/* ============================================
   FIREBASE TOKEN VERIFICATION
============================================ */

async function verifyFirebaseToken(request, env) {
  const projectId = env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Firebase project ID is not configured.");
  }

  const authorization =
    request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const token = authorization.slice(7).trim();
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid Firebase token.");
  }

  let header;
  let payload;

  try {
    header = decodeJwtPart(parts[0]);
    payload = decodeJwtPart(parts[1]);
  } catch {
    throw new Error("Invalid Firebase token format.");
  }

  if (
    header.alg !== "RS256" ||
    !header.kid
  ) {
    throw new Error("Unsupported token signature.");
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    payload.aud !== projectId ||
    payload.iss !==
      `https://securetoken.google.com/${projectId}` ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.exp <= now ||
    payload.iat > now + 60 ||
    !payload.auth_time ||
    payload.auth_time > now
  ) {
    throw new Error("Firebase token is expired or invalid.");
  }

  const keys = await getFirebaseSigningKeys();

  const jwk = keys.find(
    key => key.kid === header.kid
  );

  if (!jwk) {
    firebaseKeysCache = null;
    firebaseKeysExpiry = 0;

    throw new Error("Firebase signing key not found.");
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

  const signatureBytes = Uint8Array.from(
    decodeBase64Url(parts[2]),
    character => character.charCodeAt(0)
  );

  const signedData = new TextEncoder().encode(
    `${parts[0]}.${parts[1]}`
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    signatureBytes,
    signedData
  );

  if (!valid) {
    throw new Error("Firebase token signature is invalid.");
  }

  return payload;
}

/* ============================================
   HISTORY CLEANER
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
      role:
        item.role === "assistant" || item.role === "model"
          ? "assistant"
          : "user",

      content: item.content
        .slice(0, CONFIG.MAX_MESSAGE_LENGTH)
    }));
}

/* ============================================
   WORKERS AI RESPONSE EXTRACTOR
============================================ */

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
    throw new Error("Workers AI binding is missing.");
  }

  let timer;

  try {
    const operation = env.AI.run(
      CONFIG.AI_MODEL,
      {
        messages,
        max_tokens: CONFIG.MAX_OUTPUT_TOKENS,
        temperature: 0.7
      }
    );

    const result = await Promise.race([
      operation,

      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Workers AI timeout.")),
          CONFIG.AI_TIMEOUT
        );
      })
    ]);

    const answer = extractWorkersAIResponse(result);

    if (!answer || typeof answer !== "string") {
      throw new Error("Workers AI returned an empty response.");
    }

    return answer.trim();

  } finally {
    if (timer) clearTimeout(timer);
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

  const systemMessage = messages.find(
    item => item.role === "system"
  );

  const conversationMessages = messages.filter(
    item => item.role !== "system"
  );

  const contents = conversationMessages.map(item => ({
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
          systemInstruction: systemMessage
            ? {
                parts: [{ text: systemMessage.content }]
              }
            : undefined,

          contents,

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: CONFIG.MAX_OUTPUT_TOKENS
          }
        }),

        signal: controller.signal
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        `Gemini HTTP ${response.status}`
      );
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    if (!answer || !answer.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return answer.trim();

  } finally {
    clearTimeout(timer);
  }
}

/* ============================================
   AI PROVIDER ROUTER
   WORKERS AI FIRST — GEMINI SECOND
============================================ */

async function generateAIResponse(env, message, history) {
  const messages = [
    {
      role: "system",
      content:
        "You are @K-UNIQUE AI, a helpful, intelligent, " +
        "multilingual AI assistant. Answer clearly and accurately. " +
        "Follow the user's requested language whenever possible."
    },

    ...history,

    {
      role: "user",
      content: message
    }
  ];

  // PRIMARY PROVIDER
  try {
    const response = await callWorkersAI(env, messages);

    return {
      response,
      provider: "cloudflare-workers-ai",
      fallbackUsed: false
    };

  } catch (error) {
    console.error(
      "[K-UNIQUE] Workers AI failed:",
      error.message
    );
  }

  // FALLBACK PROVIDER
  try {
    const response = await callGemini(env, messages);

    return {
      response,
      provider: "google-gemini",
      fallbackUsed: true
    };

  } catch (error) {
    console.error(
      "[K-UNIQUE] Gemini fallback failed:",
      error.message
    );

    throw new Error("Both AI providers are unavailable.");
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
    return json({
      success: false,
      error: "Invalid JSON body."
    }, 400);
  }

  const message =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return json({
      success: false,
      error: "Message is required."
    }, 400);
  }

  if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    return json({
      success: false,
      error: "Message is too long."
    }, 413);
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
    authenticationConfigured: Boolean(env.FIREBASE_PROJECT_ID),
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
      return json({
        success: false,
        error: "Origin not allowed."
      }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors.headers
      });
    }

    let response;

    try {
      if (
        request.method === "GET" &&
        path === "/api/health"
      ) {
        response = handleHealth(env);

      } else if (
        request.method === "POST" &&
        path === "/api/chat"
      ) {
        const authRequired =
          String(env.REQUIRE_AUTH).toLowerCase() === "true";

        if (authRequired) {
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
       
