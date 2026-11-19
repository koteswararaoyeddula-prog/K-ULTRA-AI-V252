
"use strict";

/*
 * K-ULTRA AI VERSION 252
 * Main frontend application
 */

(() => {
  const config = window.KULTRA_CONFIG;

  if (!config) {
    console.error("K-ULTRA configuration is missing.");
    return;
  }

  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menuButton");
  const themeButton = document.getElementById("themeButton");
  const pageName = document.getElementById("pageName");
  const moduleArea = document.getElementById("moduleArea");
  const featureGrid = document.getElementById("featureGrid");
  const welcomeSection = document.querySelector(".welcome-section");
  const heroCard = document.querySelector(".hero-card");
  const sectionHeading = document.querySelector(".section-heading");
  const backButton = document.getElementById("backButton");
  const moduleTitle = document.getElementById("moduleTitle");
  const moduleDescription = document.getElementById("moduleDescription");
  const toast = document.getElementById("toast");

  const modules = {
    dashboard: {
      title: "Dashboard",
      description: "Your personal AI workspace."
    },
    chat: {
      title: "AI Chat",
      description: "Multi-model AI conversations and intelligent assistance."
    },
    coding: {
      title: "AI Coding IDE",
      description: "Your own coding environment with AI development tools."
    },
    builder: {
      title: "Website & App Builder",
      description: "Build websites, web applications and digital products."
    },
    image: {
      title: "Image Studio",
      description: "AI image generation and image editing."
    },
    video: {
      title: "Video Studio",
      description: "AI video creation and editing workflows."
    },
    research: {
      title: "AI Research",
      description: "Research, search, analysis and reports."
    },
    agents: {
      title: "AI Agents",
      description: "Intelligent agents and workflow automation."
    },
    problems: {
      title: "Coding Challenges",
      description: "Programming practice, coding problems, contests and leaderboards."
    },
    ecommerce: {
      title: "E-Commerce",
      description: "Online stores, products, orders, inventory and payments."
    },
    documents: {
      title: "Documents",
      description: "Document management, creation and AI analysis."
    },
    marketplace: {
      title: "Marketplace",
      description: "Explore tools, extensions, plugins and applications."
    },
    projects: {
      title: "My Projects",
      description: "Manage your applications and development projects."
    },
    settings: {
      title: "Settings",
      description: "Customize your K-ULTRA AI workspace."
    }
  };

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function openPage(page) {
    const module = modules[page];

    if (!module) {
      showToast("This module is not registered yet.");
      return;
    }

    const isDashboard = page === "dashboard";

    pageName.textContent = module.title;

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

    welcomeSection.hidden = !isDashboard;
    heroCard.hidden = !isDashboard;
    sectionHeading.hidden = !isDashboard;
    featureGrid.hidden = !isDashboard;
    moduleArea.hidden = isDashboard;

    if (!isDashboard) {
      moduleTitle.textContent = module.title;
      moduleDescription.textContent = module.description;
    }

    sidebar.classList.remove("open");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // Navigation
  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      openPage(button.dataset.page);
    });
  });

  // Feature cards and dashboard actions
  document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
      openPage(button.dataset.open);
    });
  });

  // Back to dashboard
  backButton.addEventListener("click", () => {
    openPage("dashboard");
  });

  // Mobile navigation
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Theme management
  const savedTheme = localStorage.getItem("kultra-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeButton.textContent = "☾";
  }

  themeButton.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");

    localStorage.setItem(
      "kultra-theme",
      isLight ? "light" : "dark"
    );

    themeButton.textContent = isLight ? "☾" : "☀";

    showToast(
      isLight ? "Light theme enabled" : "Dark theme enabled"
    );
  });

  // Application initialization
  console.info(
    `${config.APP_NAME} Version ${config.VERSION} initialized.`
  );

  showToast("K-ULTRA AI frontend initialized!");

  window.KULTRA_APP = Object.freeze({
    openPage,
    showToast,
    getVersion: () => config.VERSION
  });

})();
