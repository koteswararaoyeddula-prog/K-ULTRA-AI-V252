
/* =========================================================
   K-ULTRA AI
   VERSION 252
   FILE: config.js
   CENTRAL APPLICATION CONFIGURATION
   ========================================================= */

(function () {
  "use strict";

  /* =========================
     1. FIREBASE CONFIGURATION
     ========================= */

  const firebaseConfig = {
    apiKey: "AIzaSyCOliK0d8VxYuHnkkGwRTWVgDt1EYxIvJo",
    authDomain: "k-ultra-ai-v252.firebaseapp.com",
    projectId: "k-ultra-ai-v252",
    storageBucket: "k-ultra-ai-v252.firebasestorage.app",
    messagingSenderId: "735286729786",
    appId: "1:735286729786:web:8c82134a931adafc032903",
    measurementId: "G-B0NGN6FQJS"
  };

  /* =========================
     2. CLOUDFLARE WORKER URL
     ========================= */

  const API_BASE_URL =
    "https://k-ultra-ai-backend.yeddulakoteswararao.workers.dev";

  /* =========================
     3. API ENDPOINTS
     ========================= */

  const API_ENDPOINTS = {
    HEALTH: "/api/health",

    CHAT: "/api/chat",

    IMAGE: "/api/image",
    IMAGE_EDIT: "/api/image/edit",

    VOICE: "/api/voice",

    SEARCH: "/api/search",
    RESEARCH: "/api/research",

    DOCUMENT_UPLOAD: "/api/documents/upload",
    DOCUMENT_ANALYZE: "/api/documents/analyze",

    CODING: "/api/coding",

    AGENT: "/api/agent",
    AGENT_APPROVE: "/api/agent/approve",

    DATA_ANALYZE: "/api/data/analyze",

    PRODUCTS: "/api/products",
    PRODUCT_DETAILS: "/api/products",

    CART: "/api/cart",

    CHECKOUT: "/api/checkout",

    ORDERS: "/api/orders",

    PAYMENT_VERIFY: "/api/payments/verify",

    PAYMENT_WEBHOOK: "/api/payments/webhook"
  };

  /* =========================
     4. APPLICATION CONFIG
     ========================= */

  const CONFIG = {
    APP_NAME: "K-ULTRA AI",
    VERSION: "252.0",
    EDITION: "ULTIMATE AI SUPER PLATFORM",

    LANGUAGE: "auto",

    THEME: "dark",

    DEBUG: false,

    /* =========================
       API CONFIGURATION
       ========================= */

    API: {
      BASE_URL: API_BASE_URL,

      ENDPOINTS: API_ENDPOINTS,

      TIMEOUT: 120000,

      CHAT_TIMEOUT: 120000,

      IMAGE_TIMEOUT: 180000,

      RESEARCH_TIMEOUT: 300000,

      STREAMING: true,

      RETRY_COUNT: 2,

      RETRY_DELAY: 1500
    },

    /* =========================
       AI CONFIGURATION
       ========================= */

    AI: {
      PROVIDER: "cloudflare-worker",

      DEFAULT_MODEL: "gemini-2.5-flash",

      FAST_MODEL: "gemini-2.5-flash",

      REASONING_MODEL: "gemini-2.5-flash",

      CODING_MODEL: "gemini-2.5-flash",

      MAX_MESSAGE_LENGTH: 12000,

      MAX_HISTORY: 20,

      STREAMING: true,

      MULTILINGUAL: true,

      DEFAULT_LANGUAGE: "auto"
    },

    /* =========================
       FIREBASE CONFIGURATION
       ========================= */

    FIREBASE: {
      CONFIG: firebaseConfig,

      ENABLE_AUTH: true,

      ENABLE_EMAIL_LOGIN: true,

      ENABLE_GOOGLE_LOGIN: true,

      ENABLE_FIRESTORE: true,

      ENABLE_STORAGE: true,

      COLLECTIONS: {
        USERS: "users",

        CONVERSATIONS: "conversations",

        MESSAGES: "messages",

        DOCUMENTS: "documents",

        GENERATED_IMAGES: "generated_images",

        RESEARCH_REPORTS: "research_reports",

        PRODUCTS: "products",

        CATEGORIES: "categories",

        CARTS: "carts",

        ORDERS: "orders",

        PAYMENTS: "payments",

        REVIEWS: "reviews",

        WISHLISTS: "wishlists",

        NOTIFICATIONS: "notifications",

        ADMIN_LOGS: "admin_logs"
      }
    },

    /* =========================
       CHAT CONFIGURATION
       ========================= */

    CHAT: {
      MAX_INPUT_LENGTH: 12000,

      MAX_HISTORY: 20,

      SAVE_HISTORY: true,

      ENABLE_EDIT_MESSAGE: true,

      ENABLE_REGENERATE: true,

      ENABLE_COPY: true,

      ENABLE_SEARCH: true,

      ENABLE_EXPORT: true
    },

    /* =========================
       IMAGE CONFIGURATION
       ========================= */

    IMAGE: {
      ENABLED: true,

      DEFAULT_ASPECT_RATIO: "1:1",

      DEFAULT_QUALITY: "standard",

      MAX_PROMPT_LENGTH: 4000
    },

    /* =========================
       VOICE CONFIGURATION
       ========================= */

    VOICE: {
      ENABLED: true,

      SPEECH_RECOGNITION: true,

      TEXT_TO_SPEECH: true,

      DEFAULT_LANGUAGE: "en-US"
    },

    /* =========================
       SEARCH CONFIGURATION
       ========================= */

    SEARCH: {
      ENABLED: true,

      SHOW_SOURCES: true,

      MAX_RESULTS: 10
    },

    /* =========================
       RESEARCH CONFIGURATION
       ========================= */

    RESEARCH: {
      ENABLED: true,

      MAX_SOURCES: 15,

      SHOW_CITATIONS: true
    },

    /* =========================
       DOCUMENT CONFIGURATION
       ========================= */

    DOCUMENTS: {
      ENABLED: true,

      MAX_FILE_SIZE_MB: 20,

      ALLOWED_EXTENSIONS: [
        "pdf",
        "txt",
        "doc",
        "docx",
        "csv",
        "xlsx",
        "pptx",
        "png",
        "jpg",
        "jpeg",
        "webp"
      ]
    },

    /* =========================
       AGENT CONFIGURATION
       ========================= */

    AGENT: {
      ENABLED: true,

      REQUIRE_APPROVAL: true,

      MAX_STEPS: 15,

      ALLOW_EXTERNAL_ACTIONS: false
    },

    /* =========================
       E-COMMERCE CONFIGURATION
       ========================= */

    STORE: {
      ENABLED: true,

      CURRENCY: "INR",

      CURRENCY_SYMBOL: "₹",

      PRODUCTS_PER_PAGE: 12,

      ENABLE_CART: true,

      ENABLE_WISHLIST: true,

      ENABLE_REVIEWS: true
    },

    /* =========================
       PAYMENT CONFIGURATION
       ========================= */

    PAYMENT: {
      ENABLED: true,

      PROVIDER: "razorpay",

      CURRENCY: "INR",

      REQUIRE_SERVER_VERIFICATION: true
    },

    /* =========================
       ADMIN CONFIGURATION
       ========================= */

    ADMIN: {
      ENABLED: true,

      REQUIRE_ADMIN_ROLE: true
    },

    /* =========================
       PWA CONFIGURATION
       ========================= */

    PWA: {
      ENABLED: true,

      SERVICE_WORKER: "./service-worker.js",

      MANIFEST: "./manifest.json"
    }
  };

  /* =========================
     5. CONFIG HELPERS
     ========================= */

  const settings = {
    getAPI: function (endpoint) {
      if (!endpoint) {
        return API_BASE_URL;
      }

      return API_BASE_URL + endpoint;
    },

    getEndpoint: function (name) {
      return API_ENDPOINTS[name] || null;
    },

    getFirebaseConfig: function () {
      return firebaseConfig;
    },

    getAppName: function () {
      return CONFIG.APP_NAME;
    },

    getVersion: function () {
      return CONFIG.VERSION;
    },

    isDebug: function () {
      return CONFIG.DEBUG === true;
    }
  };

  /* =========================
     6. GLOBAL CONFIG EXPORT
     ========================= */

  window.KULTRA_CONFIG = CONFIG;

  window.KULTRA = window.KULTRA || {};

  window.KULTRA.config = CONFIG;

  window.KULTRA.settings = settings;

  window.KULTRA.firebaseConfig = firebaseConfig;

  window.KULTRA.API_ENDPOINTS = API_ENDPOINTS;

})();
