
"use strict";

(() => {
  const config = window.KULTRA_CONFIG;

  if (!config) {
    document.body.innerHTML =
      "<main style='padding:30px;font-family:sans-serif;color:#fff;background:#080d1c;min-height:100vh'><h2>K-ULTRA AI configuration not loaded</h2><p>Check that assets/js/config.js exists and loads before app.js.</p></main>";
    return;
  }

  const pageRoot = document.getElementById("pageRoot");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");
  const breadcrumb = document.getElementById("breadcrumbPage");
  const toastContainer = document.getElementById("toastContainer");

  const modules = {
    dashboard: {
      title: "Dashboard", icon: "⌂",
      description: "Your central workspace for the K-ULTRA AI ecosystem."
    },
    chat: {
      title: "AI Chat", icon: "✧",
      description: "Your future AI conversation workspace. AI provider integration will be added in Task 05."
    },
    coding: {
      title: "Coding IDE", icon: "⌘",
      description: "Your future coding workspace with editor, project files and development tools."
    },
    challenges: {
      title: "Coding Challenges", icon: "⌁",
      description: "A future programming practice platform for problems, test cases, submissions and contests."
    },
    builder: {
      title: "Website Builder", icon: "▧",
      description: "Your future website creation workspace with page design and publishing tools."
    },
    appbuilder: {
      title: "App Builder", icon: "▣",
      description: "Plan and create application experiences in your future app development workspace."
    },
    image: {
      title: "Image Studio", icon: "▨",
      description: "Your future AI image creation and editing workspace."
    },
    video: {
      title: "Video Studio", icon: "▶",
      description: "Your future video creation and editing workspace."
    },
    audio: {
      title: "Audio & Music", icon: "♫",
      description: "Your future audio, voice and music production workspace."
    },
    design: {
      title: "Design Studio", icon: "✎",
      description: "Your future creative design and visual production workspace."
    },
    research: {
      title: "AI Research", icon: "⌕",
      description: "Your future research workspace for searching, analyzing and organizing information."
    },
    agents: {
      title: "AI Agents", icon: "◇",
      description: "Your future AI agent and workflow automation workspace."
    },
    ecommerce: {
      title: "E-Commerce", icon: "▤",
      description: "Your future online store workspace for products, orders, inventory and customers."
    },
    documents: {
      title: "Documents", icon: "▱",
      description: "Your future document workspace for creating and managing files."
    },
    marketplace: {
      title: "Marketplace", icon: "▦",
      description: "Your future marketplace for integrations, tools and extensions."
    },
    projects: {
      title: "My Projects", icon: "▧",
      description: "Your central place for organizing and opening your projects."
    },
    profile: {
      title: "My Profile", icon: "◎",
      description: "Your account profile and personal workspace information."
    },
    settings: {
      title: "Settings", icon: "⚙",
      description: "Manage your workspace appearance and application preferences."
    },
    help: {
      title: "Help Center", icon: "?",
      description: "Find guidance and support for using K-ULTRA AI."
    }
  };

  function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function closeSidebar() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  }

  function openSidebar() {
    sidebar?.classList.add("open");
    overlay?.classList.add("show");
  }

  function closeDropdowns() {
    document.querySelectorAll(".dropdown.open").forEach((menu) => {
      menu.classList.remove("open");
    });
  }

  function setActiveNavigation(page) {
    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === page);
    });
  }

  function renderWorkspace(page) {
    const module = modules[page];

    if (!module || !pageRoot) return;

    if (page === "dashboard") {
      window.location.hash = "";
      window.location.reload();
      return;
    }

    pageRoot.innerHTML = `
      <section class="workspace-page">
        <div class="workspace-header">
          <div class="eyebrow"><span class="live-dot"></span> K-ULTRA AI WORKSPACE</div>
          <h1>${module.title}</h1>
          <p class="muted">${module.description}</p>
        </div>

        <div class="workspace-panel workspace-placeholder">
          <div>
            <div class="placeholder-icon">${module.icon}</div>
            <h2>${module.title} Workspace</h2>
            <p>${module.description}</p>
            <span class="workspace-note">UI FOUNDATION READY · FEATURE DEVELOPMENT COMING IN LATER TASKS</span>
          </div>
        </div>
      </section>
    `;
  }

  function openPage(page) {
    if (!modules[page]) {
      showToast("This workspace is not available.");
      return;
    }

    if (page === "dashboard") {
      window.location.hash = "";
      window.location.reload();
      return;
    }

    renderWorkspace(page);
    setActiveNavigation(page);

    if (breadcrumb) {
      breadcrumb.textContent = modules[page].title;
    }

    window.location.hash = page;
    closeSidebar();
    closeDropdowns();

    if (window.innerWidth < 850) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle("light-theme");

    try {
      localStorage.setItem("kultra-theme", isLight ? "light" : "dark");
    } catch (error) {
      // Theme still works for this page if storage is unavailable.
    }

    const button = document.getElementById("themeToggle");
    if (button) {
      button.textContent = isLight ? "☾" : "☼";
      button.title = isLight ? "Switch to dark theme" : "Switch to light theme";
    }
  }

  function loadTheme() {
    let savedTheme = "dark";

    try {
      savedTheme = localStorage.getItem("kultra-theme") || "dark";
    } catch (error) {
      // Use the default theme if browser storage is unavailable.
    }

    document.body.classList.toggle("light-theme", savedTheme === "light");

    const button = document.getElementById("themeToggle");
    if (button) {
      button.textContent = savedTheme === "light" ? "☾" : "☼";
      button.title = savedTheme === "light" ? "Switch to dark theme" : "Switch to light theme";
    }
  }

  function setupDate() {
    const dateElement = document.getElementById("todayDate");
    if (!dateElement) return;

    dateElement.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date());
  }

  function setupSearch() {
    const search = document.getElementById("globalSearch");
    if (!search) return;

    search.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      const query = search.value.trim().toLowerCase();
      if (!query) return;

      const match = Object.entries(modules).find(([key, module]) => {
        return key.includes(query) || module.title.toLowerCase().includes(query);
      });

      if (match) {
        openPage(match[0]);
        search.value = "";
      } else {
        showToast("No matching workspace found.");
      }
    });
  }

  function setupEvents() {
    document.addEventListener("click", (event) => {
      const pageButton = event.target.closest("[data-page]");
      if (pageButton) {
        openPage(pageButton.dataset.page);
      }
    });

    document.getElementById("menuToggle")?.addEventListener("click", openSidebar);
    document.getElementById("closeSidebar")?.addEventListener("click", closeSidebar);
    overlay?.addEventListener("click", closeSidebar);

    document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);

    document.getElementById("notificationToggle")?.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDropdowns();
      document.getElementById("notificationMenu")?.classList.toggle("open");
    });

    document.getElementById("profileToggle")?.addEventListener("click", (event) => {
      event.stopPropagation();
      closeDropdowns();
      document.getElementById("profileMenu")?.classList.toggle("open");
    });

    document.getElementById("sidebarProfile")?.addEventListener("click", () => {
      openPage("profile");
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".profile-wrap")) {
        closeDropdowns();
      }
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("globalSearch")?.focus();
      }

      if (event.key === "Escape") {
        closeDropdowns();
        closeSidebar();
      }
    });

    window.addEventListener("hashchange", () => {
      const page = window.location.hash.replace("#", "");
      if (page && modules[page] && page !== "dashboard") {
        renderWorkspace(page);
        setActiveNavigation(page);
        if (breadcrumb) breadcrumb.textContent = modules[page].title;
      }
    });
  }

  function initialize() {
    loadTheme();
    setupDate();
    setupSearch();
    setupEvents();

    const initialPage = window.location.hash.replace("#", "");
    if (initialPage && modules[initialPage] && initialPage !== "dashboard") {
      openPage(initialPage);
    }

    window.KULTRA_APP = Object.freeze({
      openPage,
      showToast,
      getVersion: () => config.VERSION,
      getModules: () => Object.keys(modules)
    });

    console.info(
      `${config.APP_NAME} Version ${config.VERSION} — UI initialized successfully.`
    );
  }

  initialize();
})();
                                                            
