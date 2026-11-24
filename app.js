
"use strict";

/*
 * K-ULTRA AI — VERSION 252.2
 * FILE: app.js
 *
 * Compatible with the supplied Version 252 index.html.
 *
 * Included:
 * - Firebase Email/Password authentication
 * - Google authentication
 * - Guest local-only mode
 * - AI chat through Cloudflare Worker
 * - Local conversation history
 * - Chat search, delete and export
 * - Voice input and speech output
 * - Text file context support
 * - Theme switching
 * - Responsive mobile sidebar
 * - AI research and project planning
 * - Developer utilities
 * - Sandboxed HTML playground preview
 *
 * Important:
 * Guest users cannot access the authenticated AI endpoint.
 * Non-text file uploads, image generation, payments,
 * live travel bookings, calls and cloud messaging require
 * additional backend integrations.
 */

(() => {
  "use strict";

  // --------------------------------------------------
  // Configuration
  // --------------------------------------------------

  const CONFIG = window.KULTRA_CONFIG || {};

  const APP_NAME = CONFIG.APP?.NAME || "K-ULTRA AI";
  const APP_VERSION = "252.2";

  const STORAGE_KEY = "kultra_v252_data";
  const SESSION_KEY = "kultra_v252_session";

  const MAX_MESSAGE_LENGTH =
    CONFIG.CHAT?.MAX_MESSAGE_LENGTH || 12000;

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;
  const MAX_TEXT_FILE_CONTEXT = 12000;

  const state = {
    user: null,
    guest: false,

    chats: [],
    currentChatId: null,

    selectedFiles: [],

    isSending: false,
    backendOnline: false,

    recognition: null,
    speaking: false,

    theme: "dark",

    currentView: "home",

    codeFiles: [],

    abortController: null
  };

  // --------------------------------------------------
  // DOM helpers
  // --------------------------------------------------

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    loader: $("#app-loader"),

    authScreen: $("#auth-screen"),
    app: $("#app"),

    loginForm: $("#login-form"),
    signupForm: $("#signup-form"),

    guestButton: $("#guest-mode-btn"),

    chatForm: $("#chat-form"),
    messageInput: $("#message-input"),
    chatMessages: $("#chat-messages"),

    fileInput: $("#chat-file-input"),
    attachmentPreview: $("#attachment-preview"),

    sendButton: $("#send-message-btn"),
    micButton: $("#chat-mic-btn"),

    backendStatus: $("#backend-status"),
    backendStatusText: $("#backend-status-text"),

    sidebar: $("#sidebar"),

    dialog: $("#global-dialog")
  };

  // --------------------------------------------------
  // General helpers
  // --------------------------------------------------

  function createId() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    );
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function safeFilename(value) {
    return String(value || "kultra-export")
      .replace(/[^a-z0-9-_]/gi, "_")
      .slice(0, 80);
  }

  function getApiBase() {
    return String(CONFIG.API?.BASE_URL || "")
      .replace(/\/+$/, "");
  }

  function getApiEndpoint(name) {
    if (typeof CONFIG.API?.getEndpoint === "function") {
      return CONFIG.API.getEndpoint(name);
    }

    const base = getApiBase();

    const endpoints = CONFIG.API?.ENDPOINTS || {};

    const path = endpoints[name] || `/api/${name.toLowerCase()}`;

    return base + (
      path.startsWith("/") ? path : `/${path}`
    );
  }

  function getChatEndpoint() {
    return getApiEndpoint("CHAT");
  }

  function showNotification(message, type = "info") {
    let container = $("#toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";

      document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.textContent = String(message);

    toast.setAttribute("role", "status");

    container.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  function setBackendStatus(online, message = "") {
    state.backendOnline = Boolean(online);

    const text = message || (
      online
        ? "Backend online"
        : "Backend offline"
    );

    if (elements.backendStatusText) {
      elements.backendStatusText.textContent = text;
    } else if (elements.backendStatus) {
      elements.backendStatus.textContent = text;
    }

    elements.backendStatus?.classList.toggle(
      "connected",
      Boolean(online)
    );

    elements.backendStatus?.classList.toggle(
      "error",
      !online
    );

    const homeStatus = $("#home-backend-status");

    if (homeStatus) {
      homeStatus.textContent = online ? "Online" : "Offline";
    }
  }

  function setBusy(busy) {
    state.isSending = Boolean(busy);

    if (elements.sendButton) {
      elements.sendButton.disabled = Boolean(busy);

      elements.sendButton.textContent = busy ? "…" : "➤";
    }

    if (elements.messageInput) {
      elements.messageInput.disabled = Boolean(busy);
    }

    $("#thinking-indicator")?.toggleAttribute(
      "hidden",
      !busy
    );
  }

  // --------------------------------------------------
  // Local storage
  // --------------------------------------------------

  function loadLocalData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      const saved = raw ? JSON.parse(raw) : {};

      state.chats = Array.isArray(saved.chats)
        ? saved.chats
        : [];

      state.theme = saved.theme === "light"
        ? "light"
        : "dark";

    } catch (error) {
      console.warn("Local data loading failed:", error);

      state.chats = [];
      state.theme = "dark";
    }
  }

  function saveLocalData() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          chats: state.chats,
          theme: state.theme,
          updatedAt: new Date().toISOString()
        })
      );

      return true;

    } catch (error) {
      console.error("Local storage error:", error);

      showNotification(
        "Unable to save chats. Device storage may be full.",
        "error"
      );

      return false;
    }
  }

  // --------------------------------------------------
  // Conversation management
  // --------------------------------------------------

  function getCurrentChat() {
    return state.chats.find(
      chat => chat.id === state.currentChatId
    ) || null;
  }

  function createNewChat() {
    const chat = {
      id: createId(),

      title: "New chat",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      messages: []
    };

    state.chats.unshift(chat);

    state.currentChatId = chat.id;

    saveLocalData();

    renderChat();
    renderChatList();

    elements.messageInput?.focus();

    return chat;
  }

  function ensureCurrentChat() {
    return getCurrentChat() || createNewChat();
  }

  function addMessage(role, content, extra = {}) {
    const chat = ensureCurrentChat();

    const message = {
      id: createId(),

      role,

      content: String(content ?? ""),

      createdAt: new Date().toISOString(),

      ...extra
    };

    chat.messages.push(message);

    chat.updatedAt = new Date().toISOString();

    if (
      chat.messages.length === 1 &&
      role === "user"
    ) {
      chat.title = String(content)
        .replace(/\s+/g, " ")
        .slice(0, 45) || "New chat";
    }

    state.chats.sort(
      (a, b) =>
        new Date(b.updatedAt) -
        new Date(a.updatedAt)
    );

    saveLocalData();

    renderChat();
    renderChatList();
    renderRecentChats();

    return message;
  }

  function openChat(chatId) {
    const chat = state.chats.find(
      item => item.id === chatId
    );

    if (!chat) return;

    state.currentChatId = chat.id;

    renderChat();
    renderChatList();
    showView("chat");

    closeSidebar();
  }

  function deleteCurrentChat() {
    if (!state.currentChatId) {
      showNotification("No conversation selected.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this conversation from this device?"
    );

    if (!confirmed) return;

    state.chats = state.chats.filter(
      chat => chat.id !== state.currentChatId
    );

    state.currentChatId = state.chats[0]?.id || null;

    saveLocalData();

    renderChat();
    renderChatList();
    renderRecentChats();

    showNotification("Conversation deleted.", "success");
  }

  function clearAllChats() {
    const confirmed = window.confirm(
      "Delete all locally saved conversations?"
    );

    if (!confirmed) return;

    state.chats = [];
    state.currentChatId = null;

    saveLocalData();

    renderChat();
    renderChatList();
    renderRecentChats();

    showNotification("All local conversations cleared.", "success");
  }

  // --------------------------------------------------
  // Message formatting
  // --------------------------------------------------

  function formatMessage(content) {
    let text = escapeHTML(content);

    const codeBlocks = [];

    text = text.replace(
      /```([\w-]*)\n?([\s\S]*?)```/g,
      (_, language, code) => {
        const index = codeBlocks.length;

        codeBlocks.push(
          `<pre class="code-block"><code>${code.trim()}</code></pre>`
        );

        return `__KULTRA_CODE_${index}__`;
      }
    );

    text = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    text = text.replace(
      /__KULTRA_CODE_(\d+)__/g,
      (_, index) => codeBlocks[Number(index)] || ""
    );

    return text;
  }

  // --------------------------------------------------
  // Chat rendering
  // --------------------------------------------------

  function renderChat() {
    const container = elements.chatMessages;

    if (!container) return;

    const chat = getCurrentChat();

    if (!chat || !chat.messages.length) {
      container.innerHTML = `
        <div class="chat-welcome">
          <div class="assistant-avatar">K</div>

          <h2>How can I help you today?</h2>

          <p>
            Ask in your preferred language.
            K-ULTRA AI will respond in that language.
          </p>

          <div class="prompt-suggestions">
            <button type="button"
              data-prompt="Explain artificial intelligence in simple words.">
              Explain AI
            </button>

            <button type="button"
              data-prompt="Write a Python program and explain it.">
              Write code
            </button>

            <button type="button"
              data-prompt="Help me plan a new IT company.">
              Build a business
            </button>

            <button type="button"
              data-prompt="Create a learning roadmap for computer science.">
              Learn technology
            </button>
          </div>
        </div>
      `;

      return;
    }

    container.innerHTML = chat.messages.map(message => {
      const role = message.role === "assistant"
        ? "assistant"
        : "user";

      const label = role === "assistant"
        ? APP_NAME
        : "You";

      return `
        <article class="message ${role}"
          data-message-id="${escapeHTML(message.id)}">

          <div class="message-author">
            ${escapeHTML(label)}
          </div>

          <div class="message-content">
            ${formatMessage(message.content)}
          </div>

          <div class="message-actions">
            <button type="button"
              data-action="copy-message"
              data-message-id="${escapeHTML(message.id)}">
              Copy
            </button>

            ${
              role === "assistant"
                ? `
                  <button type="button"
                    data-action="speak-message"
                    data-message-id="${escapeHTML(message.id)}">
                    Read aloud
                  </button>
                `
                : ""
            }
          </div>
        </article>
      `;
    }).join("");

    container.scrollTop = container.scrollHeight;
  }

  function renderChatList(filter = "") {
    const container = $("#chat-history-list");

    if (!container) return;

    const query = String(filter).trim().toLowerCase();

    const chats = state.chats.filter(chat => {
      const title = String(chat.title || "").toLowerCase();

      const matchesTitle = title.includes(query);

      const matchesMessage = chat.messages.some(message =>
        String(message.content || "")
          .toLowerCase()
          .includes(query)
      );

      return !query || matchesTitle || matchesMessage;
    });

    if (!chats.length) {
      container.innerHTML = `
        <p class="empty-state">
          No conversations found.
        </p>
      `;

      return;
    }

    container.innerHTML = chats.map(chat => `
      <button type="button"
        class="conversation-item ${
          chat.id === state.currentChatId ? "active" : ""
        }"
        data-action="open-chat"
        data-chat-id="${escapeHTML(chat.id)}">

        <span>${escapeHTML(chat.title)}</span>

      </button>
    `).join("");
  }

  function renderRecentChats() {
    const container = $("#recent-chats");

    if (!container) return;

    const recent = state.chats.slice(0, 5);

    if (!recent.length) {
      container.innerHTML = `
        <p class="empty-state">
          Your recent conversations will appear here.
        </p>
      `;

      return;
    }

    container.innerHTML = recent.map(chat => `
      <button type="button"
        class="conversation-item"
        data-action="open-chat"
        data-chat-id="${escapeHTML(chat.id)}">
        ${escapeHTML(chat.title)}
      </button>
    `).join("");
  }

  // --------------------------------------------------
  // Backend connection
  // --------------------------------------------------

  async function checkBackend() {
    const base = getApiBase();

    if (
      !base ||
      base.includes("YOUR-CLOUDFLARE-WORKER-URL")
    ) {
      setBackendStatus(false, "Backend URL not configured");
      return false;
    }

    try {
      const response = await fetch(`${base}/health`, {
        method: "GET",

        headers: {
          Accept: "application/json"
        },

        signal: AbortSignal.timeout
          ? AbortSignal.timeout(10000)
          : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || data.status !== "online") {
        throw new Error("Backend health check failed.");
      }

      setBackendStatus(true, "Backend online");

      return true;

    } catch (error) {
      console.error("Backend health check:", error);

      setBackendStatus(false, "Backend connection failed");

      return false;
    }
  }

  // --------------------------------------------------
  // Firebase authentication
  // --------------------------------------------------

  function getFirebaseAuth() {
    try {
      if (
        !window.firebase ||
        typeof window.firebase.initializeApp !== "function" ||
        typeof window.firebase.auth !== "function"
      ) {
        throw new Error(
          "Firebase Authentication SDK scripts are not loaded."
        );
      }

      const firebaseConfig = CONFIG.FIREBASE?.CONFIG;

      if (
        !firebaseConfig?.apiKey ||
        !firebaseConfig?.projectId ||
        !firebaseConfig?.appId
      ) {
        throw new Error(
          "Firebase configuration is incomplete."
        );
      }

      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      return window.firebase.auth();

    } catch (error) {
      console.error("Firebase initialization:", error);

      return null;
    }
  }

  function showAuthScreen() {
    elements.authScreen?.classList.remove("hidden");
    elements.app?.classList.add("hidden");

    if (elements.authScreen) {
      elements.authScreen.style.display = "";
    }

    if (elements.app) {
      elements.app.style.display = "none";
    }

    elements.loader?.classList.add("hidden");
  }

  function showApplication() {
    elements.authScreen?.classList.add("hidden");
    elements.app?.classList.remove("hidden");

    if (elements.authScreen) {
      elements.authScreen.style.display = "none";
    }

    if (elements.app) {
      elements.app.style.display = "";
    }

    elements.loader?.classList.add("hidden");

    updateAccountUI();

    renderChat();
    renderChatList();
    renderRecentChats();
  }

  function updateAccountUI() {
    const name = state.user?.displayName ||
      state.user?.email?.split("@")[0] ||
      (state.guest ? "Guest User" : "User");

    const email = state.user?.email ||
      (state.guest ? "Local device account" : "");

    const initial = name.charAt(0).toUpperCase() || "K";

    const accountType = state.guest
      ? "Guest"
      : state.user
        ? "Signed in"
        : "Offline";

    const mode = $("#account-mode-text");
    const displayName = $("#user-display-name");
    const displayEmail = $("#user-display-email");

    if (mode) mode.textContent = accountType;

    if (displayName) displayName.textContent = name;

    if (displayEmail) displayEmail.textContent = email;

    $("#user-avatar")?.replaceChildren(
      document.createTextNode(initial)
    );

    $("#topbar-avatar")?.replaceChildren(
      document.createTextNode(initial)
    );

    const homeAccount = $("#home-account-type");

    if (homeAccount) {
      homeAccount.textContent = accountType;
    }

    const usage = $("#chat-usage-label");

    if (usage) {
      usage.textContent = state.guest
        ? "Guest mode: local chats only. Sign in to use AI."
        : "AI assistant connected.";
    }
  }

  function startGuestMode() {
    state.user = null;
    state.guest = true;

    try {
      sessionStorage.setItem(SESSION_KEY, "guest");
    } catch (_) {}

    showApplication();

    showNotification(
      "Guest Mode enabled. Conversations are saved on this device."
    );

    checkBackend();
  }

  async function handleLogin(event) {
    event.preventDefault();

    const auth = getFirebaseAuth();

    if (!auth) {
      showNotification(
        "Firebase Authentication is not initialized.",
        "error"
      );

      return;
    }

    const email = $("#login-email")?.value.trim();

    const password = $("#login-password")?.value;

    if (!email || !password) {
      showNotification(
        "Enter your email and password.",
        "error"
      );

      return;
    }

    const submit = $("button[type='submit']", elements.loginForm);

    if (submit) submit.disabled = true;

    try {
      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      state.guest = false;

      showNotification(
        "Login successful.",
        "success"
      );

    } catch (error) {
      console.error("Login error:", error);

      showNotification(
        error.message || "Login failed.",
        "error"
      );

    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function handleSignup(event) {
    event.preventDefault();

    const auth = getFirebaseAuth();

    if (!auth) {
      showNotification(
        "Firebase Authentication is not initialized.",
        "error"
      );

      return;
    }

    const name = $("#signup-name")?.value.trim();

    const email = $("#signup-email")?.value.trim();

    const password = $("#signup-password")?.value;

    if (!name || !email || !password) {
      showNotification(
        "Complete all required fields.",
        "error"
      );

      return;
    }

    if (password.length < 8) {
      showNotification(
        "Password must contain at least 8 characters.",
        "error"
      );

      return;
    }

    const submit = $("button[type='submit']", elements.signupForm);

    if (submit) submit.disabled = true;

    try {
      const result = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      await result.user.updateProfile({
        displayName: name
      });

      state.guest = false;

      showNotification(
        "Account created successfully.",
        "success"
      );

    } catch (error) {
      console.error("Signup error:", error);

      showNotification(
        error.message || "Account creation failed.",
        "error"
      );

    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function handleGoogleLogin() {
    const auth = getFirebaseAuth();

    if (!auth) {
      showNotification(
        "Firebase Authentication is not initialized.",
        "error"
      );

      return;
    }

    try {
      const provider =
        new window.firebase.auth.GoogleAuthProvider();

      await auth.signInWithPopup(provider);

      state.guest = false;

      showNotification(
        "Google login successful.",
        "success"
      );

    } catch (error) {
      console.error("Google login error:", error);

      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        showNotification(
          "Popup blocked. Please allow popups and try again.",
          "error"
        );
      } else {
        showNotification(
          error.message || "Google login failed.",
          "error"
        );
      }
    }
  }

  async function handleForgotPassword() {
    const auth = getFirebaseAuth();

    const email = $("#login-email")?.value.trim();

    if (!auth || !email) {
      showNotification(
        "Enter your email address first.",
        "info"
      );

      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);

      showNotification(
        "Password reset email sent.",
        "success"
      );

    } catch (error) {
      showNotification(
        error.message || "Could not send reset email.",
        "error"
      );
    }
  }

  async function signOut() {
    const auth = getFirebaseAuth();

    try {
      if (auth && state.user) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }

    state.user = null;
    state.guest = false;

    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}

    showAuthScreen();
  }

  function initializeAuth() {
    const auth = getFirebaseAuth();

    if (!auth) {
      showAuthScreen();

      console.warn(
        "Firebase Authentication is unavailable."
      );

      return;
    }

    auth.onAuthStateChanged(user => {
      state.user = user;

      state.guest = false;

      if (user) {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch (_) {}

        showApplication();

        checkBackend();

      } else {
        let guestSession = false;

        try {
          guestSession =
            sessionStorage.getItem(SESSION_KEY) === "guest";
        } catch (_) {}

        if (guestSession) {
          state.guest = true;

          showApplication();

          checkBackend();

        } else {
          showAuthScreen();
        }
      }
    });
  }

  // --------------------------------------------------
  // AI request
  // --------------------------------------------------

  async function getAuthorizationHeaders() {
    if (!state.user || state.guest) {
      throw new Error(
        "Please sign in to use the AI assistant. Guest Mode supports local conversations only."
      );
    }

    const token = await state.user.getIdToken();

    if (!token) {
      throw new Error(
        "Unable to retrieve your Firebase login token."
      );
    }

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  async function requestAI(messages, options = {}) {
    const headers = await getAuthorizationHeaders();

    const endpoint = getChatEndpoint();

    if (!endpoint || endpoint.startsWith("undefined")) {
      throw new Error("AI endpoint is not configured.");
    }

    const controller = new AbortController();

    state.abortController = controller;

    const timeout = window.setTimeout(
      () => controller.abort(),
      60000
    );

    try {
      const response = await fetch(endpoint, {
        method: "POST",

        headers,

        signal: controller.signal,

        body: JSON.stringify({
          messages,

          message: messages[messages.length - 1]?.content || "",

          model: options.model || "auto",

          language: options.language || "auto"
        })
      });

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          `AI request failed (${response.status})`
        );
      }

      const answer =
        data.response ||
        data.reply ||
        data.message ||
        data.output ||
        data.result?.response ||
        data.result?.text;

      if (
        typeof answer !== "string" ||
        !answer.trim()
      ) {
        throw new Error(
          "The AI backend returned an empty response."
        );
      }

      return {
        answer: answer.trim(),
        provider: data.provider || "AI",
        model: data.model || ""
      };

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "AI request timed out. Please try again."
        );
      }

      throw error;

    } finally {
      window.clearTimeout(timeout);

      state.abortController = null;
    }
  }

  async function sendToAI(userText) {
    const chat = ensureCurrentChat();

    const history = chat.messages
      .slice(-20)
      .map(message => ({
        role: message.role,
        content: message.content
      }));

    const model =
      $("#ai-model-select")?.value || "auto";

    const language =
      $("#response-language")?.value || "auto";

    return requestAI(history, {
      model,
      language
    });
  }

  // --------------------------------------------------
  // File selection
  // --------------------------------------------------

  function renderSelectedFiles() {
    const container = elements.attachmentPreview;

    if (!container) return;

    if (!state.selectedFiles.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = state.selectedFiles.map(
      (file, index) => `
        <span class="selected-file">
          ${escapeHTML(file.name)}

          <button type="button"
            data-action="remove-file"
            data-file-index="${index}"
            aria-label="Remove ${escapeHTML(file.name)}">
            ×
          </button>
        </span>
      `
    ).join("");
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        showNotification(
          `${file.name} is larger than 10 MB.`,
          "error"
        );

        continue;
      }

      if (state.selectedFiles.length >= MAX_FILES) {
        showNotification(
          `Maximum ${MAX_FILES} files allowed.`,
          "error"
        );

        break;
      }

      const duplicate = state.selectedFiles.some(
        item =>
          item.name === file.name &&
          item.size === file.size
      );

      if (!duplicate) {
        state.selectedFiles.push(file);
      }
    }

    renderSelectedFiles();

    // Allow selecting the same file again.
    event.target.value = "";
  }

  function isTextFile(file) {
    const extension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    return [
      "txt",
      "md",
      "csv",
      "json",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "py",
      "java",
      "c",
      "cpp",
      "sql"
    ].includes(extension);
  }

  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(String(reader.result || ""));
      };

      reader.onerror = () => {
        reject(new Error(`Could not read ${file.name}.`));
      };

      reader.readAsText(file);
    });
  }

  async function collectTextFileContext() {
    const context = [];

    const unsupported = [];

    for (const file of state.selectedFiles) {
      if (!isTextFile(file)) {
        unsupported.push(file.name);
        continue;
      }

      if (file.size > 200 * 1024) {
        unsupported.push(file.name);
        continue;
      }

      const content = await readTextFile(file);

      context.push(
        `\n\nFILE: ${file.name}\n` +
        content.slice(0, MAX_TEXT_FILE_CONTEXT)
      );
    }

    if (unsupported.length) {
      showNotification(
        "These files are selected but cannot yet be uploaded or read: " +
        unsupported.join(", "),
        "info"
      );
    }

    return context.join("\n");
  }

  // --------------------------------------------------
  // Send chat message
  // --------------------------------------------------

  async function handleSendMessage(event) {
    if (event) event.preventDefault();

    if (state.isSending) return;

    const input = elements.messageInput;

    if (!input) return;

    const text = input.value.trim();

    if (!text && !state.selectedFiles.length) return;

    if (text.length > MAX_MESSAGE_LENGTH) {
      showNotification(
        "Your message is too long.",
        "error"
      );

      return;
    }

    // Guest mode is intentionally local-only.
    if (!state.user || state.guest) {
      showNotification(
        "Please sign in to send messages to the AI. Guest Mode saves local chats only.",
        "error"
      );

      return;
    }

    setBusy(true);

    try {
      const fileContext = await collectTextFileContext();

      if (!text && !fileContext) {
        showNotification(
          "Please type a message or select a supported text file.",
          "info"
        );

        return;
      }

      const finalText = (
        text || "Please analyze the attached text file."
      ) + fileContext;

      input.value = "";

      state.selectedFiles = [];

      renderSelectedFiles();

      addMessage("user", finalText);

      const result = await sendToAI(finalText);

      addMessage("assistant", result.answer, {
        provider: result.provider,
        model: result.model
      });

      if ($("#voice-replies")?.checked) {
        // Voice replies are enabled only in the JARVIS view.
        if (state.currentView === "jarvis") {
          speakText(result.answer);
        }
      }

    } catch (error) {
      console.error("AI chat error:", error);

      addMessage(
        "assistant",
        `I could not complete that request.\n\n${error.message}\n\nPlease check your login status and backend configuration.`
      );

      showNotification(error.message, "error");

    } finally {
      setBusy(false);

      input.focus();
    }
  }

  // --------------------------------------------------
  // Voice input
  // --------------------------------------------------

  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotification(
        "Voice input is not supported in this browser.",
        "error"
      );

      return;
    }

    if (state.recognition) {
      state.recognition.stop();
      state.recognition = null;
      return;
    }

    const recognition = new SpeechRecognition();

    const selectedLanguage =
      $("#speech-language")?.value ||
      "en-IN";

    recognition.lang =
      selectedLanguage === "auto"
        ? "en-IN"
        : selectedLanguage;

    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      elements.micButton?.classList.add("recording");

      $("#jarvis-status")?.replaceChildren(
        document.createTextNode("Listening...")
      );

      showNotification("Listening...");
    };

    recognition.onresult = event => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }

      if (elements.messageInput) {
        elements.messageInput.value = transcript;
      }

      const jarvisTranscript = $("#jarvis-transcript");

      if (jarvisTranscript) {
        jarvisTranscript.textContent = transcript;
      }
    };

    recognition.onerror = event => {
      showNotification(
        `Voice input error: ${event.error}`,
        "error"
      );
    };

    recognition.onend = () => {
      state.recognition = null;

      elements.micButton?.classList.remove("recording");

      $("#jarvis-status")?.replaceChildren(
        document.createTextNode("JARVIS is ready")
      );
    };

    state.recognition = recognition;

    try {
      recognition.start();
    } catch (error) {
      state.recognition = null;

      showNotification(
        error.message || "Could not start voice input.",
        "error"
      );
    }
  }

  // --------------------------------------------------
  // Speech output
  // --------------------------------------------------

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      showNotification(
        "Speech output is not supported.",
        "error"
      );

      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      String(text)
    );

    const language =
      $("#speech-language")?.value || "en-IN";

    utterance.lang =
      language === "auto" ? "en-IN" : language;

    utterance.onstart = () => {
      state.speaking = true;
    };

    utterance.onend = () => {
      state.speaking = false;
    };

    utterance.onerror = () => {
      state.speaking = false;
    };

    state.speaking = true;

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();

    state.speaking = false;
  }

  // --------------------------------------------------
  // Theme
  // --------------------------------------------------

  function applyTheme(theme) {
    state.theme = theme === "light"
      ? "light"
      : "dark";

    document.body.classList.toggle(
      "light-theme",
      state.theme === "light"
    );

    document.documentElement.dataset.theme =
      state.theme;

    saveLocalData();
  }

  function toggleTheme() {
    applyTheme(
      state.theme === "dark"
        ? "light"
        : "dark"
    );
  }

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  function showView(viewName) {
    if (!viewName) return;

    const target = String(viewName);

    const views = $$(".view, [data-page]");

    let matched = false;

    views.forEach(view => {
      const name =
        view.dataset.view ||
        view.dataset.page ||
        view.id?.replace(/^view-/, "");

      const active = name === target;

      view.classList.toggle("active", active);
      view.classList.toggle("hidden", !active);

      if (active) matched = true;
    });

    $$("[data-view]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === target
      );
    });

    if (!matched) {
      console.warn("View not found:", target);
      return;
    }

    state.currentView = target;

    document.body.dataset.currentView = target;

    const title = $(
      `[data-view="${CSS.escape(target)}"]`
    );

    const titleElement = $("#current-view-title");

    if (titleElement && title) {
      titleElement.textContent =
        title.textContent.trim();
    }

    closeSidebar();
  }

  function openSidebar() {
    elements.sidebar?.classList.add("open");
  }

  function closeSidebar() {
    elements.sidebar?.classList.remove("open");
  }

  function toggleSidebar() {
    elements.sidebar?.classList.toggle("open");
  }

  function initializeNavigation() {
    document.addEventListener("click", event => {
      const nav = event.target.closest("[data-view]");

      const link = event.target.closest("[data-view-link]");

      const target = nav || link;

      if (!target) return;

      event.preventDefault();

      showView(
        target.dataset.view ||
        target.dataset.viewLink
      );
    });

    document.addEventListener("click", event => {
      if (
        window.innerWidth <= 700 &&
        elements.sidebar?.classList.contains("open") &&
        !event.target.closest("#sidebar") &&
        !event.target.closest(".menu-toggle")
      ) {
        closeSidebar();
      }
    });
  }

  // --------------------------------------------------
  // Export conversations
  // --------------------------------------------------

  function downloadText(
    filename,
    content,
    type = "text/plain;charset=utf-8"
  ) {
    const blob = new Blob([content], { type });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportCurrentChat() {
    const chat = getCurrentChat();

    if (!chat) {
      showNotification(
        "There is no conversation to export."
      );

      return;
    }

    const content = chat.messages.map(message =>
      `${message.role.toUpperCase()}\n${message.content}`
    ).join("\n\n--------------------\n\n");

    downloadText(
      `${safeFilename(chat.title)}.txt`,
      content
    );

    showNotification(
      "Conversation exported.",
      "success"
    );
  }

  function exportAllChats() {
    if (!state.chats.length) {
      showNotification("There are no chats to export.");
      return;
    }

    const content = state.chats.map(chat => {
      const messages = chat.messages.map(message =>
        `${message.role.toUpperCase()}\n${message.content}`
      ).join("\n\n");

      return (
        `CONVERSATION: ${chat.title}\n` +
        `DATE: ${chat.createdAt}\n\n` +
        messages
      );
    }).join("\n\n============================\n\n");

    downloadText(
      "K-ULTRA-AI-all-conversations.txt",
      content
    );

    showNotification(
      "All conversations exported.",
      "success"
    );
  }

  // --------------------------------------------------
  // AI-powered workspace tasks
  // --------------------------------------------------

  async function runAITask(prompt, outputElement, heading = "") {
    if (!prompt.trim()) {
      showNotification(
        "Please enter a description first.",
        "info"
      );

      return;
    }

    if (!state.user || state.guest) {
      showNotification(
        "Sign in to use AI-powered tools.",
        "error"
      );

      return;
    }

    if (outputElement) {
      outputElement.textContent = "K-ULTRA AI is working...";
    }

    try {
      const result = await requestAI([
        {
          role: "user",
          content: heading
            ? `${heading}\n\n${prompt}`
            : prompt
        }
      ]);

      if (outputElement) {
        outputElement.textContent = result.answer;
      }

    } catch (error) {
      console.error("Workspace AI error:", error);

      if (outputElement) {
        outputElement.textContent =
          `Error: ${error.message}`;
      }

      showNotification(error.message, "error");
    }
  }

  function initializeWorkspaceForms() {
    $("#research-form")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const query = $("#research-query")?.value.trim();

        const depth = $("#research-depth")?.value || "standard";

        runAITask(
          query,
          $("#research-results"),
          `Research depth: ${depth}. Provide a clear, structured research response.`
        );
      }
    );

    $("#video-form")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const prompt = $("#video-prompt")?.value.trim();

        const format = $("#video-format")?.value || "16:9";

        runAITask(
          prompt,
          $("#video-results"),
          `Create a video concept, script and storyboard. Format: ${format}. This is a planning task, not actual video rendering.`
        );
      }
    );

    $("#website-builder-form")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const description =
          $("#website-description")?.value.trim();

        const type =
          $("#website-type")?.value || "website";

        runAITask(
          description,
          $("#website-builder-results"),
          `Create a detailed ${type} project plan with features, architecture, pages, responsive design and implementation steps.`
        );
      }
    );

    $("#image-generation-form")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        showNotification(
          "Image generation endpoint is not yet available in the deployed Worker.",
          "info"
        );
      }
    );

    $("#travel-search-form")?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const origin = $("#travel-origin")?.value.trim();

        const destination =
          $("#travel-destination")?.value.trim();

        const date = $("#travel-date")?.value;

        const travelers =
          $("#travel-travelers")?.value || "1";

        const prompt =
          `Create a travel planning guide from ${origin} to ${destination}. ` +
          `Departure date: ${date || "not specified"}. ` +
          `Travelers: ${travelers}. ` +
          `Explain possible transport options, preparation and itinerary. ` +
          `Do not claim live availability or make bookings.`;

        runAITask(
          prompt,
          $("#travel-results"),
          "Travel planning assistant"
        );
      }
    );
  }

  // --------------------------------------------------
  // Developer utilities
  // --------------------------------------------------

  function runUtility(action) {
    const input =
      $("#utility-input")?.value ??
      $("#dev-tool-input")?.value ??
      "";

    const output =
      $("#utility-output") ||
      $("#dev-tool-output");

    if (!output) {
      showNotification(
        "Utility output area was not found."
      );

      return;
    }

    try {
      let result = "";

      switch (action) {
        case "json-format":
        case "format-json":
          result = JSON.stringify(
            JSON.parse(input),
            null,
            2
          );
          break;

        case "json-minify":
          result = JSON.stringify(
            JSON.parse(input)
          );
          break;

        case "base64-encode":
          result = btoa(
            unescape(encodeURIComponent(input))
          );
          break;

        case "base64-decode":
          result = decodeURIComponent(
            escape(atob(input))
          );
          break;

        case "url-encode":
          result = encodeURIComponent(input);
          break;

        case "url-decode":
          result = decodeURIComponent(input);
          break;

        case "uuid":
          result = createId();
          break;

        case "timestamp":
          result = String(Date.now());
          break;

        case "markdown-preview":
          output.innerHTML = formatMessage(input);
          return;

        default:
          showNotification(
            "This utility is not implemented.",
            "info"
          );

          return;
      }

      output.textContent = result;

    } catch (error) {
      output.textContent = `Error: ${error.message}`;
    }
  }

  // --------------------------------------------------
  // Sandboxed playground preview
  // --------------------------------------------------

  function runPlayground() {
    const html = $("#playground-html")?.value || "";

    const css = $("#playground-css")?.value || "";

    const js = $("#playground-js")?.value || "";

    const frame = $("#playground-preview");

    if (!frame) {
      showNotification("Preview frame not found.");
      return;
    }

    const documentContent = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport"
          content="width=device-width,initial-scale=1">
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>
          "use strict";
          try {
            ${js}
          } catch (error) {
            document.body.insertAdjacentHTML(
              "beforeend",
              "<pre></pre>"
            );
            document.querySelector("pre").textContent =
              error.message;
          }
        <\/script>
      </body>
      </html>
    `;

    frame.setAttribute("sandbox", "allow-scripts");

    frame.srcdoc = documentContent;
  }

  // --------------------------------------------------
  // Code workspace
  // --------------------------------------------------

  function initializeCodeWorkspace() {
    const editor = $("#code-input");

    const list = $("#project-file-list");

    if (!editor || !list) return;

    if (!state.codeFiles.length) {
      state.codeFiles.push({
        id: createId(),
        name: "main.js",
        content: ""
      });
    }

    function renderFiles() {
      list.innerHTML = state.codeFiles.map(file => `
        <button type="button"
          class="project-file-item"
          data-action="code-select-file"
          data-file-id="${escapeHTML(file.id)}">
          ${escapeHTML(file.name)}
        </button>
      `).join("");
    }

    renderFiles();

    document.addEventListener("click", event => {
      const button = event.target.closest(
        '[data-action="code-select-file"]'
      );

      if (!button) return;

      const file = state.codeFiles.find(
        item => item.id === button.dataset.fileId
      );

      if (!file) return;

      editor.value = file.content;

      const language = $("#code-language");

      if (language) {
        const extension = file.name.split(".").pop();

        const map = {
          js: "javascript",
          ts: "typescript",
          py: "python",
          html: "html",
          css: "css",
          java: "java",
          json: "json"
        };

        language.value = map[extension] || "javascript";
      }
    });
  }

  function saveCurrentCodeFile() {
    const editor = $("#code-input");

    if (!editor) return;

    const file = state.codeFiles[0];

    if (file) {
      file.content = editor.value;
    }

    try {
      localStorage.setItem(
        "kultra_v252_code_files",
        JSON.stringify(state.codeFiles)
      );

      showNotification(
        "Code saved locally.",
        "success"
      );

    } catch (error) {
      showNotification(
        "Could not save code locally.",
        "error"
      );
    }
  }

  function addCodeFile() {
    const name = window.prompt(
      "Enter a file name:",
      "new-file.js"
    );

    if (!name) return;

    if (
      !/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(name)
    ) {
      showNotification(
        "Enter a valid file name.",
        "error"
      );

      return;
    }

    const file = {
      id: createId(),
      name,
      content: ""
    };

    state.codeFiles.push(file);

    localStorage.setItem(
      "kultra_v252_code_files",
      JSON.stringify(state.codeFiles)
    );

    const list = $("#project-file-list");

    if (list) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "project-file-item";
      button.dataset.action = "code-select-file";
      button.dataset.fileId = file.id;
      button.textContent = file.name;

      list.appendChild(button);
    }

    $("#code-input").value = "";
  }

  function loadCodeFiles() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("kultra_v252_code_files") || "[]"
      );

      if (Array.isArray(saved) && saved.length) {
        state.codeFiles = saved;
      }
    } catch (_) {
      state.codeFiles = [];
    }
  }

  // --------------------------------------------------
  // Authentication tabs
  // --------------------------------------------------

  function initializeAuthTabs() {
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-auth-tab]");

      if (!button) return;

      const tab = button.dataset.authTab;

      $$(".auth-tab").forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.authTab === tab
        );
      });

      elements.loginForm?.classList.toggle(
        "hidden",
        tab !== "login"
      );

      elements.signupForm?.classList.toggle(
        "hidden",
        tab !== "signup"
      );
    });
  }

  // --------------------------------------------------
  // Global actions
  // --------------------------------------------------

  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    switch (action) {
      case "new-chat":
        createNewChat();
        showView("chat");
        break;

      case "open-chat":
        openChat(button.dataset.chatId);
        break;

      case "delete-chat":
        deleteCurrentChat();
        break;

      case "clear-chats":
        clearAllChats();
        break;

      case "export-chat":
        exportCurrentChat();
        break;

      case "export-chats":
        exportAllChats();
        break;

      case "sign-out":
      case "logout":
        await signOut();
        break;

      case "toggle-theme":
        toggleTheme();
        break;

      case "google-login":
        await handleGoogleLogin();
        break;

      case "forgot-password":
        await handleForgotPassword();
        break;

      case "toggle-sidebar":
        toggleSidebar();
        break;

      case "close-sidebar":
        closeSidebar();
        break;

      case "attach-file":
        elements.fileInput?.click();
        break;

      case "voice-input":
        startVoiceInput();
        break;

      case "speak-message": {
        const message = getCurrentChat()?.messages.find(
          item => item.id === button.dataset.messageId
        );

        if (message) {
          speakText(message.content);
        }

        break;
      }

      case "copy-message": {
        const message = getCurrentChat()?.messages.find(
          item => item.id === button.dataset.messageId
        );

        if (message) {
          try {
            await navigator.clipboard.writeText(
              message.content
            );

            showNotification(
              "Message copied.",
              "success"
            );

          } catch (_) {
            showNotification(
              "Could not copy the message.",
              "error"
            );
          }
        }

        break;
      }

      case "remove-file": {
        const index = Number(button.dataset.fileIndex);

        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index < state.selectedFiles.length
        ) {
          state.selectedFiles.splice(index, 1);
        }

        renderSelectedFiles();
        break;
      }

      case "run-utility":
        runUtility(button.dataset.utility || "");
        break;

      case "stop-speaking":
        stopSpeaking();
        break;

      case "stop-generation":
        state.abortController?.abort();
        break;

      case "refresh-backend":
        await checkBackend();
        break;

      case "jarvis-listen":
        startVoiceInput();
        break;

      case "jarvis-stop":
        state.recognition?.stop();
        stopSpeaking();
        break;

      case "playground-run":
        runPlayground();
        break;

      case "code-save":
        saveCurrentCodeFile();
        break;

      case "code-add-file":
        addCodeFile();
        break;

      case "code-new":
        $("#code-input").value = "";
        break;

      case "code-download": {
        const code = $("#code-input")?.value || "";

        const language =
          $("#code-language")?.value || "javascript";

        const extensions = {
          javascript: "js",
          typescript: "ts",
          python: "py",
          html: "html",
          css: "css",
          java: "java",
          c: "c",
          cpp: "cpp",
          json: "json"
        };

        downloadText(
          `kultra-code.${extensions[language] || "txt"}`,
          code
        );

        break;
      }

      case "clear-terminal":
        $("#code-output")?.replaceChildren();
        break;

      case "code-run":
        showNotification(
          "Secure code execution is not connected. Use the isolated Playground for HTML previews.",
          "info"
        );
        break;

      case "code-format":
        showNotification(
          "A code formatter dependency is not connected yet.",
          "info"
        );
        break;

      case "code-debug": {
        const code = $("#code-input")?.value || "";

        const language =
          $("#code-language")?.value || "javascript";

        if (code.trim()) {
          showView("chat");

          elements.messageInput.value =
            `Please review and debug this ${language} code:\n\n` +
            "```" + language + "\n" +
            code +
            "\n```";

          elements.messageInput.focus();
        }

        break;
      }

      case "website-preview":
        showNotification(
          "Generate a website project first. Preview requires generated HTML.",
          "info"
        );
        break;

      case "image-download":
      case "image-preview":
        showNotification(
          "No generated image is available yet.",
          "info"
        );
        break;

      case "account-menu":
      case "profile":
        showView("profile");
        break;

      case "notifications":
        showNotification(
          "There are no new notifications."
        );
        break;

      default:
        if (button.dataset.prompt) {
          showView("chat");

          if (elements.messageInput) {
            elements.messageInput.value =
              button.dataset.prompt;

            elements.messageInput.focus();
          }

          break;
        }

        if (button.dataset.course) {
          showView("chat");

          elements.messageInput.value =
            `Create a structured learning course for ${button.dataset.course}. Include lessons, exercises and a learning roadmap.`;

          elements.messageInput.focus();

          break;
        }

        if (button.dataset.it) {
          showView("chat");

          elements.messageInput.value =
            `Explain ${button.dataset.it} in detail. Include skills, tools, projects and career paths.`;

          elements.messageInput.focus();

          break;
        }

        showNotification(
          `This action needs an additional integration: ${action}`,
          "info"
        );
    }
  });

  // --------------------------------------------------
  // Search and forms
  // --------------------------------------------------

  function initializeForms() {
    elements.loginForm?.addEventListener(
      "submit",
      handleLogin
    );

    elements.signupForm?.addEventListener(
      "submit",
      handleSignup
    );

    elements.chatForm?.addEventListener(
      "submit",
      handleSendMessage
    );

    elements.guestButton?.addEventListener(
      "click",
      startGuestMode
    );

    elements.fileInput?.addEventListener(
      "change",
      handleFileSelection
    );

    $("#chat-search")?.addEventListener(
      "input",
      event => renderChatList(event.target.value)
    );

    elements.messageInput?.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {
          event.preventDefault();

          elements.chatForm?.requestSubmit();
        }
      }
    );

    $("#response-language")?.addEventListener(
      "change",
      event => {
        const selected = event.target.selectedOptions[0];

        const status = $("#chat-model-status");

        if (status) {
          status.textContent =
            `AI Assistant · ${selected?.textContent || "Auto language"}`;
        }
      }
    );

    $("#ai-model-select")?.addEventListener(
      "change",
      event => {
        const status = $("#chat-model-status");

        if (status) {
          status.textContent =
            `AI Assistant · ${event.target.value} preset`;
        }
      }
    );

    initializeWorkspaceForms();

    initializeAuthTabs();
  }

  // --------------------------------------------------
  // Application initialization
  // --------------------------------------------------

  function initialize() {
    loadLocalData();

    loadCodeFiles();

    applyTheme(state.theme);

    initializeNavigation();

    initializeForms();

    initializeCodeWorkspace();

    if (state.chats.length) {
      state.currentChatId = state.chats[0].id;
    }

    renderChat();

    renderChatList();

    renderRecentChats();

    checkBackend();

    initializeAuth();

    console.log(
      `${APP_NAME} Version ${APP_VERSION} initialized.`
    );
  }

  // --------------------------------------------------
  // Start application
  // --------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

  // --------------------------------------------------
  // Public application interface
  // --------------------------------------------------

  window.KULTRA_APP = Object.freeze({
    showView,

    createNewChat,

    sendMessage: handleSendMessage,

    checkBackend,

    signOut,

    showNotification,

    getCurrentChat,

    getState: () => ({
      guest: state.guest,
      authenticated: Boolean(state.user),
      backendOnline: state.backendOnline,
      currentView: state.currentView
    })
  });

})();
