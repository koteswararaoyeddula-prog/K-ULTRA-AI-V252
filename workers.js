
/* =========================================================
   K-ULTRA AI — VERSION 252
   FILE: workers.js
   Cloudflare Worker API Connector
   ========================================================= */

(function () {
  "use strict";

  window.KULTRA = window.KULTRA || {};

  const API = {};

  const config =
    window.KULTRA_CONFIG || {};

  const settings =
    window.KULTRA.settings || {};

  const controllers = new Map();

  let requestCounter = 0;

  /* -------------------------------------------------------
     GET API URL
  ------------------------------------------------------- */

  API.getURL = function (endpoint) {
    if (
      settings &&
      typeof settings.getAPI === "function"
    ) {
      return settings.getAPI(endpoint);
    }

    const baseURL =
      config.API_BASE_URL ||
      config.API &&
      config.API.BASE_URL ||
      "";

    if (!baseURL) {
      throw new Error(
        "Cloudflare Worker URL is missing in config.js."
      );
    }

    return (
      baseURL.replace(/\/+$/, "") +
      "/" +
      String(endpoint || "").replace(/^\/+/, "")
    );
  };

  /* -------------------------------------------------------
     GET FIREBASE AUTH HEADERS
  ------------------------------------------------------- */

  API.getAuthHeaders = async function () {
    const headers = {
      "Accept": "application/json"
    };

    try {
      const auth =
        window.KULTRA.auth &&
        window.KULTRA.auth.firebaseAuth;

      const user =
        auth && auth.currentUser;

      if (user && !user.isAnonymous) {
        const token =
          await user.getIdToken();

        headers.Authorization =
          "Bearer " + token;
      }
    } catch (error) {
      console.warn(
        "Could not get Firebase ID token:",
        error
      );
    }

    return headers;
  };

  /* -------------------------------------------------------
     REQUEST ID
  ------------------------------------------------------- */

  API.createRequestId = function () {
    requestCounter += 1;

    return (
      "kultra_" +
      Date.now() +
      "_" +
      requestCounter
    );
  };

  /* -------------------------------------------------------
     PARSE RESPONSE
  ------------------------------------------------------- */

  API.parseResponse = async function (response) {
    const contentType =
      response.headers.get("content-type") || "";

    if (
      contentType.includes("application/json")
    ) {
      return await response.json();
    }

    return await response.text();
  };

  /* -------------------------------------------------------
     MAIN API REQUEST
  ------------------------------------------------------- */

  API.request = async function (
    endpoint,
    options
  ) {
    const opts = options || {};

    const method =
      String(opts.method || "POST").toUpperCase();

    const requestId =
      opts.requestId ||
      API.createRequestId();

    const timeout =
      Number(opts.timeout) ||
      config.API_TIMEOUT ||
      config.API &&
      config.API.TIMEOUT ||
      60000;

    const controller =
      new AbortController();

    controllers.set(requestId, controller);

    let timeoutId;

    try {
      const headers =
        await API.getAuthHeaders();

      const requestHeaders = {
        ...headers,
        ...(opts.headers || {})
      };

      let body = opts.body;

      if (
        body !== undefined &&
        body !== null &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        typeof body !== "string"
      ) {
        requestHeaders["Content-Type"] =
          "application/json";

        body = JSON.stringify(body);
      }

      if (
        body instanceof FormData ||
        body instanceof Blob
      ) {
        delete requestHeaders["Content-Type"];
      }

      timeoutId = window.setTimeout(
        function () {
          controller.abort();
        },
        timeout
      );

      const response = await fetch(
        API.getURL(endpoint),
        {
          method: method,
          headers: requestHeaders,
          body:
            method === "GET" ||
            method === "HEAD"
              ? undefined
              : body,
          signal: controller.signal,
          credentials: "omit"
        }
      );

      const data =
        await API.parseResponse(response);

      if (!response.ok) {
        let message =
          "Request failed (" +
          response.status +
          ").";

        if (
          data &&
          typeof data === "object"
        ) {
          message =
            data.error ||
            data.message ||
            message;
        } else if (
          typeof data === "string" &&
          data.trim()
        ) {
          message = data;
        }

        const error = new Error(message);

        error.status = response.status;
        error.data = data;

        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "Request timed out or was cancelled."
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
      controllers.delete(requestId);
    }
  };

  /* -------------------------------------------------------
     GET REQUEST
  ------------------------------------------------------- */

  API.get = function (
    endpoint,
    options
  ) {
    return API.request(
      endpoint,
      {
        ...(options || {}),
        method: "GET"
      }
    );
  };

  /* -------------------------------------------------------
     POST REQUEST
  ------------------------------------------------------- */

  API.post = function (
    endpoint,
    data,
    options
  ) {
    return API.request(
      endpoint,
      {
        ...(options || {}),
        method: "POST",
        body: data
      }
    );
  };

  /* -------------------------------------------------------
     CANCEL REQUEST
  ------------------------------------------------------- */

  API.cancelRequest = function (requestId) {
    const controller =
      controllers.get(requestId);

    if (controller) {
      controller.abort();
      return true;
    }

    return false;
  };

  /* -------------------------------------------------------
     CANCEL ALL REQUESTS
  ------------------------------------------------------- */

  API.cancelAllRequests = function () {
    controllers.forEach(
      function (controller) {
        controller.abort();
      }
    );

    controllers.clear();
  };

  /* -------------------------------------------------------
     HEALTH CHECK
  ------------------------------------------------------- */

  API.health = async function () {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.HEALTH ||
      "/api/health";

    return API.get(endpoint, {
      timeout: 15000
    });
  };

  /* -------------------------------------------------------
     CHAT
  ------------------------------------------------------- */

  API.chat = function (payload, options) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.CHAT ||
      "/api/chat";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     IMAGE GENERATION
  ------------------------------------------------------- */

  API.generateImage = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.IMAGE ||
      "/api/image";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     IMAGE EDITING
  ------------------------------------------------------- */

  API.editImage = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.IMAGE_EDIT ||
      "/api/image/edit";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     VOICE
  ------------------------------------------------------- */

  API.voice = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.VOICE ||
      "/api/voice";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     WEB SEARCH
  ------------------------------------------------------- */

  API.search = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.SEARCH ||
      "/api/search";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     DEEP RESEARCH
  ------------------------------------------------------- */

  API.research = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.RESEARCH ||
      "/api/research";

    return API.post(
      endpoint,
      payload,
      {
        timeout: 120000,
        ...(options || {})
      }
    );
  };

  /* -------------------------------------------------------
     DOCUMENT UPLOAD
  ------------------------------------------------------- */

  API.uploadDocument = function (
    formData,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.DOCUMENT_UPLOAD ||
      "/api/documents/upload";

    return API.post(
      endpoint,
      formData,
      options
    );
  };

  /* -------------------------------------------------------
     DOCUMENT ANALYSIS
  ------------------------------------------------------- */

  API.analyzeDocument = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.DOCUMENT_ANALYZE ||
      "/api/documents/analyze";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     CODING ASSISTANT
  ------------------------------------------------------- */

  API.coding = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.CODING ||
      "/api/coding";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     AI AGENT
  ------------------------------------------------------- */

  API.agent = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.AGENT ||
      "/api/agent";

    return API.post(
      endpoint,
      payload,
      {
        timeout: 120000,
        ...(options || {})
      }
    );
  };

  /* -------------------------------------------------------
     AGENT APPROVAL
  ------------------------------------------------------- */

  API.approveAgent = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.AGENT_APPROVE ||
      "/api/agent/approve";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     DATA ANALYSIS
  ------------------------------------------------------- */

  API.analyzeData = function (
    formData,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.DATA_ANALYZE ||
      "/api/data/analyze";

    return API.post(
      endpoint,
      formData,
      options
    );
  };

  /* -------------------------------------------------------
     PRODUCTS
  ------------------------------------------------------- */

  API.getProducts = function (
    params,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.PRODUCTS ||
      "/api/products";

    const query = new URLSearchParams();

    if (params) {
      Object.keys(params).forEach(
        function (key) {
          const value = params[key];

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            query.set(key, String(value));
          }
        }
      );
    }

    const url =
      endpoint +
      (query.toString()
        ? "?" + query.toString()
        : "");

    return API.get(url, options);
  };

  /* -------------------------------------------------------
     PRODUCT DETAILS
  ------------------------------------------------------- */

  API.getProduct = function (
    productId,
    options
  ) {
    const base =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.PRODUCT_DETAILS ||
      "/api/products";

    return API.get(
      base + "/" +
      encodeURIComponent(productId),
      options
    );
  };

  /* -------------------------------------------------------
     CART
  ------------------------------------------------------- */

  API.getCart = function (options) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.CART ||
      "/api/cart";

    return API.get(endpoint, options);
  };

  API.updateCart = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.CART ||
      "/api/cart";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     CHECKOUT
  ------------------------------------------------------- */

  API.checkout = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.CHECKOUT ||
      "/api/checkout";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     ORDERS
  ------------------------------------------------------- */

  API.getOrders = function (options) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.ORDERS ||
      "/api/orders";

    return API.get(endpoint, options);
  };

  /* -------------------------------------------------------
     PAYMENT VERIFICATION
  ------------------------------------------------------- */

  API.verifyPayment = function (
    payload,
    options
  ) {
    const endpoint =
      config.API_ENDPOINTS &&
      config.API_ENDPOINTS.PAYMENT_VERIFY ||
      "/api/payments/verify";

    return API.post(
      endpoint,
      payload,
      options
    );
  };

  /* -------------------------------------------------------
     CONNECTION STATUS UI
  ------------------------------------------------------- */

  API.setConnectionStatus = function (
    status,
    message
  ) {
    const element =
      document.getElementById("connectionStatus");

    if (!element) {
      return;
    }

    element.classList.remove(
      "connected",
      "error"
    );

    if (status === "connected") {
      element.classList.add("connected");
    } else if (status === "error") {
      element.classList.add("error");
    }

    if (message) {
      element.textContent = message;
    }
  };

  /* -------------------------------------------------------
     CHECK BACKEND CONNECTION
  ------------------------------------------------------- */

  API.checkConnection = async function () {
    API.setConnectionStatus(
      "checking",
      "Connecting..."
    );

    try {
      const result = await API.health();

      API.setConnectionStatus(
        "connected",
        "Backend connected"
      );

      return {
        connected: true,
        data: result
      };
    } catch (error) {
      console.error(
        "Backend connection error:",
        error
      );

      API.setConnectionStatus(
        "error",
        "Backend unavailable"
      );

      return {
        connected: false,
        error: error.message
      };
    }
  };

  /* -------------------------------------------------------
     EXPORT
  ------------------------------------------------------- */

  window.KULTRA.API = API;
  window.KULTRA.workers = API;

  console.log(
    "K-ULTRA AI Cloudflare API connector loaded."
  );
})();
