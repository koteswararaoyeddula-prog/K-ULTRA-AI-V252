
"use strict";

window.KUNIQUE_CONFIG = Object.freeze({
  APP_NAME: "K-UNIQUE",
  VERSION: "1.0.0",
  ENVIRONMENT: "development",

  API: {
    BASE_URL: "/api",
    TIMEOUT: 30000
  },

  FEATURES: {
    AI: true,
    MESSAGING: true,
    ECOMMERCE: true,
    CYBERSECURITY: true,
    IT_SERVICES: true,
    BUSINESS: true,
    EDUCATION: true,
    CLOUD: true,
    PRODUCTIVITY: true,
    ADMIN: true
  },

  AUTH: {
    PROVIDER: "firebase",
    ENABLE_GUEST: true
  },

  UI: {
    DEFAULT_THEME: "dark",
    MOBILE_MENU: true
  }
});
