
"use strict";

window.KUNIQUE_UI = (() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  function initMenu() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");

    function close() {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
    }

    $("#menuToggle")?.addEventListener("click", () => {
      sidebar?.classList.add("open");
      overlay?.classList.add("show");
    });

    $("#sidebarClose")?.addEventListener("click", close);
    overlay?.addEventListener("click", close);

    sidebar?.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", close);
    });
  }

  function initTheme() {
    const button = $("#themeToggle");
    const saved = localStorage.getItem("kunique-theme");
    const theme = saved === "light" ? "light" : "dark";

    document.body.classList.toggle("light-theme", theme === "light");
    updateIcon(theme);

    button?.addEventListener("click", () => {
      const light = !document.body.classList.contains("light-theme");
      const next = light ? "light" : "dark";

      document.body.classList.toggle("light-theme", light);
      localStorage.setItem("kunique-theme", next);
      updateIcon(next);
    });

    function updateIcon(theme) {
      const icon = button?.querySelector("i");
      if (icon) {
        icon.className = theme === "light"
          ? "fa-solid fa-sun"
          : "fa-solid fa-moon";
      }
    }
  }

  function initSearch() {
    const input = $("#globalSearch");
    input?.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;

      const query = input.value.trim().toLowerCase();
      if (!query) return;

      const routes = window.KUNIQUE_ROUTER.getRoutes();
      const match = Object.entries(routes).find(([key, route]) =>
        key.includes(query) || route.title.toLowerCase().includes(query)
      );

      if (match) {
        window.KUNIQUE_ROUTER.navigate(match[0]);
        input.value = "";
      } else {
        alert("No matching workspace found.");
      }
    });
  }

  function initKeyboard() {
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#globalSearch")?.focus();
      }

      if (event.key === "Escape") {
        $("#sidebar")?.classList.remove("open");
        $("#sidebarOverlay")?.classList.remove("show");
      }
    });
  }

  function initDate() {
    const target = $("#welcomeDate");
    if (target) {
      target.textContent = new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(new Date());
    }
  }

  function initNavigation() {
    document.addEventListener("click", event => {
      const trigger = event.target.closest("[data-page]");
      if (!trigger) return;

      const page = trigger.dataset.page;
      if (window.KUNIQUE_ROUTER.navigate(page)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function init() {
    initMenu();
    initTheme();
    initSearch();
    initKeyboard();
    initDate();
    initNavigation();
  }

  return { init };
})();
  
