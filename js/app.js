
/*
 * K-ULTRA AI — VERSION 252
 * FILE: js/app.js
 * Main Application Controller
 */

import "./config.js";
import "./auth.js";
import "./workers.js";
import "./i18n.js";
import "./chat.js";

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG;

  if (!CONFIG) {
    console.error("K-ULTRA AI: Configuration not loaded.");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const STORAGE = CONFIG.STORAGE || {};
  const KEYS = {
    theme: STORAGE.THEME || "kultra_theme",
    language: STORAGE.LANGUAGE || "kultra_language",
    lastPage: STORAGE.LAST_PAGE || "kultra_last_page"
  };

  const state = {
    currentPage: "home",
    currentTheme: CONFIG.APP?.DEFAULT_THEME || "midnight",
    sidebarOpen: false,
    backendConnected: false
  };

  const pages = {
    dashboard: {
      title: "Dashboard",
      icon: "📊",
      description: "Your K-ULTRA AI workspace and activity overview.",
      features: ["Workspace overview", "Quick access", "Recent activity"]
    },
    discover: {
      title: "Discover",
      icon: "✨",
      description: "Explore the tools and services available in K-ULTRA AI.",
      features: ["AI tools", "Developer tools", "Productivity tools"]
    },
    "ai-chat": {
      title: "AI Chat",
      icon: "🤖",
      description: "Your AI conversation workspace.",
      features: ["Conversation interface", "Chat history support", "AI backend connection required"]
    },
    "model-hub": {
      title: "AI Model Hub",
      icon: "🧠",
      description: "Manage available AI providers and model settings.",
      features: ["Provider settings", "Model selection", "Connection status"]
    },
    "image-ai": {
      title: "Image AI",
      icon: "🎨",
      description: "AI image generation workspace.",
      features: ["Image prompt workspace", "Generation settings", "Image API connection required"]
    },
    "voice-ai": {
      title: "Voice AI",
      icon: "🎙️",
      description: "Voice assistant workspace.",
      features: ["Voice input interface", "Speech settings", "Voice API connection required"]
    },
    research: {
      title: "AI Research",
      icon: "🔎",
      description: "Research and organize information with AI assistance.",
      features: ["Research workspace", "Source organization", "Search API connection required"]
    },
    "ai-agents": {
      title: "AI Agents",
      icon: "🦾",
      description: "Workspace for creating and managing AI agents.",
      features: ["Agent workspace", "Task configuration", "Agent backend required"]
    },
    documents: {
      title: "AI Documents",
      icon: "📄",
      description: "Document creation and AI-assisted writing workspace.",
      features: ["Document workspace", "Writing tools", "Export support to be added"]
    },
    "code-studio": {
      title: "Code Studio",
      icon: "💻",
      description: "Your programming and development workspace.",
      features: ["Code editor integration to be added", "Project workspace", "Live preview integration to be added"]
    },
    playground: {
      title: "Code Playground",
      icon: "🧪",
      description: "Experiment with code in a dedicated workspace.",
      features: ["Code experiments", "Language selection", "Secure execution engine required"]
    },
    "website-builder": {
      title: "Website Builder",
      icon: "🌐",
      description: "Plan and build websites using development tools.",
      features: ["Website workspace", "HTML/CSS/JS tools", "Preview integration to be added"]
    },
    "api-lab": {
      title: "API Lab",
      icon: "🔌",
      description: "Explore and test API integrations.",
      features: ["API request workspace", "Response viewer", "Secure API configuration"]
    },
    github: {
      title: "GitHub Workspace",
      icon: "🐙",
      description: "Connect your development workflow with GitHub.",
      features: ["Repository integration", "Source control", "GitHub connection required"]
    },
    "dev-tools": {
      title: "Developer Tools",
      icon: "🛠️",
      description: "A collection of useful developer utilities.",
      features: ["Code utilities", "Formatting tools", "Developer workspace"]
    },
    database: {
      title: "Database",
      icon: "🗄️",
      description: "Database management workspace.",
      features: ["Database configuration", "Data management", "Secure database connection required"]
    },
    security: {
      title: "Security Center",
      icon: "🛡️",
      description: "Security settings and account protection.",
      features: ["Security overview", "Authentication settings", "Security configuration"]
    },
    store: {
      title: "AI Store",
      icon: "🛍️",
      description: "Discover products and services.",
      features: ["Product catalogue", "Product details", "Database and payment integration required"]
    },
    marketplace: {
      title: "Marketplace",
      icon: "🏪",
      description: "Explore the marketplace workspace.",
      features: ["Marketplace listings", "Categories", "Backend integration required"]
    },
    seller: {
      title: "Seller Center",
      icon: "📦",
      description: "Seller tools and product management.",
      features: ["Seller dashboard", "Product management", "Seller authentication required"]
    },
    orders: {
      title: "Orders",
      icon: "🧾",
      description: "Order management workspace.",
      features: ["Order overview", "Order tracking", "Database integration required"]
    },
    learning: {
      title: "Learning Center",
      icon: "🎓",
      description: "Learn technology and develop new skills.",
      features: ["Learning resources", "Study workspace", "Progress tracking to be added"]
    },
    courses: {
      title: "Courses",
      icon: "📚",
      description: "Explore courses and learning materials.",
      features: ["Course catalogue", "Course details", "Learning database required"]
    },
    projects: {
      title: "Projects",
      icon: "📁",
      description: "Organize your personal and development projects.",
      features: ["Project workspace", "Project organization", "Cloud storage integration required"]
    },
    career: {
      title: "Career Center",
      icon: "🚀",
      description: "Career preparation and professional development.",
      features: ["Career resources", "Interview preparation", "Learning plans"]
    },
    cloud: {
      title: "Cloud Workspace",
      icon: "☁️",
      description: "Your cloud productivity workspace.",
      features: ["Cloud services", "Storage configuration", "Cloud provider integration required"]
    },
    files: {
      title: "File Manager",
      icon: "📂",
      description: "Manage files in your workspace.",
      features: ["File workspace", "Upload interface to be added", "Cloud storage integration required"]
    },
    "documents-editor": {
      title: "Document Editor",
      icon: "📝",
      description: "Create and organize documents.",
      features: ["Document workspace", "Editing tools to be added", "Cloud saving to be added"]
    },
    tasks: {
      title: "Tasks",
      icon: "✅",
      description: "Organize your daily tasks.",
      features: ["Task workspace", "Task organization", "Persistent task storage to be added"]
    },
    calendar: {
      title: "Calendar",
      icon: "📅",
      description: "Plan your schedule and activities.",
      features: ["Calendar workspace", "Event planning", "Calendar integration to be added"]
    },
    team: {
      title: "Team Workspace",
      icon: "👥",
      description: "Team collaboration workspace.",
      features: ["Team organization", "Collaboration tools", "User and database integration required"]
    },
    community: {
      title: "Community",
      icon: "🌍",
      description: "Connect and collaborate with the community.",
      features: ["Community workspace", "Discussion interface to be added", "Moderation and database required"]
    },
    utilities: {
      title: "Utilities",
      icon: "🧰",
      description: "Useful tools for everyday work.",
      features: ["Text utilities", "Conversion tools", "Developer utilities"]
    },
    analytics: {
      title: "Analytics",
      icon: "📈",
      description: "View application and workspace analytics.",
      features: ["Analytics dashboard", "Activity reports", "Data integration required"]
    },
    settings: {
      title: "Settings",
      icon: "⚙️",
      description: "Customize your K-ULTRA AI experience.",
      features: ["Theme settings", "Application preferences", "Connection settings"]
    },
    help: {
      title: "Help Center",
      icon: "❓",
      description: "Get help using K-ULTRA AI.",
      features: ["Getting started", "Troubleshooting", "Documentation"]
    },
    plans: {
      title: "Plans",
      icon: "💎",
      description: "Plan and subscription information.",
      features: ["Plan overview", "Feature comparison", "Payment integration required"]
    },
    profile: {
      title: "My Profile",
      icon: "👤",
      description: "Your account and profile workspace.",
      features: ["Profile information", "Account settings", "Firebase authentication required"]
    }
  };

  // -----------------------------------------
  // DOM ELEMENTS
  // -----------------------------------------

  const elements = {
    body: document.body,
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebarOverlay"),
    menuToggle: $("#menuToggle"),
    closeSidebar: $("#closeSidebar"),
    pageTitle: $("#pageTitle"),
    pageHome: $("#page-home"),
    pageModule: $("#page-module"),
    moduleIcon: $("#moduleIcon"),
    moduleTitle: $("#moduleTitle"),
    moduleDescription: $("#moduleDescription"),
    moduleContent: $("#moduleContent"),
    menuSearch: $("#menuSearch"),
    globalSearch: $("#globalSearch"),
    themeQuickButton: $("#themeQuickButton"),
    notificationButton: $("#notificationButton"),
    connectionStatus: $("#connectionStatus"),
    frontendStatus: $("#frontendStatus"),
    backendStatus: $("#backendStatus"),
    authStatus: $("#authStatus"),
    aiStatus: $("#aiStatus")
  };

  // -----------------------------------------
  // NOTIFICATIONS
  // -----------------------------------------

  function showToast(message, type = "info") {
    let container = $("#kultraToastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "kultraToastContainer";
      container.style.cssText = [
        "position:fixed",
        "right:18px",
        "bottom:18px",
        "z-index:99999",
        "display:flex",
        "flex-direction:column",
        "gap:10px",
        "max-width:min(360px, calc(100vw - 36px))"
      ].join(";");

      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.setAttribute("role", "status");

    toast.style.cssText = [
      "padding:13px 17px",
      "border:1px solid var(--border, #30394d)",
      "border-radius:12px",
      "background:var(--card, #151d30)",
      "color:var(--text, #ffffff)",
      "box-shadow:0 8px 30px rgba(0,0,0,.25)",
      "font-size:14px",
      "line-height:1.5",
      "overflow-wrap:anywhere"
    ].join(";");

    if (type === "error") {
      toast.style.borderColor = "#e05252";
    }

    container.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // -----------------------------------------
  // THEME MANAGEMENT
  // -----------------------------------------

  function applyTheme(themeName, save = true) {
    const availableThemes = CONFIG.THEMES || {};
    const themeExists =
      Object.prototype.hasOwnProperty.call(availableThemes, themeName);

    const theme = themeExists
      ? themeName
      : (CONFIG.APP?.DEFAULT_THEME || "midnight");

    state.currentTheme = theme;

    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;

    document.documentElement.classList.forEach(className => {
      if (className.startsWith("theme-")) {
        document.documentElement.classList.remove(className);
      }
    });

    document.body.classList.forEach(className => {
      if (className.startsWith("theme-")) {
        document.body.classList.remove(className);
      }
    });

    document.documentElement.classList.add(`theme-${theme}`);
    document.body.classList.add(`theme-${theme}`);

    if (save) {
      try {
        localStorage.setItem(KEYS.theme, theme);
      } catch (error) {
        console.warn("Theme preference could not be saved.", error);
      }
    }

    document.dispatchEvent(
      new CustomEvent("kultra:themechange", {
        detail: { theme }
      })
    );
  }

  function loadTheme() {
    let savedTheme = null;

    try {
      savedTheme = localStorage.getItem(KEYS.theme);
    } catch (error) {
      console.warn("Could not read saved theme.", error);
    }

    applyTheme(savedTheme || state.currentTheme, false);
  }

  function cycleTheme() {
    const themeNames = Object.keys(CONFIG.THEMES || {});

    if (!themeNames.length) {
      showToast("No themes are configured.");
      return;
    }

    const currentIndex = themeNames.indexOf(state.currentTheme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    const nextTheme = themeNames[nextIndex];

    applyTheme(nextTheme);
    showToast(`Theme changed to ${nextTheme}.`);
  }

  // -----------------------------------------
  // SIDEBAR
  // -----------------------------------------

  function openSidebar() {
    state.sidebarOpen = true;

    elements.sidebar?.classList.add("active");
    elements.sidebarOverlay?.classList.add("active");

    elements.menuToggle?.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    state.sidebarOpen = false;

    elements.sidebar?.classList.remove("active");
    elements.sidebarOverlay?.classList.remove("active");

    elements.menuToggle?.setAttribute("aria-expanded", "false");
  }

  // -----------------------------------------
  // PAGE NAVIGATION
  // -----------------------------------------

  function renderModulePage(route) {
    const page = pages[route];

    if (!page || !elements.moduleContent) {
      return;
    }

    if (elements.moduleIcon) {
      elements.moduleIcon.textContent = page.icon;
    }

    if (elements.moduleTitle) {
      elements.moduleTitle.textContent = page.title;
    }

    if (elements.moduleDescription) {
      elements.moduleDescription.textContent = page.description;
    }

    if (elements.pageTitle) {
      elements.pageTitle.textContent = page.title;
    }

    elements.moduleContent.replaceChildren();

    const intro = document.createElement("div");
    intro.className = "module-intro";

    const heading = document.createElement("h3");
    heading.textContent = "Workspace";

    const paragraph = document.createElement("p");
    paragraph.textContent =
      "This workspace is part of K-ULTRA AI Version 252. Its full functionality will be connected in the upcoming module development steps.";

    intro.append(heading, paragraph);

    const featureGrid = document.createElement("div");
    featureGrid.className = "feature-grid";

    page.features.forEach(feature => {
      const card = document.createElement("div");
      card.className = "feature-card";

      const cardText = document.createElement("p");
      cardText.textContent = feature;

      card.appendChild(cardText);
      featureGrid.appendChild(card);
    });

    const status = document.createElement("p");
    status.className = "module-setup-note";
    status.textContent =
      "Module interface available — feature integration is still in progress.";

    elements.moduleContent.append(intro, featureGrid, status);
  }

  function navigateTo(route) {
    const target = route === "home" ? "home" : route;

    if (target !== "home" && !pages[target]) {
      showToast("This page is not available yet.", "error");
      return;
    }

    state.currentPage = target;

    const isHome = target === "home";

    if (elements.pageHome) {
      elements.pageHome.hidden = !isHome;
    }

    if (elements.pageModule) {
      elements.pageModule.hidden = isHome;
    }

    if (isHome) {
      if (elements.pageTitle) {
        elements.pageTitle.textContent = "Home";
      }
    } else {
      renderModulePage(target);
    }

    $$("[data-route]").forEach(button => {
      const active = button.dataset.route === target;

      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    try {
      localStorage.setItem(KEYS.lastPage, target);
    } catch (error) {
      console.warn("Could not save current page.", error);
    }

    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    document.dispatchEvent(
      new CustomEvent("kultra:navigate", {
        detail: { page: target }
      })
    );
  }

  // -----------------------------------------
  // NAVIGATION SEARCH
  // -----------------------------------------

  function filterNavigation(searchValue) {
    const query = searchValue.trim().toLowerCase();

    $$("[data-route]").forEach(item => {
      const route = item.dataset.route || "";
      const page = pages[route];

      const searchableText = [
        item.textContent,
        route,
        page?.title,
        page?.description
      ].join(" ").toLowerCase();

      item.hidden = Boolean(query) && !searchableText.includes(query);
    });
  }

  function handleGlobalSearch(value) {
    const query = value.trim().toLowerCase();

    if (!query) {
      return;
    }

    const match = Object.entries(pages).find(([route, page]) => {
      return (
        page.title.toLowerCase().includes(query) ||
        route.includes(query) ||
        page.description.toLowerCase().includes(query)
      );
    });

    if (match) {
      navigateTo(match[0]);
      return;
    }

    const homeMatches = ["home", "dashboard", "welcome"];

    if (homeMatches.some(term => term.includes(query))) {
      navigateTo("home");
      return;
    }

    showToast("No matching workspace found.");
  }

  // -----------------------------------------
  // BACKEND HEALTH CHECK
  // -----------------------------------------

  function setStatus(element, message, statusClass) {
    if (!element) return;

    element.textContent = message;
    element.classList.remove("connected", "error", "checking");
    element.classList.add(statusClass);
  }

  async function checkBackend() {
    const workerURL = CONFIG.URLS?.WORKER;
    const healthPath = CONFIG.API?.ENDPOINTS?.HEALTH || "/api/health";

    if (
      !workerURL ||
      workerURL.includes("YOUR-CLOUDFLARE-WORKER-URL")
    ) {
      state.backendConnected = false;

      setStatus(elements.backendStatus, "Backend not configured", "error");
      setStatus(elements.connectionStatus, "Backend not configured", "error");

      return false;
    }

    setStatus(elements.backendStatus, "Checking backend...", "checking");

    try {
      const baseURL = workerURL.replace(/\/+$/, "");
      const endpoint = healthPath.startsWith("/")
        ? healthPath
        : `/${healthPath}`;

      const controller = new AbortController();
      const timeout = window.setTimeout(
        () => controller.abort(),
        10000
      );

      let response;

      try {
        response = await fetch(`${baseURL}${endpoint}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
          signal: controller.signal
        });
      } finally {
        window.clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      state.backendConnected = true;

      setStatus(elements.backendStatus, "Backend connected", "connected");
      setStatus(elements.connectionStatus, "Connected", "connected");

      return true;
    } catch (error) {
      state.backendConnected = false;

      console.warn("K-ULTRA backend health check failed:", error);

      setStatus(elements.backendStatus, "Backend unavailable", "error");
      setStatus(elements.connectionStatus, "Connection unavailable", "error");

      return false;
    }
  }

  // -----------------------------------------
  // APPLICATION STATUS
  // -----------------------------------------

  function initializeStatus() {
    setStatus(elements.frontendStatus, "Frontend loaded", "connected");

    setStatus(
      elements.backendStatus,
      "Backend not checked",
      "checking"
    );

    setStatus(
      elements.authStatus,
      CONFIG.AUTH?.ENABLED === false
        ? "Authentication disabled"
        : "Authentication not initialized",
      "checking"
    );

    setStatus(
      elements.aiStatus,
      "AI service not connected",
      "checking"
    );

    setStatus(
      elements.connectionStatus,
      "Checking connection...",
      "checking"
    );
  }

  // -----------------------------------------
  // SETTINGS PAGE
  // -----------------------------------------

  function renderSettings() {
    if (state.currentPage !== "settings") return;

    const container = elements.moduleContent;
    if (!container) return;

    const section = document.createElement("section");
    section.className = "settings-section";

    const heading = document.createElement("h3");
    heading.textContent = "Appearance";

    const description = document.createElement("p");
    description.textContent = "Choose a theme for your workspace.";

    const label = document.createElement("label");
    label.textContent = "Application theme";
    label.htmlFor = "kultraThemeSelect";

    const select = document.createElement("select");
    select.id = "kultraThemeSelect";
    select.name = "theme";

    Object.entries(CONFIG.THEMES || {}).forEach(([themeId, themeInfo]) => {
      const option = document.createElement("option");
      option.value = themeId;
      option.textContent =
        typeof themeInfo === "string"
          ? themeInfo
          : (themeInfo.name || themeId);

      if (themeId === state.currentTheme) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      applyTheme(select.value);
      showToast("Your theme preference has been updated.");
    });

    section.append(heading, description, label, select);

    const info = document.createElement("p");
    info.textContent =
      "More settings, language preferences, account controls and integrations will be added in later steps.";

    container.append(section, info);
  }

  // -----------------------------------------
  // EVENT LISTENERS
  // -----------------------------------------

  function bindEvents() {
    $$("[data-route]").forEach(button => {
      button.addEventListener("click", () => {
        navigateTo(button.dataset.route);
      });
    });

    elements.menuToggle?.addEventListener("click", openSidebar);
    elements.closeSidebar?.addEventListener("click", closeSidebar);
    elements.sidebarOverlay?.addEventListener("click", closeSidebar);

    elements.menuSearch?.addEventListener("input", event => {
      filterNavigation(event.target.value);
    });

    elements.globalSearch?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        handleGlobalSearch(event.target.value);
      }
    });

    elements.themeQuickButton?.addEventListener("click", cycleTheme);

    elements.notificationButton?.addEventListener("click", () => {
      showToast("You are all caught up. Notifications will appear here.");
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSidebar();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        elements.globalSearch?.focus();
      }
    });
  }

// -----------------------------------------
  // APPLICATION INITIALIZATION
  // -----------------------------------------

  function initializeApp() {
    loadTheme();
    initializeStatus();
    bindEvents();

    const savedPage = (() => {
      try {
        return localStorage.getItem(KEYS.lastPage);
      } catch {
        return null;
      }
    })();

    if (savedPage && pages[savedPage]) {
      navigateTo(savedPage);
    } else {
      navigateTo("home");
    }

    if (state.currentPage === "settings") {
      renderSettings();
    }

    checkBackend();

    document.documentElement.classList.add("app-ready");

    window.KULTRA = window.KULTRA || {};

    Object.assign(window.KULTRA, {
      config: CONFIG,
      state,
      pages,
      navigateTo,
      applyTheme,
      showToast,
      checkBackend
    });

    document.dispatchEvent(
      new CustomEvent("kultra:ready", {
        detail: { version: CONFIG.APP?.VERSION || "252.0" }
      })
    );

    console.info(
      `${CONFIG.APP?.NAME || "K-ULTRA AI"} Version ${CONFIG.APP?.VERSION || "252.0"} initialized.`
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, {
      once: true
    });
  } else {
    initializeApp();
  }

})();
