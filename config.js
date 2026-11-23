
/* =========================================================
   K-ULTRA AI — VERSION 252
   ULTIMATE EDITION
   FILE: config.js
   Central Application Configuration
   ========================================================= */

"use strict";

(function (window) {
  const CONFIG = {

    /* ---------------- APPLICATION ---------------- */

    APP: {
      NAME: "K-ULTRA AI",
      VERSION: "252.0",
      EDITION: "ULTIMATE",
      DESCRIPTION: "Next Generation AI & IT Super Platform",
      ENVIRONMENT: "production",
      DEBUG: false
    },

    /* ---------------- FIREBASE ---------------- */

    FIREBASE: {
      CONFIG: {
        apiKey: "AIzaSyCOliK0d8VxYuHnkkGwRTWVgDt1EYxIvJo",
        authDomain: "k-ultra-ai-v252.firebaseapp.com",
        projectId: "k-ultra-ai-v252",
        storageBucket: "k-ultra-ai-v252.firebasestorage.app",
        messagingSenderId: "735286729786",
        appId: "1:735286729786:web:8c82134a931adafc032903",
        measurementId: "G-B0NGN6FQJS"
      },

      AUTH: {
        ENABLED: true,
        EMAIL_PASSWORD: true,
        GOOGLE: true,
        ANONYMOUS: false,
        PERSISTENCE: "local"
      },

      COLLECTIONS: {
        USERS: "users",
        CHATS: "chats",
        MESSAGES: "messages",
        PROJECTS: "projects",
        SETTINGS: "settings",
        NOTIFICATIONS: "notifications",
        ACTIVITY: "activity"
      }
    },

    /* ---------------- CLOUDFLARE WORKER ---------------- */

    API: {
      BASE_URL:
        "https://k-ultra-ai-backend.yeddulakoteswararao.workers.dev",

      TIMEOUT: 60000,

      ENDPOINTS: {
        ROOT: "/",
        HEALTH: "/health",
        API_HEALTH: "/api/health",
        CHAT: "/api/chat",
        IMAGE: "/api/image",
        VOICE: "/api/voice",
        RESEARCH: "/api/research",
        SEARCH: "/api/search",
        ANALYZE: "/api/analyze",
        AGENT: "/api/agent"
      },

      AUTH_REQUIRED: true,
      SEND_FIREBASE_TOKEN: true,
      RETRY_ATTEMPTS: 2,
      RETRY_DELAY: 1000
    },

    /* ---------------- AI CONFIGURATION ---------------- */

    AI: {
      PROVIDER: "cloudflare",
      FALLBACK_PROVIDER: "gemini",

      MODELS: {
        DEFAULT: "default",
        FAST: "fast",
        REASONING: "reasoning",
        CODING: "coding"
      },

      DEFAULT_MODEL: "default",
      MAX_MESSAGE_LENGTH: 12000,
      MAX_HISTORY: 20,
      STREAMING: false,

      LANGUAGE: {
        DEFAULT: "auto",
        AUTO_DETECT: true,
        REPLY_IN_USER_LANGUAGE: true,

        SUPPORTED: [
          "auto",
          "en",
          "te",
          "hi",
          "ta",
          "kn",
          "ml",
          "ur",
          "es",
          "fr",
          "de",
          "ja",
          "zh",
          "ar"
        ]
      }
    },

    /* ---------------- CHAT SETTINGS ---------------- */

    CHAT: {
      ENABLED: true,
      SAVE_HISTORY: true,
      LOCAL_HISTORY: true,
      CLOUD_HISTORY: true,
      SEARCH_HISTORY: true,
      EXPORT_CHAT: true,
      REGENERATE_RESPONSE: true,
      ATTACHMENTS: true,
      MAX_ATTACHMENTS: 5,
      MAX_FILE_SIZE_MB: 10
    },

    /* ---------------- VOICE / JARVIS ---------------- */

    VOICE: {
      ENABLED: true,
      SPEECH_RECOGNITION: true,
      SPEECH_SYNTHESIS: true,
      PUSH_TO_TALK: true,
      WAKE_WORD: false,
      WAKE_WORD_TEXT: "Hey K-ULTRA",
      DEFAULT_LANGUAGE: "auto",
      AUTO_SPEAK: false
    },

    /* ---------------- FILE UPLOADS ---------------- */

    FILES: {
      ENABLED: true,

      MAX_SIZE_MB: 10,

      ALLOWED_EXTENSIONS: [
        "txt",
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "csv",
        "ppt",
        "pptx",
        "json",
        "xml",
        "html",
        "css",
        "js",
        "ts",
        "py",
        "java",
        "cpp",
        "c",
        "jpg",
        "jpeg",
        "png",
        "webp"
      ]
    },

    /* ---------------- DEVELOPER TOOLS ---------------- */

    DEVELOPER: {
      ENABLED: true,
      CODE_EDITOR: true,
      PLAYGROUND: true,
      CODE_FORMATTER: true,
      SYNTAX_HIGHLIGHTING: true,
      CODE_DOWNLOAD: true,
      CODE_EXECUTION: false,
      SECURE_SANDBOX_REQUIRED: true
    },

    /* ---------------- 3D STUDIO ---------------- */

    STUDIO_3D: {
      ENABLED: true,
      ENGINE: "three.js",
      EXPORT_FORMATS: [
        "glb",
        "gltf",
        "obj"
      ]
    },

    /* ---------------- E-COMMERCE ---------------- */

    ECOMMERCE: {
      ENABLED: true,
      PRODUCT_CATALOG: true,
      SHOPPING_CART: true,
      WISHLIST: true,
      SELLER_DASHBOARD: true,
      PAYMENTS_ENABLED: false,
      PAYMENT_PROVIDER: null
    },

    /* ---------------- TRAVEL & BOOKINGS ---------------- */

    TRAVEL: {
      ENABLED: true,
      FLIGHTS: true,
      HOTELS: true,
      TRAINS: true,
      BUSES: true,
      CAR_RENTALS: true,
      LIVE_BOOKING_ENABLED: false,
      BOOKING_PROVIDER: null
    },

    /* ---------------- LEARNING ---------------- */

    LEARNING: {
      ENABLED: true,
      COURSES: true,
      QUIZZES: true,
      CHALLENGES: true,
      CERTIFICATES: true,
      PROGRESS_TRACKING: true
    },

    /* ---------------- BUSINESS TOOLS ---------------- */

    BUSINESS: {
      ENABLED: true,
      PROJECT_MANAGEMENT: true,
      CRM: true,
      HR: true,
      MARKETING: true,
      SEO: true,
      ANALYTICS: true
    },

    /* ---------------- USER INTERFACE ---------------- */

    UI: {
      DEFAULT_THEME: "dark",
      ALLOW_THEME_SWITCH: true,
      SIDEBAR_WIDTH: 265,
      MOBILE_BREAKPOINT: 760,
      ANIMATIONS: true,
      NOTIFICATIONS: true
    },

    /* ---------------- STORAGE ---------------- */

    STORAGE: {
      LOCAL_STORAGE_PREFIX: "kultra_v252_",
      SAVE_THEME: true,
      SAVE_SETTINGS: true,
      SAVE_CHAT_HISTORY: true
    },

    /* ---------------- SECURITY ---------------- */

    SECURITY: {
      REQUIRE_AUTH: true,
      CLIENT_SIDE_ADMIN_ACCESS: false,
      EXPOSE_API_KEYS: false,
      SECURE_CODE_EXECUTION: false,
      MAX_LOGIN_ATTEMPTS: 5
    },

    /* ---------------- FEATURE FLAGS ---------------- */

    FEATURES: {
      AI_CHAT: true,
      RESEARCH: true,
      JARVIS: true,
      VOICE_INPUT: true,
      IMAGE_STUDIO: true,
      VIDEO_STUDIO: true,
      AUDIO_STUDIO: true,
      DOCUMENTS: true,
      CODE_STUDIO: true,
      PLAYGROUND: true,
      DEV_UTILITIES: true,
      COMPUTER_HELP: true,
      IT_SERVICES: true,
      WEBSITE_BUILDER: true,
      APP_BUILDER: true,
      THREE_D_STUDIO: true,
      ECOMMERCE: true,
      TRAVEL: true,
      PROJECTS: true,
      CRM: true,
      COMPANY_WORKSPACE: true,
      MARKETING: true,
      LEARNING: true,
      CAREERS: true,
      ADMIN: true
    }
  };

  /* ---------------- CONFIG HELPERS ---------------- */

  CONFIG.API.getURL = function (endpoint) {
    const base = CONFIG.API.BASE_URL.replace(/\/+$/, "");
    const path = String(endpoint || "").startsWith("/")
      ? endpoint
      : "/" + endpoint;

    return base + path;
  };

  CONFIG.API.getEndpoint = function (name) {
    const endpoint = CONFIG.API.ENDPOINTS[name];

    if (!endpoint) {
      throw new Error("Unknown API endpoint: " + name);
    }

    return CONFIG.API.getURL(endpoint);
  };

  CONFIG.API.getAuthHeaders = async function () {
    const headers = {
      "Content-Type": "application/json"
    };

    if (!CONFIG.API.SEND_FIREBASE_TOKEN) {
      return headers;
    }

    const auth = window.firebase?.auth?.();

    if (!auth || !auth.currentUser) {
      throw new Error("Please sign in before using K-ULTRA AI.");
    }

    const token = await auth.currentUser.getIdToken();

    headers.Authorization = "Bearer " + token;

    return headers;
  };

  /* ---------------- VALIDATION ---------------- */

  CONFIG.validate = function () {
    const errors = [];

    if (!CONFIG.FIREBASE.CONFIG.apiKey) {
      errors.push("Firebase API key is missing.");
    }

    if (!CONFIG.FIREBASE.CONFIG.projectId) {
      errors.push("Firebase project ID is missing.");
    }

    if (!CONFIG.API.BASE_URL.startsWith("https://")) {
      errors.push("Cloudflare Worker URL must use HTTPS.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  /* ---------------- GLOBAL EXPORT ---------------- */

  window.KULTRA_CONFIG = CONFIG;

  console.info(
    "K-ULTRA AI configuration loaded:",
    CONFIG.APP.VERSION
  );

  const validation = CONFIG.validate();

  if (!validation.valid) {
    console.error(
      "K-ULTRA AI configuration errors:",
      validation.errors
    );
  }

})(window);

/* =========================================================
   END OF K-ULTRA AI VERSION 252 CONFIGURATION
   ========================================================= */
