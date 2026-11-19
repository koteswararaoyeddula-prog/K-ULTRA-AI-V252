
"use strict";

/*
 * K-ULTRA AI VERSION 252
 * Public frontend configuration
 */

window.KULTRA_CONFIG = Object.freeze({
  APP_NAME: "K-ULTRA AI",
  VERSION: "252.0",
  EDITION: "ULTIMATE COMPLETE EDITION",

  // We will add the actual Cloudflare Worker URL in Task 04.
  API_BASE_URL: "",

  ENVIRONMENT: "development",

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
