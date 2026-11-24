
/* ============================================
   @K-UNIQUE — CENTRAL CONFIGURATION
   VERSION: 1.0.0
   FILE: assets/js/config.js
============================================ */

(function (window) {
  "use strict";

  const CONFIG = {

    APP: {
      NAME: "@K-UNIQUE",
      VERSION: "1.0.0",
      EDITION: "ULTIMATE SUPER PLATFORM",
      DESCRIPTION: "All-in-One AI Platform",
      ENVIRONMENT: "production",
      DEBUG: false
    },

    /* CLOUDFLARE BACKEND */

    API: {
      BASE_URL:
        "https://k-ultra-ai-backend.yeddulakoteswararao.workers.dev",

      ENDPOINTS: {
        HEALTH: "/api/health",
        CHAT: "/api/chat",
        IMAGE: "/api/image",
        VOICE: "/api/voice",
        RESEARCH: "/api/research",
        SEARCH: "/api/search",
        ANALYZE: "/api/analyze",
        AUTH: "/api/auth",
        USERS: "/api/users",
        PRODUCTS: "/api/products",
        ORDERS: "/api/orders",
        MESSAGES: "/api/messages",
        UPLOAD: "/api/upload"
      },

      TIMEOUT: 60000,
      RETRY_ATTEMPTS: 2,
      RETRY_DELAY: 1000
    },

    /* AI ENGINE */

    AI: {
      PRIMARY: {
        PROVIDER: "cloudflare-workers-ai",
        ENABLED: true,
        PRIORITY: 1,
        BINDING: "AI",
        MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
      },

      SECONDARY: {
        PROVIDER: "google-gemini",
        ENABLED: true,
        PRIORITY: 2,
        MODEL: "gemini-2.5-flash",
        SECRET_NAME: "GEMINI_API_KEY"
      },

      ROUTING: {
        MODE: "primary-with-fallback",
        FALLBACK_ENABLED: true,
        FALLBACK_ON_ERROR: true,
        FALLBACK_ON_TIMEOUT: true,
        MAX_FALLBACK_ATTEMPTS: 1
      },

      CHAT: {
        MAX_MESSAGE_LENGTH: 12000,
        MAX_HISTORY: 20,
        STREAMING: false,
        TEMPERATURE: 0.7,
        MAX_OUTPUT_TOKENS: 2048
      },

      FEATURES: {
        CHAT: true,
        CODING: true,
        RESEARCH: true,
        IMAGE: true,
        VOICE: true,
        DOCUMENT_ANALYSIS: true,
        MULTILINGUAL: true,
        CONVERSATION_HISTORY: true
      }
    },

    /* FIREBASE */

    FIREBASE: {
      ENABLED: true,

      CONFIG: {
        apiKey: "YOUR_FIREBASE_WEB_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_FIREBASE_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.firebasestorage.app",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_FIREBASE_APP_ID"
      },

      AUTH: {
        EMAIL_LOGIN: true,
        GOOGLE_LOGIN: true,
        PASSWORD_RESET: true,
        EMAIL_VERIFICATION: true
      }
    },

    /* PLATFORM MODULES */

    MODULES: {
      AI_CENTER: true,
      ECOMMERCE: true,
      IT_SERVICES: true,
      CYBERSECURITY: true,
      EDUCATION: true,
      BUSINESS: true,
      COMMUNITY: true,
      MESSAGING: true,
      USER_PROFILES: true,
      ADMIN_PANEL: true
    },

    /* STORAGE */

    STORAGE: {
      PROVIDER: "cloudflare-r2",
      MAX_FILE_SIZE_MB: 20,

      ALLOWED_FILE_TYPES: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain"
      ]
    },

    /* SECURITY */

    SECURITY: {
      REQUIRE_AUTH: true,
      API_KEY_IN_FRONTEND: false,
      RATE_LIMIT_ENABLED: true,
      INPUT_VALIDATION: true,
      SECURE_HEADERS: true
    },

    /* UI */

    UI: {
      DEFAULT_THEME: "dark",
      THEME_SWITCHING: true,
      ANIMATIONS: true,
      MOBILE_SUPPORT: true,
      TABLET_SUPPORT: true,
      DESKTOP_SUPPORT: true
    },

    STORAGE_KEYS: {
      THEME: "kunique_theme",
      USER: "kunique_user",
      LANGUAGE: "kunique_language",
      CHAT: "kunique_chat_history"
    }
  };

  /* VALIDATION */

  function validateConfig() {
    const errors = [];

    if (!CONFIG.APP.NAME) {
      errors.push("Application name missing.");
    }

    if (!CONFIG.API.BASE_URL.startsWith("https://")) {
      errors.push("Invalid Worker URL.");
    }

    if (!CONFIG.FIREBASE.CONFIG.projectId ||
        CONFIG.FIREBASE.CONFIG.projectId.includes("YOUR_")) {
      errors.push("Firebase project ID not configured.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /* API URL */

  function getAPI(endpoint) {
    const path = CONFIG.API.ENDPOINTS[endpoint];

    if (!path) {
      throw new Error("Unknown API endpoint: " + endpoint);
    }

    return CONFIG.API.BASE_URL.replace(/\/+$/, "") + path;
  }

  /* EXPORT */

  Object.defineProperty(window, "KUNIQUE_CONFIG", {
    value: Object.freeze(CONFIG),
    writable: false,
    configurable: false
  });

  window.KUNIQUE_CONFIG_HELPERS = Object.freeze({
    validate: validateConfig,
    getAPI
  });

  console.log(
    "[K-UNIQUE] Configuration loaded:",
    CONFIG.APP.VERSION
  );

})(window);
