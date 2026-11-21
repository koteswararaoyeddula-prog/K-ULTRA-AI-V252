
/* ==========================================
   K-ULTRA AI — VERSION 252.0
   CENTRAL CONFIGURATION
========================================== */

"use strict";

window.KULTRA_CONFIG = Object.freeze({

  APP: {
    NAME: "K-ULTRA AI",
    VERSION: "252.0",
    EDITION: "ULTIMATE GLOBAL AI ECOSYSTEM",
    DEFAULT_LANGUAGE: "en",
    SUPPORTED_LANGUAGES: [
      "en",
      "te",
      "hi"
    ]
  },

  // --------------------------------
  // BACKEND CONNECTION
  // --------------------------------

  API: {
    // Replace this with your deployed Cloudflare Worker URL.
    // Example: https://your-worker.your-subdomain.workers.dev
    BASE_URL: "https://YOUR-CLOUDFLARE-WORKER-URL",

    ENDPOINTS: {
      CHAT: "/api/chat",
      IMAGE: "/api/image",
      VOICE: "/api/voice",
      RESEARCH: "/api/research",
      SEARCH: "/api/search",
      ANALYZE: "/api/analyze",
      AGENT: "/api/agent",
      HEALTH: "/api/health"
    },

    TIMEOUT: 60000
  },

  // --------------------------------
  // AI MODEL CONFIGURATION
  // --------------------------------

  AI: {
    DEFAULT_MODEL: "default",
    FAST_MODEL: "fast",
    REASONING_MODEL: "reasoning",
    CODING_MODEL: "coding",

    MAX_MESSAGE_LENGTH: 12000,
    MAX_HISTORY: 20,
    STREAMING: false
  },

  // --------------------------------
  // AUTHENTICATION
  // --------------------------------

  AUTH: {
    PROVIDER: "firebase",
    ENABLE_EMAIL_LOGIN: true,
    ENABLE_GOOGLE_LOGIN: true,
    REQUIRE_LOGIN: false
  },

  // --------------------------------
  // E-COMMERCE
  // --------------------------------

  COMMERCE: {
    ENABLED: true,
    CURRENCY: "INR",
    CURRENCY_SYMBOL: "₹",
    PRODUCTS_PER_PAGE: 12,
    ENABLE_WISHLIST: true,
    ENABLE_CART: true,
    ENABLE_SELLER_CENTER: true,
    PAYMENT_PROVIDER: "not_configured"
  },

  // --------------------------------
  // USER INTERFACE
  // --------------------------------

  UI: {
    DEFAULT_THEME: "dark",
    ENABLE_LIGHT_THEME: true,
    ENABLE_DARK_THEME: true,
    ENABLE_MOBILE_LAYOUT: true,
    ENABLE_TABLET_LAYOUT: true,
    ENABLE_DESKTOP_LAYOUT: true
  },

  // --------------------------------
  // SECURITY
  // --------------------------------

  SECURITY: {
    SEND_API_KEYS_FROM_FRONTEND: false,
    REQUIRE_HTTPS: true,
    MAX_REQUEST_SIZE: 1048576
  }

});

console.log(
  "K-ULTRA AI Configuration Loaded — Version 252.0"
);
