
/* ==========================================
   K-ULTRA AI VERSION 252.0
   APPLICATION ENGINE
========================================== */

"use strict";

const KUltra = (() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const state = {
    currentPage: "home",
    history: [],
    busy: false
  };

  const pageNames = {
    home: "Overview",
    chat: "AI Chat",
    coding: "Coding Studio",
    tools: "AI Tools",
    research: "Research Lab",
    agents: "AI Agents",
    store: "Marketplace",
    cart: "Shopping Cart",
    orders: "My Orders",
    seller: "Seller Center",
    projects: "My Projects",
    files: "My Files",
    learning: "Learning Lab",
    settings: "Settings"
  };

  // --------------------------
  // NAVIGATION
  // --------------------------

  function navigate(page) {
    if (!pageNames[page]) return;

    state.currentPage = page;

    $$(".page").forEach(section => {
      section.classList.toggle(
        "active",
        section.id === `page-${page}`
      );
    });

    $$(".nav-link[data-page]").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.page === page
      );
    });

    const title = $("#pageTitle");
    if (title) title.textContent = pageNames[page];

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --------------------------
  // MOBILE SIDEBAR
  // --------------------------

  function openSidebar() {
    $("#sidebar")?.classList.add("open");
  }

  function closeSidebar() {
    $("#sidebar")?.classList.remove("open");
  }

  // --------------------------
  // THEME
  // --------------------------

  function setTheme(theme) {
    document.body.classList.toggle(
      "light-theme",
      theme === "light"
    );

    try {
      localStorage.setItem("kultra-theme", theme);
    } catch (error) {
      console.warn("Theme preference could not be saved.");
    }

    const button = $("#themeToggle");
    if (button) {
      button.textContent = theme === "light" ? "☾" : "☼";
    }
  }

  function initializeTheme() {
    let savedTheme = "dark";

    try {
      savedTheme = localStorage.getItem("kultra-theme") || "dark";
    } catch (error) {
      console.warn("Using default theme.");
    }

    setTheme(savedTheme);
  }

  // --------------------------
  // CHAT MESSAGE UI
  // --------------------------

  function addMessage(role, content) {
    const container = $("#chatMessages");
    if (!container) return;

    const message = document.createElement("div");
    message.className =
      role === "user" ? "user-message" : "assistant-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "U" : "K";

    const body = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = role === "user" ? "You" : "K-ULTRA AI";

    const paragraph = document.createElement("p");
    paragraph.textContent = content;

    body.append(name, paragraph);
    message.append(avatar, body);
    container.appendChild(message);

    container.scrollTop = container.scrollHeight;

    return message;
  }

  function setChatBusy(busy) {
    state.busy = busy;

    const button = $("#sendChat");
    if (!button) return;

    button.disabled = busy;
    button.textContent = busy ? "Thinking..." : "Send ↗";
    button.style.opacity = busy ? ".6" : "1";
  }

  // --------------------------
  // SECURE BACKEND CONFIG
  // --------------------------

  function getBackendURL() {
    const config = window.KULTRA_CONFIG;

    const baseURL = config?.API?.BASE_URL;

    if (
      !baseURL ||
      baseURL.includes("YOUR-CLOUDFLARE") ||
      !/^https:\/\//i.test(baseURL)
    ) {
      throw new Error(
        "Backend URL is not configured. Configure your secure backend first."
      );
    }

    return baseURL.replace(/\/+$/, "");
  }

  async function requestAI(message) {
    const baseURL = getBackendURL();

    const model =
      $("#modelSelect")?.value || "default";

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      60000
    );

    try {
      const response = await fetch(
        `${baseURL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message,
            model,
            history: state.history.slice(-20)
          }),
          signal: controller.signal
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Backend returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || `Backend error: ${response.status}`
        );
      }

      const answer =
        data?.reply ??
        data?.response ??
        data?.content ??
        data?.text;

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error(
          "Backend response did not contain an AI answer."
        );
      }

      return answer;

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  // --------------------------
  // SEND CHAT
  // --------------------------

  async function sendChatMessage(inputElement) {
    if (state.busy || !inputElement) return;

    const message = inputElement.value.trim();

    if (!message) return;

    inputElement.value = "";

    addMessage("user", message);

    const loading = addMessage(
      "assistant",
      "Connecting to your AI backend..."
    );

    setChatBusy(true);

    try {
      const answer = await requestAI(message);

      const paragraph = loading?.querySelector("p");

      if (paragraph) {
        paragraph.textContent = answer;
      }

      state.history.push(
        { role: "user", content: message },
        { role: "assistant", content: answer }
      );

      state.history = state.history.slice(-20);

    } catch (error) {
      const paragraph = loading?.querySelector("p");

      if (paragraph) {
        paragraph.textContent =
          `Connection problem: ${error.message}`;
      }

      console.error("AI request failed:", error);

    } finally {
      setChatBusy(false);
    }
  }

  // --------------------------
  // HOME PROMPT
  // --------------------------

  function sendHomePrompt() {
    const input = $("#homePrompt");
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    navigate("chat");

    const chatInput = $("#chatInput");
    if (chatInput) {
      chatInput.value = message;
      sendChatMessage(chatInput);
    }
  }

  // --------------------------
  // CODING STUDIO
  // --------------------------

  function runCode() {
    const editor = $("#codeEditor");
    const preview = $("#codePreview");
    const language = $("#codeLanguage")?.value || "html";

    if (!editor || !preview) return;

    const code = editor.value;

    if (!code.trim()) {
      preview.srcdoc =
        "<h3 style='font-family:Arial;padding:20px'>Write some code to see the preview.</h3>";
      return;
    }

    let output = "";

    if (language === "html") {
      output = code;
    } else if (language === "css") {
      output = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial;
              padding: 20px;
            }
            ${code}
          </style>
        </head>
        <body>
          <h2>CSS Preview</h2>
          <p>Your CSS is applied to this preview page.</p>
          <button>Sample button</button>
        </body>
        </html>
      `;
    } else if (language === "javascript") {
      output = `
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial;padding:20px">
          <h3>JavaScript Preview</h3>
          <pre id="result">Running...</pre>
          <script>
            const originalLog = console.log;
            console.log = (...args) => {
              document.getElementById("result").textContent +=
                args.join(" ") + "\\n";
            };

            try {
              ${code}
            } catch (error) {
              document.getElementById("result").textContent =
                "Error: " + error.message;
            }
          <\/script>
        </body>
        </html>
      `;
    } else if (language === "json") {
      try {
        const parsed = JSON.parse(code);

        output = `
          <pre style="
            white-space:pre-wrap;
            padding:20px;
            font:14px monospace;
            color:#243b60
          ">${escapeHTML(JSON.stringify(parsed, null, 2))}</pre>
        `;
      } catch (error) {
        output = `
          <pre style="padding:20px;color:#c33">
            Invalid JSON: ${escapeHTML(error.message)}
          </pre>
        `;
      }
    } else if (language === "python") {
      output = `
        <div style="padding:20px;font-family:Arial;color:#243b60">
          <h3>Python source preview</h3>
          <p>
            Python execution requires a secure server-side runtime.
            This browser preview displays your source only.
          </p>
          <pre style="white-space:pre-wrap">${escapeHTML(code)}</pre>
        </div>
      `;
    }

    // Preview stays sandboxed.
    preview.srcdoc = output;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  // --------------------------
  // LANGUAGE BUTTON
  // --------------------------

  function languageNotice() {
    alert(
      "Multi-language interface will be enabled in the language integration step."
    );
  }

  // --------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------

  function keyboardShortcuts(event) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter"
    ) {
      const chatInput = $("#chatInput");

      if (
        chatInput &&
        state.currentPage === "chat" &&
        document.activeElement === chatInput
      ) {
        event.preventDefault();
        sendChatMessage(chatInput);
      }
    }

    if (event.key === "Escape") {
      closeSidebar();
    }
  }

  // --------------------------
  // EVENT INITIALIZATION
  // --------------------------

  function initializeEvents() {
    document.addEventListener("click", event => {
      const navigation = event.target.closest("[data-page]");

      if (navigation) {
        navigate(navigation.dataset.page);
      }
    });

    $("#openSidebar")?.addEventListener(
      "click",
      openSidebar
    );

    $("#closeSidebar")?.addEventListener(
      "click",
      closeSidebar
    );

    $("#themeToggle")?.addEventListener("click", () => {
      const nextTheme =
        document.body.classList.contains("light-theme")
          ? "dark"
          : "light";

      setTheme(nextTheme);
    });

    $("#sendChat")?.addEventListener("click", () => {
      sendChatMessage($("#chatInput"));
    });

    $("#chatInput")?.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        sendChatMessage($("#chatInput"));
      }
    });

    $("#startPrompt")?.addEventListener(
      "click",
      sendHomePrompt
    );

    $("#homePrompt")?.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        sendHomePrompt();
      }
    });

    $("#runCode")?.addEventListener(
      "click",
      runCode
    );

    $("#languageButton")?.addEventListener(
      "click",
      languageNotice
    );

    document.addEventListener(
      "keydown",
      keyboardShortcuts
    );
  }

  // --------------------------
  // START APPLICATION
  // --------------------------

  function initialize() {
    initializeTheme();
    initializeEvents();

    const editor = $("#codeEditor");

    if (editor) {
      editor.value =
`<!DOCTYPE html>
<html>
<head>
  <title>My First Project</title>
  <style>
    body {
      font-family: Arial;
      padding: 30px;
      background: #f0f4ff;
    }
    h1 {
      color: #526cff;
    }
  </style>
</head>
<body>
  <h1>Hello, K-ULTRA AI!</h1>
  <p>My first coding project.</p>
</body>
</html>`;
    }

    console.log(
      "K-ULTRA AI Version 252.0 initialized."
    );
  }

  return {
    initialize,
    navigate,
    setTheme,
    runCode
  };

})();

document.addEventListener("DOMContentLoaded", () => {
  KUltra.initialize();
});
    
