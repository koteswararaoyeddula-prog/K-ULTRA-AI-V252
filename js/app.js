
"use strict";

window.KUNIQUE_APP = (() => {
  const pageContent = document.getElementById("pageContent");

  const modules = {
    ai: {
      icon: "fa-brain",
      color: "purple",
      title: "AI Intelligence Center",
      description: "Your unified artificial intelligence workspace.",
      tools: [
        ["AI Chat", "fa-comments", "Chat with your AI assistant."],
        ["AI Research", "fa-magnifying-glass-chart", "Research and analyze information."],
        ["Image Studio", "fa-image", "Create images using connected AI services."],
        ["Voice Assistant", "fa-microphone", "Voice-based AI interaction."],
        ["Document AI", "fa-file-pdf", "Analyze and summarize documents."],
        ["Coding AI", "fa-code", "Get help with programming."]
      ]
    },
    whatsapp: {
      icon: "fa-comments",
      color: "green",
      title: "Communication Hub",
      description: "A unified space for communication and collaboration.",
      tools: [
        ["Direct Messages", "fa-message", "Private messaging."],
        ["Group Chats", "fa-users", "Group conversations."],
        ["File Sharing", "fa-paperclip", "Share documents and media."],
        ["WhatsApp Business", "fa-whatsapp", "Connect an official WhatsApp Business API account."],
        ["Notifications", "fa-bell", "Manage communication notifications."],
        ["Contacts", "fa-address-book", "Manage your contacts."]
      ]
    },
    ecommerce: {
      icon: "fa-store",
      color: "orange",
      title: "E-Commerce Marketplace",
      description: "A digital shopping and seller management workspace.",
      tools: [
        ["Product Catalog", "fa-box-open", "Browse and manage products."],
        ["Shopping Cart", "fa-cart-shopping", "Manage your shopping cart."],
        ["Wishlist", "fa-heart", "Save your favorite products."],
        ["Orders", "fa-receipt", "Track customer orders."],
        ["Seller Center", "fa-shop", "Manage your store."],
        ["Payments", "fa-credit-card", "Configure payment integration."]
      ]
    },
    cybersecurity: {
      icon: "fa-shield-halved",
      color: "red",
      title: "Cybersecurity Center",
      description: "Defensive security tools and monitoring.",
      tools: [
        ["Website Scanner", "fa-globe", "Check authorized websites for security issues."],
        ["SSL Checker", "fa-lock", "Inspect SSL certificate information."],
        ["Password Checker", "fa-key", "Check password strength locally."],
        ["Security Reports", "fa-file-shield", "Review security assessment reports."],
        ["Threat Intelligence", "fa-triangle-exclamation", "Explore threat information."],
        ["Learning Lab", "fa-graduation-cap", "Practice defensive security."]
      ]
    },
    it: {
      icon: "fa-code",
      color: "blue",
      title: "IT & Developer Studio",
      description: "Your professional software development toolkit.",
      tools: [
        ["Code Workspace", "fa-laptop-code", "Programming workspace."],
        ["API Tester", "fa-plug", "Test HTTP APIs."],
        ["JSON Formatter", "fa-brackets-curly", "Format and validate JSON."],
        ["GitHub Hub", "fa-github", "Connect your repositories."],
        ["SQL Workspace", "fa-database", "Database management tools."],
        ["Project Manager", "fa-list-check", "Manage software projects."]
      ]
    },
    cloud: {
      icon: "fa-cloud",
      color: "purple",
      title: "Cloud Center",
      description: "Cloud infrastructure and digital storage.",
      tools: [
        ["My Files", "fa-folder-open", "Manage stored files."],
        ["File Upload", "fa-cloud-arrow-up", "Upload files to connected storage."],
        ["Cloud Backup", "fa-hard-drive", "Manage backup operations."],
        ["Storage Usage", "fa-chart-pie", "View storage usage."],
        ["Deployment", "fa-rocket", "Manage application deployments."],
        ["Infrastructure", "fa-server", "View connected cloud services."]
      ]
    },
    business: {
      icon: "fa-chart-line",
      color: "green",
      title: "Business Suite",
      description: "Tools to organize and grow your business.",
      tools: [
        ["CRM", "fa-users", "Customer relationship management."],
        ["Invoices", "fa-file-invoice", "Create and manage invoices."],
        ["Analytics", "fa-chart-column", "Business performance reports."],
        ["Subscriptions", "fa-repeat", "Manage recurring plans."],
        ["Team Management", "fa-people-group", "Manage team members."],
        ["Support Desk", "fa-headset", "Customer support workspace."]
      ]
    },
    education: {
      icon: "fa-graduation-cap",
      color: "pink",
      title: "Learning Academy",
      description: "Learn technology and build new skills.",
      tools: [
        ["AI Tutor", "fa-robot", "AI-powered learning assistance."],
        ["Courses", "fa-book-open", "Explore learning courses."],
        ["Quizzes", "fa-clipboard-question", "Test your knowledge."],
        ["Certificates", "fa-certificate", "View learning achievements."],
        ["Practice Lab", "fa-flask", "Hands-on practice."],
        ["Progress", "fa-chart-simple", "Track learning progress."]
      ]
    },
    productivity: {
      icon: "fa-list-check",
      color: "blue",
      title: "Productivity Workspace",
      description: "Organize your work and daily activities.",
      tools: [
        ["My Tasks", "fa-list-check", "Organize daily tasks."],
        ["Notes", "fa-note-sticky", "Write and manage notes."],
        ["Calendar", "fa-calendar-days", "Plan your schedule."],
        ["Reminders", "fa-bell", "Manage reminders."],
        ["Team Projects", "fa-diagram-project", "Coordinate projects."],
        ["Documents", "fa-folder", "Organize documents."]
      ]
    },
    settings: {
      icon: "fa-gear",
      color: "blue",
      title: "Platform Settings",
      description: "Manage your K-UNIQUE preferences and integrations.",
      tools: [
        ["Appearance", "fa-palette", "Change light and dark themes."],
        ["Account", "fa-user", "Manage account information."],
        ["Security", "fa-shield", "Manage account security."],
        ["Integrations", "fa-plug", "Configure external services."],
        ["Notifications", "fa-bell", "Manage notifications."],
        ["API Configuration", "fa-code", "Configure connected APIs."]
      ]
    },
    admin: {
      icon: "fa-user-shield",
      color: "red",
      title: "Administration Center",
      description: "Administrative tools for authorized platform operators.",
      tools: [
        ["Users", "fa-users", "User management."],
        ["Roles & Permissions", "fa-user-lock", "Manage access control."],
        ["System Health", "fa-heart-pulse", "Monitor service health."],
        ["Audit Logs", "fa-clipboard-list", "Review administrative activity."],
        ["Platform Settings", "fa-sliders", "Manage platform configuration."],
        ["Reports", "fa-chart-bar", "View system reports."]
      ]
    }
  };

  function renderModule(page) {
    const module = modules[page];
    if (!module) return;

    pageContent.innerHTML = `
      <div class="module-heading">
        <div class="large-module-icon ${module.color}">
          <i class="fa-solid ${module.icon}"></i>
        </div>
        <div>
          <span class="eyebrow">K-UNIQUE WORKSPACE</span>
          <h1>${module.title}</h1>
          <p>${module.description}</p>
        </div>
      </div>

      <div class="module-status">
        <span class="live-dot"></span>
        Workspace interface ready
      </div>

      <div class="section-heading">
        <div>
          <span class="eyebrow">AVAILABLE WORKSPACES</span>
          <h2>Explore Your Tools</h2>
        </div>
      </div>

      <div class="modules-grid">
        ${module.tools.map((tool, index) => `
          <button class="module-card workspace-tool"
            data-tool="${page}:${index}">
            <div class="module-icon ${module.color}">
              <i class="fa-solid ${tool[1]}"></i>
            </div>
            <span class="module-label">K-UNIQUE TOOL</span>
            <h3>${tool[0]}</h3>
            <p>${tool[2]}</p>
            <span class="module-arrow">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </span>
          </button>
        `).join("")}
      </div>

      <div class="integration-notice">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>Integration status</strong>
          <p>This is the initial workspace interface. Live services, database operations and external integrations will be connected in subsequent development stages.</p>
        </div>
      </div>

      <footer class="app-footer">
        <strong>K-UNIQUE</strong>
        <span>One Platform. Unlimited Possibilities.</span>
        <span>Version 1.0</span>
      </footer>
    `;
  }

  function init() {
    window.addEventListener("kunique:navigate", event => {
      const page = event.detail.page;
      if (page === "home") {
        location.reload();
        return;
      }
      renderModule(page);
    });

    pageContent?.addEventListener("click", event => {
      const tool = event.target.closest("[data-tool]");
      if (!tool) return;

      const [page, index] = tool.dataset.tool.split(":");
      const item = modules[page]?.tools[Number(index)];

      if (item) {
        alert(item[0] + "\n\n" + item[2] +
          "\n\nThis tool will be activated when its integration is implemented.");
      }
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.KUNIQUE_UI.init();
  window.KUNIQUE_APP.init();
});
    
