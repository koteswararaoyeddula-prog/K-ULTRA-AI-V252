
/*
 * K-ULTRA AI — VERSION 252
 * FILE: js/workers.js
 * Cloudflare Worker API Connector
 */

import "./config.js";
import "./auth.js";

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG;

  if (!CONFIG) {
    console.error("K-ULTRA API: Configuration not loaded.");
    return;
  }

  const API_CONFIG = CONFIG.API || {};
  const URL_CONFIG = CONFIG.URLS || {};
  const AUTH_CONFIG = CONFIG.AUTH || {};

  const DEFAULT_TIMEOUT = API_CONFIG.TIMEOUT || 60000;

  const controllers = new Map();

  // -----------------------------------------
  // URL HELPERS
  // -----------------------------------------

  function getBaseURL() {
    const url = URL_CONFIG.WORKER || API_CONFIG.BASE_URL || "";

    if (
      !url ||
      url.includes("YOUR-CLOUDFLARE-WORKER-URL")
    ) {
      throw new Error(
        "Cloudflare Worker URL is not configured in js/config.js."
      );
    }

    return url.replace(/\/+$/, "");
  }

  function getEndpoint(name) {
    const endpoints = API_CONFIG.ENDPOINTS || {};
    const endpoint = endpoints[name];

    if (!endpoint) {
      throw new Error(`API endpoint "${name}" is not configured.`);
    }

    return endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
  }

  function getURL(name) {
    return `${getBaseURL()}${getEndpoint(name)}`;
  }

  // -----------------------------------------
  // AUTHENTICATION HEADERS
  // -----------------------------------------

  async function getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };

    const authAPI = window.KULTRA?.auth;

    if (!authAPI || !authAPI.isLoggedIn()) {
      return headers;
    }

    const user = authAPI.getCurrentUser();

    if (!user || typeof user.getIdToken !== "function") {
      return headers;
    }

    try {
      const token = await user.getIdToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Could not retrieve Firebase ID token:", error);
      throw new Error("Authentication token could not be created.");
    }

    return headers;
  }

  // -----------------------------------------
  // REQUEST CONTROLLER
  // -----------------------------------------

  function createController(requestId) {
    const controller = new AbortController();

    if (requestId) {
      const previous = controllers.get(requestId);

      if (previous) {
        previous.abort();
      }

      controllers.set(requestId, controller);
    }

    return controller;
  }

  function removeController(requestId, controller) {
    if (
      requestId &&
      controllers.get(requestId) === controller
    ) {
      controllers.delete(requestId);
    }
  }

  function cancelRequest(requestId) {
    const controller = controllers.get(requestId);

    if (!controller) return false;

    controller.abort();
    controllers.delete(requestId);

    return true;
  }

  function cancelAllRequests() {
    for (const controller of controllers.values()) {
      controller.abort();
    }

    controllers.clear();
  }

  // -----------------------------------------
  // RESPONSE HANDLING
  // -----------------------------------------

  async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    let result;

    if (contentType.includes("application/json")) {
      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned invalid JSON.");
      }
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof result === "object" && result
          ? result.error || result.message
          : result;

      const error = new Error(
        message || `Request failed with status ${response.status}.`
      );

      error.status = response.status;
      error.response = result;

      throw error;
    }

    return result;
  }

  // -----------------------------------------
  // MAIN REQUEST FUNCTION
  // -----------------------------------------

  async function request(endpointName, data = {}, options = {}) {
    const method = options.method || "POST";
    const requestId = options.requestId || null;
    const timeout = options.timeout || DEFAULT_TIMEOUT;

    const controller = createController(requestId);

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const headers = await getAuthHeaders();

      const url = getURL(endpointName);

      const requestOptions = {
        method,
        headers,
        signal: controller.signal
      };

      if (method !== "GET" && method !== "HEAD") {
        requestOptions.body = JSON.stringify(data ?? {});
      }

      const response = await fetch(url, requestOptions);

      return await parseResponse(response);

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "The request was cancelled or timed out. Please try again."
        );
      }

      if (error instanceof TypeError) {
        throw new Error(
          "Could not connect to the backend. Check the Worker URL, internet connection and CORS settings."
        );
      }

      throw error;

    } finally {
      window.clearTimeout(timeoutId);
      removeController(requestId, controller);
    }
  }

  // -----------------------------------------
  // API METHODS
  // -----------------------------------------

  const API = {
    controllers,

    getURL,

    getAuthHeaders,

    request,

    cancelRequest,

    cancelAllRequests,

    health(options = {}) {
      return request("HEALTH", {}, {
        ...options,
        method: "GET"
      });
    },

    chat(messages, options = {}) {
      return request("CHAT", {
        messages,
        model: options.model || API_CONFIG.DEFAULT_MODEL || "default",
        conversationId: options.conversationId || null
      }, options);
    },

    generateImage(prompt, options = {}) {
      if (!prompt || !prompt.trim()) {
        return Promise.reject(
          new Error("Please enter an image prompt.")
        );
      }

      return request("IMAGE", {
        prompt: prompt.trim(),
        model: options.model || undefined,
        size: options.size || "1024x1024"
      }, options);
    },

    voice(payload, options = {}) {
      return request("VOICE", payload, options);
    },

    search(query, options = {}) {
      if (!query || !query.trim()) {
        return Promise.reject(
          new Error("Please enter a search query.")
        );
      }

      return request("SEARCH", {
        query: query.trim()
      }, options);
    },

    research(query, options = {}) {
      if (!query || !query.trim()) {
        return Promise.reject(
          new Error("Please enter a research topic.")
        );
      }

      return request("RESEARCH", {
        query: query.trim()
      }, options);
    },

    analyze(payload, options = {}) {
      return request("ANALYZE", payload, options);
    },

    agent(payload, options = {}) {
      return request("AGENT", payload, options);
    },

    translate(payload, options = {}) {
      return request("TRANSLATE", payload, options);
    },

    document(payload, options = {}) {
      return request("DOCUMENT", payload, options);
    }
  };

  // -----------------------------------------
  // AUTHENTICATION REQUIREMENT
  // -----------------------------------------

  function isAuthenticationRequired() {
    return AUTH_CONFIG.REQUIRE_LOGIN === true ||
      AUTH_CONFIG.REQUIRE_AUTH === true;
  }

  function ensureAuthenticated() {
    if (!isAuthenticationRequired()) {
      return true;
    }

    if (window.KULTRA?.auth?.isLoggedIn()) {
      return true;
    }

    throw new Error(
      "Please sign in before using this service."
    );
  }

  // -----------------------------------------
  // PUBLIC API
  // -----------------------------------------

  window.KULTRA = window.KULTRA || {};

  window.KULTRA.API = API;

  window.KULTRA.api = API;

  window.KULTRA.ensureAuthenticated = ensureAuthenticated;

  // -----------------------------------------
  // API CONNECTION STATUS
  // -----------------------------------------

  async function checkConnection() {
    const statusElement = document.querySelector("#backendStatus");

    if (!statusElement) {
      return false;
    }

    statusElement.textContent = "Checking backend...";
    statusElement.classList.remove("connected", "error");
    statusElement.classList.add("checking");

    try {
      await API.health({ timeout: 10000 });

      statusElement.textContent = "Backend connected";
      statusElement.classList.remove("checking", "error");
      statusElement.classList.add("connected");

      return true;

    } catch (error) {
      console.warn("Backend connection check failed:", error);

      statusElement.textContent = "Backend unavailable";
      statusElement.classList.remove("checking", "connected");
      statusElement.classList.add("error");

      return false;
    }
  }

  window.KULTRA.checkAPIConnection = checkConnection;

  console.info("K-ULTRA API connector loaded.");

})();
      
