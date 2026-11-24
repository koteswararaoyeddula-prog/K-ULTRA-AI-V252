
/* ============================================
   @K-UNIQUE — ULTIMATE SUPER PLATFORM
   VERSION: 1.0.0
   FILE: assets/js/api.js

   FRONTEND API CONNECTOR
============================================ */

(function (window) {
  "use strict";

  const config = window.KUNIQUE_CONFIG;
  const helpers = window.KUNIQUE_CONFIG_HELPERS;

  if (!config || !helpers) {
    console.error("[K-UNIQUE] Configuration not loaded.");
    return;
  }

  /* ==========================================
     API ERROR CLASS
  ========================================== */

  class APIError extends Error {
    constructor(message, status, data) {
      super(message);
      this.name = "APIError";
      this.status = status || 0;
      this.data = data || null;
    }
  }

  /* ==========================================
     AUTHENTICATION TOKEN
  ========================================== */

  async function getAuthToken() {
    try {
      const auth = window.firebase?.auth?.();

      if (!auth || !auth.currentUser) {
        return null;
      }

      return await auth.currentUser.getIdToken();

    } catch (error) {
      console.error("[K-UNIQUE] Auth token error:", error);
      return null;
    }
  }

  /* ==========================================
     REQUEST HEADERS
  ========================================== */

  async function getHeaders(customHeaders = {}) {
    const headers = {
      "Accept": "application/json",
      ...customHeaders
    };

    const token = await getAuthToken();

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return headers;
  }

  /* ==========================================
     CORE REQUEST ENGINE
  ========================================== */

  async function request(endpoint, options = {}) {

    const {
      method = "GET",
      body,
      headers = {},
      timeout = config.API.TIMEOUT,
      requireAuth = false
    } = options;

    const url = helpers.getAPI(endpoint);

    const token = await getAuthToken();

    if (requireAuth && !token) {
      throw new APIError(
        "Authentication required. Please login.",
        401
      );
    }

    const requestHeaders = await getHeaders(headers);

    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout
    );

    const fetchOptions = {
      method,
      headers: requestHeaders,
      signal: controller.signal
    };

    if (body !== undefined) {

      if (body instanceof FormData) {
        fetchOptions.body = body;

      } else {
        requestHeaders["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(body);
      }
    }

    try {

      const response = await fetch(url, fetchOptions);

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();

      } else {
        data = await response.text();
      }

      if (!response.ok) {

        const message =
          typeof data === "object" && data
            ? data.error || data.message
            : data;

        throw new APIError(
          message || "API request failed.",
          response.status,
          data
        );
      }

      return data;

    } catch (error) {

      if (error instanceof APIError) {
        throw error;
      }

      if (error.name === "AbortError") {
        throw new APIError(
          "Request timed out.",
          408
        );
      }

      throw new APIError(
        error.message || "Network connection failed.",
        0
      );

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /* ==========================================
     HTTP METHODS
  ========================================== */

  const http = {

    get(endpoint, options = {}) {
      return request(endpoint, {
        ...options,
        method: "GET"
      });
    },

    post(endpoint, body, options = {}) {
      return request(endpoint, {
        ...options,
        method: "POST",
        body
      });
    },

    put(endpoint, body, options = {}) {
      return request(endpoint, {
        ...options,
        method: "PUT",
        body
      });
    },

    patch(endpoint, body, options = {}) {
      return request(endpoint, {
        ...options,
        method: "PATCH",
        body
      });
    },

    delete(endpoint, options = {}) {
      return request(endpoint, {
        ...options,
        method: "DELETE"
      });
    }

  };

  /* ==========================================
     BACKEND HEALTH CHECK
  ========================================== */

  async function healthCheck() {

    try {

      const result = await http.get("HEALTH", {
        timeout: 10000
      });

      return {
        connected: true,
        data: result
      };

    } catch (error) {

      return {
        connected: false,
        error: error.message
      };

    }
  }

  /* ==========================================
     AI CHAT API
  ========================================== */

  async function sendChatMessage(message, history = []) {

    if (!message || !message.trim()) {
      throw new Error("Message cannot be empty.");
    }

    if (message.length > config.AI.CHAT.MAX_MESSAGE_LENGTH) {
      throw new Error("Message is too long.");
    }

    return http.post("CHAT", {

      message: message.trim(),

      history: history.slice(
        -config.AI.CHAT.MAX_HISTORY
      ),

      provider: "auto"

    });
  }

  /* ==========================================
     IMAGE GENERATION API
  ========================================== */

  async function generateImage(prompt) {

    if (!prompt || !prompt.trim()) {
      throw new Error("Image prompt is required.");
    }

    return http.post("IMAGE", {
      prompt: prompt.trim()
    });
  }

  /* ==========================================
     DOCUMENT ANALYSIS API
  ========================================== */

  async function analyzeDocument(content, filename) {

    return http.post("ANALYZE", {
      content,
      filename: filename || "document"
    });
  }

  /* ==========================================
     RESEARCH API
  ========================================== */

  async function research(query) {

    if (!query || !query.trim()) {
      throw new Error("Research query is required.");
    }

    return http.post("RESEARCH", {
      query: query.trim()
    });
  }

  /* ==========================================
     UPLOAD API
  ========================================== */

  async function uploadFile(file) {

    if (!(file instanceof File)) {
      throw new Error("Valid file is required.");
    }

    if (file.size > config.STORAGE.MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error("File size exceeds the allowed limit.");
    }

    if (!config.STORAGE.ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error("File type is not supported.");
    }

    const formData = new FormData();

    formData.append("file", file);

    return http.post("UPLOAD", formData);
  }

  /* ==========================================
     PUBLIC API
  ========================================== */

  const API = {

    request,

    http,

    healthCheck,

    getAuthToken,

    chat: sendChatMessage,

    generateImage,

    analyzeDocument,

    research,

    uploadFile,

    APIError

  };

  Object.freeze(API);

  Object.defineProperty(window, "KUNIQUE_API", {
    value: API,
    writable: false,
    configurable: false
  });

  console.log("[K-UNIQUE] API connector initialized.");

})(window);
        
