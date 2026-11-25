
/* =========================================================
   K-ULTRA AI — VERSION 252
   FILE: utils.js
   Common Utility Functions
   ========================================================= */

(function () {
  "use strict";

  window.KULTRA = window.KULTRA || {};

  const Utils = {};

  /* -------------------------------------------------------
     DOM HELPERS
  ------------------------------------------------------- */

  Utils.$ = function (selector, parent) {
    return (parent || document).querySelector(selector);
  };

  Utils.$$ = function (selector, parent) {
    return Array.from(
      (parent || document).querySelectorAll(selector)
    );
  };

  Utils.getElement = function (id) {
    return document.getElementById(id);
  };

  Utils.setText = function (id, text) {
    const element = Utils.getElement(id);

    if (element) {
      element.textContent = text == null ? "" : String(text);
    }
  };

  Utils.setHTML = function (id, html) {
    const element = Utils.getElement(id);

    if (element) {
      element.innerHTML = String(html || "");
    }
  };

  Utils.show = function (elementOrId) {
    const element =
      typeof elementOrId === "string"
        ? Utils.getElement(elementOrId)
        : elementOrId;

    if (element) {
      element.hidden = false;
      element.style.display = "";
    }
  };

  Utils.hide = function (elementOrId) {
    const element =
      typeof elementOrId === "string"
        ? Utils.getElement(elementOrId)
        : elementOrId;

    if (element) {
      element.hidden = true;
    }
  };

  /* -------------------------------------------------------
     HTML ESCAPE
     Prevents unsafe text from being inserted as HTML.
  ------------------------------------------------------- */

  Utils.escapeHTML = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  /* -------------------------------------------------------
     UNIQUE ID
  ------------------------------------------------------- */

  Utils.generateId = function (prefix) {
    const safePrefix = prefix || "kultra";

    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return safePrefix + "_" + window.crypto.randomUUID();
    }

    return (
      safePrefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  };

  /* -------------------------------------------------------
     LOCAL STORAGE
  ------------------------------------------------------- */

  Utils.storage = {
    get: function (key, fallback) {
      try {
        const value = localStorage.getItem(key);

        if (value === null) {
          return fallback === undefined ? null : fallback;
        }

        try {
          return JSON.parse(value);
        } catch (_) {
          return value;
        }
      } catch (error) {
        console.warn("K-ULTRA storage read error:", error);
        return fallback === undefined ? null : fallback;
      }
    },

    set: function (key, value) {
      try {
        const storedValue =
          typeof value === "string"
            ? value
            : JSON.stringify(value);

        localStorage.setItem(key, storedValue);
        return true;
      } catch (error) {
        console.warn("K-ULTRA storage write error:", error);
        return false;
      }
    },

    remove: function (key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn("K-ULTRA storage remove error:", error);
        return false;
      }
    },

    clear: function () {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn("K-ULTRA storage clear error:", error);
        return false;
      }
    }
  };

  /* -------------------------------------------------------
     TOAST NOTIFICATIONS
  ------------------------------------------------------- */

  Utils.toast = function (message, type, duration) {
    const container = Utils.getElement("toastContainer");

    if (!container) {
      console.log("[K-ULTRA]", message);
      return;
    }

    const toast = document.createElement("div");

    toast.className =
      "toast toast-" + (type || "info");

    toast.setAttribute("role", "status");
    toast.textContent = String(message || "");

    container.appendChild(toast);

    const timeout =
      Number.isFinite(duration) && duration > 0
        ? duration
        : 3500;

    window.setTimeout(function () {
      toast.classList.add("toast-hiding");

      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, timeout);
  };

  Utils.success = function (message) {
    Utils.toast(message, "success");
  };

  Utils.error = function (message) {
    Utils.toast(message, "error");
  };

  Utils.warning = function (message) {
    Utils.toast(message, "warning");
  };

  Utils.info = function (message) {
    Utils.toast(message, "info");
  };

  /* -------------------------------------------------------
     DEBOUNCE
  ------------------------------------------------------- */

  Utils.debounce = function (callback, delay) {
    let timeoutId;

    return function () {
      const context = this;
      const args = arguments;

      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(function () {
        callback.apply(context, args);
      }, delay || 300);
    };
  };

  /* -------------------------------------------------------
     THROTTLE
  ------------------------------------------------------- */

  Utils.throttle = function (callback, delay) {
    let lastCall = 0;

    return function () {
      const now = Date.now();

      if (now - lastCall < (delay || 300)) {
        return;
      }

      lastCall = now;
      return callback.apply(this, arguments);
    };
  };

  /* -------------------------------------------------------
     CURRENCY FORMATTER
  ------------------------------------------------------- */

  Utils.formatCurrency = function (amount, currency) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "₹0.00";
    }

    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2
      }).format(value);
    } catch (_) {
      return "₹" + value.toFixed(2);
    }
  };

  /* -------------------------------------------------------
     DATE FORMATTER
  ------------------------------------------------------- */

  Utils.formatDate = function (date, options) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      options || {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    ).format(parsedDate);
  };

  Utils.formatDateTime = function (date) {
    return Utils.formatDate(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  /* -------------------------------------------------------
     FILE SIZE FORMATTER
  ------------------------------------------------------- */

  Utils.formatFileSize = function (bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size <= 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(
      Math.floor(Math.log(size) / Math.log(1024)),
      units.length - 1
    );

    const formatted =
      size / Math.pow(1024, index);

    return formatted.toFixed(index === 0 ? 0 : 2) +
      " " +
      units[index];
  };

  /* -------------------------------------------------------
     FILE VALIDATION
  ------------------------------------------------------- */

  Utils.validateFile = function (file, options) {
    const settings = options || {};

    if (!file) {
      return {
        valid: false,
        message: "Please select a file."
      };
    }

    const maxSize =
      settings.maxSize ||
      20 * 1024 * 1024;

    if (file.size > maxSize) {
      return {
        valid: false,
        message:
          "File is too large. Maximum allowed size is " +
          Utils.formatFileSize(maxSize) +
          "."
      };
    }

    if (
      Array.isArray(settings.allowedTypes) &&
      settings.allowedTypes.length > 0
    ) {
      const allowed = settings.allowedTypes.some(
        function (type) {
          return (
            file.type === type ||
            file.name.toLowerCase().endsWith(
              String(type).toLowerCase()
            )
          );
        }
      );

      if (!allowed) {
        return {
          valid: false,
          message: "This file type is not supported."
        };
      }
    }

    return {
      valid: true,
      message: "File is valid."
    };
  };

  /* -------------------------------------------------------
     FILE EXTENSION
  ------------------------------------------------------- */

  Utils.getFileExtension = function (filename) {
    const name = String(filename || "");
    const index = name.lastIndexOf(".");

    if (index === -1) {
      return "";
    }

    return name.slice(index + 1).toLowerCase();
  };

  /* -------------------------------------------------------
     DOWNLOAD TEXT / BLOB
  ------------------------------------------------------- */

  Utils.downloadBlob = function (
    blob,
    filename
  ) {
    if (!(blob instanceof Blob)) {
      Utils.error("Invalid download file.");
      return false;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename || "download";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  };

  Utils.downloadText = function (
    text,
    filename,
    mimeType
  ) {
    const blob = new Blob(
      [String(text == null ? "" : text)],
      {
        type: mimeType || "text/plain;charset=utf-8"
      }
    );

    return Utils.downloadBlob(
      blob,
      filename || "download.txt"
    );
  };

  /* -------------------------------------------------------
     COPY TO CLIPBOARD
  ------------------------------------------------------- */

  Utils.copyText = async function (text) {
    const value = String(text == null ? "" : text);

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(value);
        return true;
      }

      const textarea = document.createElement("textarea");

      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand("copy");

      textarea.remove();

      return success;
    } catch (error) {
      console.warn("Clipboard error:", error);
      return false;
    }
  };

  /* -------------------------------------------------------
     LOADING BUTTON
  ------------------------------------------------------- */

  Utils.setButtonLoading = function (
    button,
    loading,
    loadingText
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText =
          button.textContent;
      }

      button.disabled = true;
      button.setAttribute("aria-busy", "true");

      button.textContent =
        loadingText || "Please wait...";
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");

      if (button.dataset.originalText) {
        button.textContent =
          button.dataset.originalText;

        delete button.dataset.originalText;
      }
    }
  };

  /* -------------------------------------------------------
     ERROR MESSAGE
  ------------------------------------------------------- */

  Utils.getErrorMessage = function (error) {
    if (!error) {
      return "Something went wrong. Please try again.";
    }

    if (typeof error === "string") {
      return error;
    }

    if (error.message) {
      return String(error.message);
    }

    return "An unexpected error occurred.";
  };

  /* -------------------------------------------------------
     SAFE JSON PARSE
  ------------------------------------------------------- */

  Utils.parseJSON = function (value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback === undefined ? null : fallback;
    }
  };

  /* -------------------------------------------------------
     CLAMP NUMBER
  ------------------------------------------------------- */

  Utils.clamp = function (value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(
      Math.max(number, min),
      max
    );
  };

  /* -------------------------------------------------------
     NETWORK STATUS
  ------------------------------------------------------- */

  Utils.isOnline = function () {
    return navigator.onLine !== false;
  };

  /* -------------------------------------------------------
     SAFE EVENT LISTENER
  ------------------------------------------------------- */

  Utils.on = function (
    elementOrId,
    eventName,
    callback,
    options
  ) {
    const element =
      typeof elementOrId === "string"
        ? Utils.getElement(elementOrId)
        : elementOrId;

    if (!element || typeof callback !== "function") {
      return false;
    }

    element.addEventListener(
      eventName,
      callback,
      options || false
    );

    return true;
  };

  /* -------------------------------------------------------
     EXPORT
  ------------------------------------------------------- */

  window.KULTRA.utils = Utils;

  console.log(
    "K-ULTRA AI utilities loaded successfully."
  );
})();
