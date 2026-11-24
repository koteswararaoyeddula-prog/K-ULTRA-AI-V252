
/* =========================================
   @K-UNIQUE — MAIN APPLICATION
   Version 1.0.0
   ========================================= */

(function () {
  "use strict";

  const CONFIG = window.KUNIQUE_CONFIG || {};

  const APP = {
    initialized: false,
    currentPage: "home",
    theme: "dark"
  };

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const MODULES = {
    home: {
      title: "Home",
      icon: "🏠",
      description: "Welcome to @K-UNIQUE."
    },
    ai: {
      title: "Artificial Intelligence",
      icon: "🤖",
      description: "Your intelligent AI workspace."
    },
    ecommerce: {
      title: "E-Commerce",
      icon: "🛍️",
      description: "Discover products and online shopping."
    },
    it: {
      title: "IT Services",
      icon: "💻",
      description: "Technology solutions and IT services."
    },
    cybersecurity: {
      title: "Cybersecurity",
      icon: "🛡️",
      description: "Security tools and digital protection."
    },
    education: {
      title: "Education",
      icon: "🎓",
      description: "Learn, explore and improve your skills."
    },
    business: {
      title: "Business",
      icon: "📊",
      description: "Business tools and productivity."
    },
    community: {
      title: "Community",
      icon: "🌐",
      description: "Connect with the community."
    },
    messages: {
      title: "Messages",
      icon: "💬",
      description: "Your conversations and messages."
    },
    profile: {
      title: "My Profile",
      icon: "👤",
      description: "Manage your account profile."
    },
    settings: {
      title: "Settings",
      icon: "⚙️",
      description: "Customize your experience."
    }
  };

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

    setTimeout(() => {
      item.remove();
    }, 4000);
  }

  function setConnectionStatus(status, message) {
    const indicator = $("#connectionStatus");
    const text = $("#connectionText");

    if (indicator) {
      indicator.classList.remove(
        "connected",
        "error",
        "checking"
      );

      indicator.classList.add(status);
    }

    if (text) {
      text.textContent = message;
    }
  }

  async function checkBackend() {
    setConnectionStatus("checking", "Connecting...");

    try {
      if (!window.KUNIQUE_API?.healthCheck) {
        throw new Error("API connector unavailable.");
      }

      await window.KUNIQUE_API.healthCheck();

      setConnectionStatus("connected", "Connected");
      return true;

    } catch (error) {
      setConnectionStatus("error", "Backend Offline");
      console.warn("[K-UNIQUE] Backend connection:", error);
      return false;
    }
  }

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

  function setPageTitle(title) {
    const element = $("#pageTitle");

    if (element) {
      element.textContent = title;
    }
  }

  function activateNavigation(page) {
    $$("[data-page]").forEach(link => {
      const active = link.dataset.page === page;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function renderModule(page) {
    const module = MODULES[page];

    if (!module) return;

    const home = $("#home");
    const otherPage = $("#otherPage");

    if (page === "home") {
      if (home) home.hidden = false;
      if (otherPage) otherPage.hidden = true;

      setPageTitle("Home");
      return;
    }

    if (home) home.hidden = true;
    if (otherPage) otherPage.hidden = false;

    const icon = $("#activeModuleIcon");
    const title = $("#activeModuleTitle");
    const description = $("#activeModuleDescription");
    const content = $("#moduleContent");

    if (icon) icon.textContent = module.icon;
    if (title) title.textContent = module.title;
    if (description) description.textContent = module.description;

    setPageTitle(module.title);

    if (content) {
      content.replaceChildren();

      const panel = document.createElement("section");
      panel.className = "module-placeholder";

      const heading = document.createElement("h3");
      heading.textContent = module.title;

      const paragraph = document.createElement("p");
      paragraph.textContent =
        module.description +
        " This workspace is ready for its dedicated features.";

      panel.append(heading, paragraph);

      if (page === "ai") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-primary";
        button.textContent = "Start AI Chat";

        button.addEventListener("click", () => {
          openAIChat();
        });

        panel.appendChild(button);
      }

      content.appendChild(panel);
    }

    if (page === "ai") {
      openAIChat();
    }
  }

  function navigate(page) {
    if (!MODULES[page]) {
      notify("Page not found.", "error");
      return;
    }

    APP.currentPage = page;

    renderModule(page);
    activateNavigation(page);
    closeSidebar();

    window.dispatchEvent(
      new CustomEvent("kunique:page-changed", {
        detail: { page }
      })
    );
  }

  function openAIChat() {
    if (window.KUNIQUE_CHAT) {
      window.KUNIQUE_CHAT.initialize();
    }

    const chatInput = $(
      "#chatInput, #messageInput, [data-chat-input]"
    );

    if (chatInput) {
      setTimeout(() => chatInput.focus(), 100);
    }
  }

  function applyTheme(theme) {
    const selected = theme === "light" ? "light" : "dark";

    APP.theme = selected;

    document.body.classList.toggle(
      "light-theme",
      selected === "light"
    );

    try {
      localStorage.setItem("kunique_theme", selected);
    } catch (error) {
      console.warn("[K-UNIQUE] Theme storage unavailable.");
    }

    const button = $("#themeToggle");

    if (button) {
      button.setAttribute(
        "aria-label",
        selected === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );

      button.textContent = selected === "dark" ? "☀️" : "🌙";
    }
  }

  function initializeTheme() {
    let saved = "dark";

    try {
      saved = localStorage.getItem("kunique_theme") || "dark";
    } catch (error) {
      console.warn("[K-UNIQUE] Could not read theme preference.");
    }

    applyTheme(saved);
  }

  function bindNavigation() {
    $$("[data-navigate], [data-page]").forEach(element => {
      element.addEventListener("click", event => {
        event.preventDefault();

        const page =
          element.dataset.navigate ||
          element.dataset.page;

        if (page) navigate(page);
      });
    });
  }

  function bindControls() {
    $("#menuToggle")?.addEventListener("click", toggleSidebar);

    $("#themeToggle")?.addEventListener("click", () => {
      applyTheme(
        APP.theme === "dark" ? "light" : "dark"
      );
    });

    $("#notificationButton")?.addEventListener("click", () => {
      notify("You are all caught up!", "info");
    });

    $("#logoutButton")?.addEventListener("click", async () => {
      try {
        await window.KUNIQUE_AUTH?.logout();
        notify("Logged out successfully.", "success");
      } catch (error) {
        notify(error.message, "error");
      }
    });

    document.addEventListener("click", event => {
      const sidebar = $("#sidebar");
      const menuButton = $("#menuToggle");

      if (
        window.innerWidth <= 768 &&
        sidebar?.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuButton?.contains(event.target)
      ) {
        closeSidebar();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    });
  }

  function initializeAuthUI() {
    if (!window.KUNIQUE_AUTH) return;

    window.KUNIQUE_AUTH.onAuthStateChanged(user => {
      const loginButton = $("#loginButton");
      const userName = $("#userName");
      const userAvatar = $("#userAvatar");

      if (loginButton) {
        loginButton.hidden = Boolean(user);
      }

      if (userName) {
        userName.textContent = user
          ? user.displayName || user.email || "User"
          : "Guest";
      }

      if (userAvatar) {
        userAvatar.textContent = user
          ? (user.displayName || user.email || "U")
              .charAt(0)
              .toUpperCase()
          : "G";
      }

      window.dispatchEvent(
        new CustomEvent("kunique:user-updated", {
          detail: { user }
        })
      );
    });
  }

  function initialize() {
    if (APP.initialized) return;

    APP.initialized = true;

    initializeTheme();
    bindNavigation();
    bindControls();
    initializeAuthUI();

    if (window.KUNIQUE_CHAT) {
      window.KUNIQUE_CHAT.initialize();
    }

    navigate("home");
    checkBackend();

    console.log(
      "@K-UNIQUE application initialized successfully."
    );
  }

  window.KUNIQUE_APP = Object.freeze({
    initialize,
    navigate,
    notify,
    checkBackend,
    getCurrentPage: () => APP.currentPage,
    getCurrentTheme: () => APP.theme,
    getModules: () => ({ ...MODULES })
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

})();
