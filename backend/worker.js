
const CONFIG = {
  APP_NAME: "K-ULTRA AI",
  VERSION: "252.0",
  DEFAULT_MODEL: "gemini-2.5-flash",
  MAX_MESSAGE_LENGTH: 12000,
  MAX_HISTORY: 20
};

const ALLOWED_ORIGINS = [
  "https://koteswararaoyeddula-prog.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin)
    }
  });
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function getText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim() || "";
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-CONFIG.MAX_HISTORY)
    .filter(item =>
      item &&
      ["user", "model"].includes(item.role) &&
      typeof item.text === "string"
    )
    .map(item => ({
      role: item.role,
      parts: [{ text: item.text.slice(0, 12000) }]
    }));
}

async function handleChat(request, env, origin) {
  if (!env.GEMINI_API_KEY) {
    return json({
      success: false,
      error: "Gemini API key is not configured in Cloudflare Worker secrets."
    }, 503, origin);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      success: false,
      error: "Invalid JSON request."
    }, 400, origin);
  }

  const message = typeof body.message === "string"
    ? body.message.trim()
    : "";

  if (!message) {
    return json({
      success: false,
      error: "Please enter a message."
    }, 400, origin);
  }

  if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    return json({
      success: false,
      error: "Message is too long."
    }, 413, origin);
  }

  const history = cleanHistory(body.history);

  const contents = [
    ...history,
    {
      role: "user",
      parts: [{ text: message }]
    }
  ];

  const model = CONFIG.DEFAULT_MODEL;
  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error: result?.error?.message || "Gemini API request failed."
      }, response.status, origin);
    }

    const reply = getText(result);

    if (!reply) {
      return json({
        success: false,
        error: "AI returned an empty response."
      }, 502, origin);
    }

    return json({
      success: true,
      reply,
      model,
      app: CONFIG.APP_NAME,
      version: CONFIG.VERSION
    }, 200, origin);

  } catch (error) {
    return json({
      success: false,
      error: "Unable to connect to the AI service."
    }, 502, origin);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({
        success: false,
        error: "Origin not allowed."
      }, 403, origin);
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        success: true,
        app: CONFIG.APP_NAME,
        version: CONFIG.VERSION,
        status: "online",
        aiConfigured: Boolean(env.GEMINI_API_KEY)
      }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      return handleChat(request, env, origin);
    }

    return json({
      success: false,
      error: "Endpoint not found."
    }, 404, origin);
  }
};
      
