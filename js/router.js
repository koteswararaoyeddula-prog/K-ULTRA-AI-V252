
"use strict";

window.KUNIQUE_ROUTER = (() => {
  const routes = {
    home: { title: "Overview", description: "Your digital world." },
    ai: { title: "AI Assistant", description: "Your intelligent AI workspace." },
    whatsapp: { title: "Communication Hub", description: "Your messaging workspace." },
    ecommerce: { title: "E-Commerce", description: "Your digital marketplace." },
    cybersecurity: { title: "Cybersecurity", description: "Your security center." },
    it: { title: "IT Services", description: "Your developer workspace." },
    cloud: { title: "Cloud Center", description: "Your cloud workspace." },
    business: { title: "Business Suite", description: "Your business management tools." },
    education: { title: "Education", description: "Your learning workspace." },
    productivity: { title: "Productivity", description: "Your daily productivity tools." },
    settings: { title: "Settings", description: "Configure your platform." },
    admin: { title: "Admin Panel", description: "Platform administration." }
  };

  let current = "home";

  function navigate(page) {
    if (!routes[page]) return false;

    current = page;

    document.querySelectorAll("[data-page]").forEach(el => {
      el.classList.toggle(
        "active",
        el.dataset.page === page && el.classList.contains("nav-item")
      );
    });

    const title = document.getElementById("currentPage");
    if (title) title.textContent = routes[page].title;

    window.dispatchEvent(new CustomEvent("kunique:navigate", {
      detail: { page, route: routes[page] }
    }));

    return true;
  }

  return {
    navigate,
    getCurrent: () => current,
    getRoutes: () => ({ ...routes })
  };
})();
