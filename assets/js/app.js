
/* =========================================
   @K-UNIQUE — MAIN APPLICATION
   VERSION: 1.0.0
   FILE: assets/js/app.js
========================================= */

(function (window, document) {
  "use strict";

  const APP = {
    initialized: false,
    currentPage: "ai",
    theme: "dark"
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

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
    item.textContent = message;

    container.appendChild(item);

    setTimeout(() => item.remove(), 4000);
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
      console.warn("Theme storage unavailable.");
    }

    const button = $("#themeToggle");

    if (button) {
      button.textContent =
        APP.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
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
    const aiPage = $("#aiPage");
    const historyPage = $("#historyPage");
    const settingsPage = $("#settingsPage");

    const pages = {
      ai: aiPage,
      history: historyPage,
      settings: settingsPage
    };

    if (!pages[page]) {
      notify("Page not available.", "error");
      return;
    }

    Object.entries(pages).forEach(([name, element]) => {
      if (element) element.hidden = name !== page;
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
      heading.textContent =
        page === "ai" ? "@K-UNIQUE AI" :
        page === "history" ? "Chat History" :
        "Settings";
    }

    if (page === "history") {
      window.KUNIQUE_CHAT?.showHistory?.();
    }

    if (page === "ai") {
      setTimeout(() => $("#messageInput")?.focus(), 100);
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

  async function checkBackend() {
    const status = $("#connectionStatus");

    if (status) {
      status.textContent = "Checking backend...";
      status.className = "checking";
    }

    try {
      if (!window.KUNIQUE_API?.healthCheck) {
        throw new Error("API connector not loaded.");
      }

      const result = await window.KUNIQUE_API.healthCheck();

      if (!result.connected) {
        throw new Error(result.error || "Backend offline.");
      }

      const health = result.data || {};

      if (status) {
        status.textContent =
          health.status === "online"
            ? "● Backend Online"
            : "● Connected";

        status.className = "connected";
      }

      return true;

    } catch (error) {
      if (status) {
        status.textContent = "● Backend Offline";
        status.className = "error";
      }

      console.error("[K-UNIQUE] Backend:", error);
      return false;
    }
  }

  /* AUTH UI */

  function initializeAuthUI() {
    const auth = window.KUNIQUE_AUTH;

    if (!auth?.onAuthStateChanged) return;

    auth.onAuthStateChanged(user => {
      const status = $("#userStatus");

      if (status) {
        status.textContent = user
          ? user.displayName || user.email || "User"
          : "Guest";
      }
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
      if (event.key === "Escape") closeSidebar();
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
  }

  /* INITIALIZATION */

  function initialize() {
    if (APP.initialized) return;

    APP.initialized = true;

    initializeTheme();
    bindNavigation();
    bindControls();
    initializeAuthUI();

    if (window.KUNIQUE_CHAT?.init) {
      window.KUNIQUE_CHAT.init();
    }

    navigate("ai");
    checkBackend();

    console.log("@K-UNIQUE application initialized.");
  }

  window.KUNIQUE_APP = Object.freeze({
    initialize,
    navigate,
    notify,
    checkBackend,
    getCurrentPage: () => APP.currentPage,
    getCurrentTheme: () => APP.theme
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

})(window, document);
