
"use strict";

/*
 * K-ULTRA AI VERSION 252
 * Public frontend configuration
 */

window.KULTRA_CONFIG = Object.freeze({
  APP_NAME: "K-ULTRA AI",
  VERSION: "252.0",
  EDITION: "ULTIMATE COMPLETE EDITION",

  API_BASE_URL:
    "https://k-ultra-ai-backend.yeddulakoteswararao.workers.dev",

  ENVIRONMENT: "production",

  FEATURES: Object.freeze({
    CHAT: true,
    CODING: true,
    WEBSITE_BUILDER: true,
    IMAGE_STUDIO: true,
    VIDEO_STUDIO: true,
    RESEARCH: true,
    AGENTS: true,
    ECOMMERCE: true,
    CODING_CHALLENGES: true,
    DOCUMENTS: true,
    MARKETPLACE: true
  })
});
