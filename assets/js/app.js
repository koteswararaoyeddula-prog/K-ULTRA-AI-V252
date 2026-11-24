
/* =========================================
   @K-UNIQUE — MAIN APPLICATION
   VERSION: 1.1.0
   FILE: assets/js/app.js
========================================= */

(function (window, document) {
  "use strict";

  const APP = {
    initialized: false,
    currentPage: "ai",
    theme: "dark",
    backendOnline: false
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  /* NOTIFICATIONS */

  function notify(message, type = "info") {
    let container = $("#kuniqueNotifications");

    if (!container) {
      container = document.createElement("div");
      container.id = "kuniqueNotifications";
      container.className = "notification-container";
      document.body.appendChild(container);
    }

    const item = document.createElement("div");
    item.className = "app-notification " + type;
    item.textContent = String(message);

    container.appendChild(item);

    window.setTimeout(() => item.remove(), 4000);
  }

  /* SIDEBAR */

  function closeSidebar() {
    $("#sidebar")?.classList.remove("open");
    document.body.classList.remove("sidebar-open");
  }

  function toggleSidebar() {
    const sidebar = $("#sidebar");
    if (!sidebar) return;

    sidebar.classList.toggle("open");

    document.body.classList.toggle(
      "sidebar-open",
      sidebar.classList.contains("open")
    );
  }

  /* THEME */

  function applyTheme(theme) {
    APP.theme = theme === "light" ? "light" : "dark";

    document.body.classList.toggle(
      "light-theme",
      APP.theme === "light"
    );

    try {
      localStorage.setItem("kunique_theme", APP.theme);
    } catch (error) {
      console.warn("[K-UNIQUE] Theme storage unavailable.");
    }

    const button = $("#themeToggle");

    if (button) {
      button.textContent =
        APP.theme === "dark"
          ? "☀️ Light Mode"
          : "🌙 Dark Mode";

      button.setAttribute(
        "aria-label",
        "Switch to " + (APP.theme === "dark" ? "light" : "dark") + " theme"
      );
    }

    window.dispatchEvent(
      new CustomEvent("kunique:theme-changed", {
        detail: { theme: APP.theme }
      })
    );
  }

  function initializeTheme() {
    let saved = "dark";

    try {
      saved = localStorage.getItem("kunique_theme") || "dark";
    } catch (error) {}

    applyTheme(saved);
  }

  /* NAVIGATION */

  function navigate(page) {
    const pages = {
      ai: $("#aiPage"),
      history: $("#historyPage"),
      settings: $("#settingsPage")
    };

    if (!pages[page]) {
      notify("Page not available.", "error");
      return;
    }

    Object.entries(pages).forEach(([name, element]) => {
      if (element) {
        element.hidden = name !== page;
      }
    });

    APP.currentPage = page;

    $$("[data-page]").forEach(button => {
      const active = button.dataset.page === page;

      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    const heading = $(".topbar h3");

    if (heading) {
      const titles = {
        ai: "@K-UNIQUE AI",
        history: "Chat History",
        settings: "Settings"
      };

      heading.textContent = titles[page];
    }

    if (page === "history") {
      window.KUNIQUE_CHAT?.showHistory?.();
    }

    if (page === "ai") {
      window.setTimeout(() => {
        $("#messageInput")?.focus();
      }, 100);
    }

    closeSidebar();

    window.dispatchEvent(
      new CustomEvent("kunique:page-changed", {
        detail: { page }
      })
    );
  }

  function bindNavigation() {
    $$("[data-page]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        navigate(button.dataset.page);
      });
    });
  }

  /* BACKEND STATUS */

  function updateBackendStatus(state, message) {
    const status = $("#connectionStatus");
    if (!status) return;

    status.className = state;
    status.textContent = message;
  }

  async function checkBackend() {
    updateBackendStatus("checking", "Checking backend...");

    try {
      const api = window.KUNIQUE_API;

      if (!api?.healthCheck) {
        throw new Error("API connector not loaded.");
      }

      const result = await api.healthCheck();

      if (!result.connected) {
        throw new Error(result.error || "Backend offline.");
      }

      const health = result.data || {};

      APP.backendOnline = true;

      updateBackendStatus(
        "connected",
        health.status === "online"
          ? "● Backend Online"
          : "● Backend Connected"
      );

      window.dispatchEvent(
        new CustomEvent("kunique:backend-status", {
          detail: {
            online: true,
            health
          }
        })
      );

      return true;

    } catch (error) {
      APP.backendOnline = false;

      updateBackendStatus(
        "error",
        "● Backend Offline"
      );

      console.error("[K-UNIQUE] Backend error:", error);

      window.dispatchEvent(
        new CustomEvent("kunique:backend-status", {
          detail: {
            online: false,
            error: error.message
          }
        })
      );

      return false;
    }
  }

  /* FIREBASE AUTH UI */

  function initializeAuthUI() {
    const auth = window.KUNIQUE_AUTH;

    if (!auth?.onAuthStateChanged) {
      const status = $("#userStatus");

      if (status) status.textContent = "Guest";

      return;
    }

    auth.onAuthStateChanged(user => {
      const status = $("#userStatus");

      if (status) {
        status.textContent = user
          ? user.displayName || user.email || "User"
          : "Guest";
      }

      window.dispatchEvent(
        new CustomEvent("kunique:user-updated", {
          detail: { user: user || null }
        })
      );
    });
  }

  /* CONTROLS */

  function bindControls() {
    $("#menuToggle")?.addEventListener("click", toggleSidebar);

    $("#closeSidebar")?.addEventListener("click", closeSidebar);

    $("#themeToggle")?.addEventListener("click", () => {
      applyTheme(
        APP.theme === "dark" ? "light" : "dark"
      );
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    });

    document.addEventListener("click", event => {
      const sidebar = $("#sidebar");
      const menu = $("#menuToggle");

      if (
        window.innerWidth <= 768 &&
        sidebar?.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menu?.contains(event.target)
      ) {
        closeSidebar();
      }
    });

    window.addEventListener("online", () => {
      notify("Internet connection restored.", "success");
      checkBackend();
    });

    window.addEventListener("offline", () => {
      APP.backendOnline = false;
      updateBackendStatus("error", "● No Internet Connection");
    });
  }

  /* INITIALIZATION */

  function initialize() {
    if (APP.initialized) return;

    APP.initialized = true;

    initializeTheme();
    bindNavigation();
    bindControls();
    initializeAuthUI();

    // chat.js has its own guarded initialization.
    window.KUNIQUE_CHAT?.init?.();

    navigate("ai");
    checkBackend();

    console.log("[K-UNIQUE] Application initialized.");
  }

  /* PUBLIC API */

  window.KUNIQUE_APP = Object.freeze({
    initialize,
    navigate,
    notify,
    checkBackend,

    getCurrentPage: () => APP.currentPage,
    getCurrentTheme: () => APP.theme,
    isBackendOnline: () => APP.backendOnline
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

})(window, document);
     
