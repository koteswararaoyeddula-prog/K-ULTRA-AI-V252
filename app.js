
"use strict";

/*
 * K-ULTRA AI — VERSION 252.0
 * FILE: app.js
 * Main Frontend Application Controller
 *
 * Features:
 * - Firebase Email/Password Authentication
 * - Google Authentication
 * - Guest Mode
 * - Local Chat History
 * - Cloudflare Worker AI Chat
 * - Conversation Search and Export
 * - Voice Input and Speech Output
 * - File Attachment Selection
 * - Theme Switching
 * - Navigation and UI Controls
 * - Basic Developer Utilities
 *
 * IMPORTANT:
 * Real payments, travel bookings, media generation, cloud storage,
 * and secure code execution require separate backend integrations.
 */

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG || {};
  const APP_NAME = CONFIG.APP?.NAME || "K-ULTRA AI";
  const STORAGE_KEY = "kultra_v252_data";
  const SESSION_KEY = "kultra_v252_session";

  const state = {
    user: null,
    guest: false,
    chats: [],
    currentChatId: null,
    selectedFiles: [],
    isSending: false,
    recognition: null,
    speaking: false,
    backendOnline: false,
    theme: "dark"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    authScreen: $("#auth-screen"),
    app: $("#app"),
    loginForm: $("#login-form"),
    signupForm: $("#signup-form"),
    guestButton: $("#guest-mode-btn"),
    chatForm: $("#chat-form"),
    messageInput: $("#message-input"),
    chatMessages: $("#chat-messages"),
    fileInput: $("#chat-file-input"),
    sendButton: $("#send-message-btn"),
    micButton: $("#chat-mic-btn"),
    newChatButton: $("#new-chat-btn"),
    backendStatus: $("#backend-status"),
    dialog: $("#global-dialog")
  };

  // --------------------------------------------------
  // General utilities
  // --------------------------------------------------

  function createId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 9)
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

  function getConfigEndpoint(name) {
    if (typeof CONFIG.API?.getEndpoint === "function") {
      return CONFIG.API.getEndpoint(name);
    }

    const endpoints = CONFIG.API?.ENDPOINTS || {};
    const base = String(CONFIG.API?.BASE_URL || "").replace(/\/+$/, "");
    const path = endpoints[name] || `/api/${name}`;

    return base + (path.startsWith("/") ? path : `/${path}`);
  }

  function getChatEndpoint() {
    return getConfigEndpoint("CHAT");
  }

  function showNotification(message, type = "info") {
    let container = $("#kultra-toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "kultra-toast-container";
      container.style.cssText =
        "position:fixed;right:18px;bottom:18px;z-index:99999;" +
        "display:flex;flex-direction:column;gap:8px;max-width:min(360px,90vw)";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.setAttribute("role", "status");
    toast.style.cssText =
      "padding:12px 16px;border-radius:10px;color:white;" +
      "background:" +
      (type === "error" ? "#b42318" :
        type === "success" ? "#137a45" : "#26334f") +
      ";box-shadow:0 5px 20px #0004;font-size:14px";

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function setBackendStatus(online, message) {
    state.backendOnline = Boolean(online);

    const status = elements.backendStatus;
    if (!status) return;

    status.textContent = message ||
      (online ? "● Backend online" : "● Backend offline");

    status.classList.toggle("connected", Boolean(online));
    status.classList.toggle("error", !online);
    status.setAttribute("aria-label", status.textContent);
  }

  function setBusy(busy) {
    state.isSending = busy;

    if (elements.sendButton) {
      elements.sendButton.disabled = busy;
      elements.sendButton.textContent = busy ? "Sending..." : "Send";
    }

    if (elements.messageInput) {
      elements.messageInput.disabled = busy;
    }
  }

  // --------------------------------------------------
  // Local storage and chat history
  // --------------------------------------------------

  function loadLocalData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};

      state.chats = Array.isArray(saved.chats) ? saved.chats : [];
      state.theme = saved.theme || "dark";
    } catch (error) {
      console.warn("Could not load local chat data:", error);
      state.chats = [];
    }
  }

  function saveLocalData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        chats: state.chats,
        theme: state.theme,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Local storage save failed:", error);
      showNotification(
        "Unable to save locally. Device storage may be full.",
        "error"
      );
    }
  }

  function getCurrentChat() {
    return state.chats.find(chat => chat.id === state.currentChatId) || null;
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

    if (elements.messageInput) {
      elements.messageInput.focus();
    }

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

    if (chat.messages.length === 1 && role === "user") {
      chat.title = String(content).slice(0, 45) || "New chat";
    }

    state.chats.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    saveLocalData();
    renderChat();
    renderChatList();

    return message;
  }

  function openChat(chatId) {
    const chat = state.chats.find(item => item.id === chatId);
    if (!chat) return;

    state.currentChatId = chatId;
    renderChat();
    renderChatList();
    showView("chat");
  }

  function deleteCurrentChat() {
    if (!state.currentChatId) return;

    state.chats = state.chats.filter(
      chat => chat.id !== state.currentChatId
    );

    state.currentChatId = null;
    saveLocalData();

    if (state.chats.length) {
      state.currentChatId = state.chats[0].id;
    }

    renderChat();
    renderChatList();
    showNotification("Chat deleted.", "success");
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

    showNotification("All local chats cleared.", "success");
  }

  // --------------------------------------------------
  // Message rendering
  // --------------------------------------------------

  function formatMessage(content) {
    let text = escapeHTML(content);

    // Protect fenced code blocks before basic formatting.
    const codeBlocks = [];

    text = text.replace(/```([\w-]*)\n?([\s\S]*?)```/g,
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

    text = text.replace(/__KULTRA_CODE_(\d+)__/g,
      (_, index) => codeBlocks[Number(index)] || ""
    );

    return text;
  }

  function renderChat() {
    const container = elements.chatMessages;
    if (!container) return;

    const chat = getCurrentChat();

    if (!chat || !chat.messages.length) {
      container.innerHTML = `
        <div class="chat-empty-state">
          <h2>Welcome to ${escapeHTML(APP_NAME)}</h2>
          <p>Ask a question, write code, explore ideas, or learn something new.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = chat.messages.map(message => {
      const role = message.role === "assistant" ? "assistant" : "user";
      const label = role === "assistant" ? APP_NAME : "You";

      return `
        <article class="message ${role}" data-message-id="${escapeHTML(message.id)}">
          <div class="message-author">${escapeHTML(label)}</div>
          <div class="message-content">${formatMessage(message.content)}</div>
          <div class="message-actions">
            <button type="button" data-action="copy-message"
              data-message-id="${escapeHTML(message.id)}">Copy</button>
          </div>
        </article>
      `;
    }).join("");

    container.scrollTop = container.scrollHeight;
  }

  function renderChatList(filter = "") {
    const container = $(
      "#conversation-list, #chat-history-list, [data-chat-list]"
    );

    if (!container) return;

    const query = filter.trim().toLowerCase();

    const chats = state.chats.filter(chat =>
      !query ||
      chat.title.toLowerCase().includes(query) ||
      chat.messages.some(message =>
        message.content.toLowerCase().includes(query)
      )
    );

    container.innerHTML = chats.map(chat => `
      <button type="button"
        class="conversation-item ${chat.id === state.currentChatId ? "active" : ""}"
        data-action="open-chat"
        data-chat-id="${escapeHTML(chat.id)}">
        <span>${escapeHTML(chat.title)}</span>
      </button>
    `).join("");

    if (!chats.length) {
      container.innerHTML = "<p class='empty-list'>No conversations found.</p>";
    }
  }

  // --------------------------------------------------
  // AI backend connection
  // --------------------------------------------------

  async function getAuthorizationHeaders() {
    if (typeof CONFIG.API?.getAuthHeaders === "function") {
      return await CONFIG.API.getAuthHeaders();
    }

    const headers = { "Content-Type": "application/json" };

    if (state.user && !state.guest) {
      const token = await state.user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async function checkBackend() {
    const base = String(CONFIG.API?.BASE_URL || "").replace(/\/+$/, "");

    if (!base || base.includes("YOUR-CLOUDFLARE-WORKER-URL")) {
      setBackendStatus(false, "● Backend URL not configured");
      return false;
    }

    try {
      const response = await fetch(`${base}/health`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout
          ? AbortSignal.timeout(10000)
          : undefined
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setBackendStatus(true, "● Backend online");
      return true;
    } catch (error) {
      console.warn("Backend health check failed:", error);
      setBackendStatus(false, "● Backend connection failed");
      return false;
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

    const language =
      $("#language-selector")?.value ||
      $("#chat-language")?.value ||
      "auto";

    const model =
      $("#model-selector")?.value ||
      $("#chat-model")?.value ||
      "default";

    const headers = await getAuthorizationHeaders();

    const response = await fetch(getChatEndpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userText,
        messages: history,
        history,
        model,
        language
      })
    });

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { response: raw };
    }

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `AI request failed (${response.status})`
      );
    }

    const answer =
      data.response ||
      data.reply ||
      data.message ||
      data.output ||
      data.result?.response ||
      data.result?.text;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("The backend returned an empty or unsupported response.");
    }

    return answer;
  }

  async function handleSendMessage(event) {
    if (event) event.preventDefault();

    if (state.isSending) return;

    const input = elements.messageInput;
    if (!input) return;

    const text = input.value.trim();

    if (!text && !state.selectedFiles.length) return;

    if (!text && state.selectedFiles.length) {
      showNotification(
        "Please type a message describing the selected file.",
        "info"
      );
      return;
    }

    if (text.length > (CONFIG.CHAT?.MAX_MESSAGE_LENGTH || 12000)) {
      showNotification("Your message is too long.", "error");
      return;
    }

    input.value = "";

    const attachmentNote = state.selectedFiles.length
      ? "\n\nSelected files: " +
        state.selectedFiles.map(file => file.name).join(", ")
      : "";

    const finalText = text + attachmentNote;

    state.selectedFiles = [];
    renderSelectedFiles();

    addMessage("user", finalText);
    setBusy(true);

    const loading = document.createElement("div");
    loading.className = "message assistant loading-message";
    loading.textContent = `${APP_NAME} is thinking...`;

    elements.chatMessages?.appendChild(loading);

    try {
      const answer = await sendToAI(finalText);
      loading.remove();
      addMessage("assistant", answer);
    } catch (error) {
      loading.remove();

      console.error("AI chat error:", error);

      addMessage(
        "assistant",
        `I could not complete that request. ${error.message}\n\nPlease check your internet connection, login status, and backend configuration.`
      );

      showNotification(error.message, "error");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  function getFirebaseAuth() {
    try {
      if (window.firebase && typeof window.firebase.auth === "function") {
        return window.firebase.auth();
      }
    } catch (error) {
      console.error("Firebase Auth initialization error:", error);
    }

    return null;
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

    renderChat();
    renderChatList();
  }

  function startGuestMode() {
    state.user = null;
    state.guest = true;

    try {
      sessionStorage.setItem(SESSION_KEY, "guest");
    } catch (_) {}

    showApplication();
    showNotification("Guest Mode enabled. Chats are saved on this device.");
    checkBackend();
  }

  async function handleLogin(event) {
    event.preventDefault();

    const auth = getFirebaseAuth();
    if (!auth) {
      showNotification("Firebase Authentication is not initialized.", "error");
      return;
    }

    const email = $("#login-email")?.value.trim();
    const password = $("#login-password")?.value;

    if (!email || !password) {
      showNotification("Enter your email and password.", "error");
      return;
    }

    const submit = $("button[type='submit']", elements.loginForm);
    if (submit) submit.disabled = true;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showNotification("Login successful.", "success");
    } catch (error) {
      showNotification(error.message || "Login failed.", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function handleSignup(event) {
    event.preventDefault();

    const auth = getFirebaseAuth();
    if (!auth) {
      showNotification("Firebase Authentication is not initialized.", "error");
      return;
    }

    const email = $("#signup-email")?.value.trim();
    const password = $("#signup-password")?.value;
    const confirmPassword =
      $("#signup-confirm-password")?.value;

    if (!email || !password) {
      showNotification("Enter your email and password.", "error");
      return;
    }

    if (password.length < 6) {
      showNotification("Password must contain at least 6 characters.", "error");
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }

    const submit = $("button[type='submit']", elements.signupForm);
    if (submit) submit.disabled = true;

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      showNotification("Account created successfully.", "success");
    } catch (error) {
      showNotification(error.message || "Signup failed.", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function handleGoogleLogin() {
    const auth = getFirebaseAuth();

    if (!auth) {
      showNotification("Firebase Authentication is not initialized.", "error");
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      showNotification("Google login successful.", "success");
    } catch (error) {
      showNotification(
        error.message || "Google login failed. Check Firebase settings.",
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
      console.warn("Firebase Auth is not available.");
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
          guestSession = sessionStorage.getItem(SESSION_KEY) === "guest";
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
  // Navigation
  // --------------------------------------------------

  function showView(viewName) {
    if (!viewName) return;

    const views = $$(".view, [data-page]");
    let matched = false;

    views.forEach(view => {
      const name =
        view.dataset.view ||
        view.dataset.page ||
        view.id?.replace(/-view$/, "");

      const active = name === viewName;

      view.classList.toggle("active", active);
      view.classList.toggle("hidden", !active);

      if (active) matched = true;
    });

    $$("[data-view]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === viewName
      );
    });

    if (!matched) {
      console.warn(`View not found: ${viewName}`);
    }

    document.body.dataset.currentView = viewName;
  }

  function initializeNavigation() {
    document.addEventListener("click", event => {
      const nav = event.target.closest("[data-view]");
      const link = event.target.closest("[data-view-link]");

      const target = nav || link;

      if (target) {
        event.preventDefault();
        showView(target.dataset.view || target.dataset.viewLink);
      }
    });
  }

  // --------------------------------------------------
  // File selection
  // --------------------------------------------------

  function renderSelectedFiles() {
    let container = $("#selected-files");

    if (!container && elements.fileInput) {
      container = document.createElement("div");
      container.id = "selected-files";
      elements.fileInput.insertAdjacentElement("afterend", container);
    }

    if (!container) return;

    container.innerHTML = state.selectedFiles.map((file, index) => `
      <span class="selected-file">
        ${escapeHTML(file.name)}
        <button type="button" data-action="remove-file"
          data-file-index="${index}" aria-label="Remove file">×</button>
      </span>
    `).join("");
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024;

    const accepted = files.filter(file => {
      if (file.size > maxSize) {
        showNotification(`${file.name} is larger than 10 MB.`, "error");
        return false;
      }
      return true;
    });

    state.selectedFiles = [...state.selectedFiles, ...accepted].slice(0, 5);
    renderSelectedFiles();

    // Reset so the same file can be selected again.
    event.target.value = "";
  }

  // --------------------------------------------------
  // Voice input and speech output
  // --------------------------------------------------

  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotification(
        "Voice input is not supported in this browser. Try Chrome.",
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
    recognition.lang =
      $("#speech-language")?.value ||
      $("#language-selector")?.value ||
      "en-IN";

    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      showNotification("Listening...");
      elements.micButton?.classList.add("recording");
    };

    recognition.onresult = event => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (elements.messageInput) {
        elements.messageInput.value = transcript;
      }
    };

    recognition.onerror = event => {
      showNotification(`Voice input error: ${event.error}`, "error");
    };

    recognition.onend = () => {
      state.recognition = null;
      elements.micButton?.classList.remove("recording");
    };

    state.recognition = recognition;
    recognition.start();
  }

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      showNotification("Speech output is not supported.", "error");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      $("#speech-language")?.value || "en-IN";

    utterance.onend = () => {
      state.speaking = false;
    };

    state.speaking = true;
    window.speechSynthesis.speak(utterance);
  }

  // --------------------------------------------------
  // Theme
  // --------------------------------------------------

  function applyTheme(theme) {
    state.theme = theme === "light" ? "light" : "dark";

    document.body.classList.toggle(
      "light-theme",
      state.theme === "light"
    );

    document.documentElement.dataset.theme = state.theme;

    saveLocalData();
  }

  function toggleTheme() {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  }

  // --------------------------------------------------
  // Export conversations
  // --------------------------------------------------

  function downloadText(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function exportCurrentChat() {
    const chat = getCurrentChat();

    if (!chat) {
      showNotification("There is no conversation to export.");
      return;
    }

    const content = chat.messages.map(message =>
      `${message.role.toUpperCase()}\n${message.content}`
    ).join("\n\n--------------------\n\n");

    downloadText(
      `${chat.title.replace(/[^a-z0-9-_]/gi, "_")}.txt`,
      content
    );
  }

  // --------------------------------------------------
  // Basic developer utilities
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
      showNotification("Utility output area was not found.");
      return;
    }

    try {
      let result = "";

      switch (action) {
        case "json-format":
        case "format-json":
          result = JSON.stringify(JSON.parse(input), null, 2);
          break;

        case "json-minify":
          result = JSON.stringify(JSON.parse(input));
          break;

        case "base64-encode":
          result = btoa(unescape(encodeURIComponent(input)));
          break;

        case "base64-decode":
          result = decodeURIComponent(escape(atob(input)));
          break;

        case "url-encode":
          result = encodeURIComponent(input);
          break;

        case "url-decode":
          result = decodeURIComponent(input);
          break;

        case "uuid":
          result = crypto.randomUUID
            ? crypto.randomUUID()
            : createId();
          break;

        case "timestamp":
          result = String(Date.now());
          break;

        case "markdown-preview":
          result = formatMessage(input);
          output.innerHTML = result;
          return;

        default:
          showNotification(
            "This utility is not implemented yet.",
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
  // Global UI actions
  // --------------------------------------------------

  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    switch (action) {
      case "new-chat":
        createNewChat();
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

      case "sign-out":
      case "logout":
        await signOut();
        break;

      case "toggle-theme":
        toggleTheme();
        break;

      case "export-chat":
        exportCurrentChat();
        break;

      case "google-login":
        await handleGoogleLogin();
        break;

      case "speak-message": {
        const messageId = button.dataset.messageId;
        const message = getCurrentChat()?.messages.find(
          item => item.id === messageId
        );
        if (message) speakText(message.content);
        break;
      }

      case "copy-message": {
        const messageId = button.dataset.messageId;
        const message = getCurrentChat()?.messages.find(
          item => item.id === messageId
        );

        if (message) {
          try {
            await navigator.clipboard.writeText(message.content);
            showNotification("Message copied.", "success");
          } catch (_) {
            showNotification("Could not copy this message.", "error");
          }
        }
        break;
      }

      case "remove-file": {
        const index = Number(button.dataset.fileIndex);
        state.selectedFiles.splice(index, 1);
        renderSelectedFiles();
        break;
      }

      case "run-utility":
        runUtility(button.dataset.utility || "");
        break;

      case "stop-speaking":
        window.speechSynthesis?.cancel();
        state.speaking = false;
        break;

      case "refresh-backend":
        await checkBackend();
        break;

      default:
        if (button.dataset.prompt && elements.messageInput) {
          elements.messageInput.value = button.dataset.prompt;
          elements.messageInput.focus();
        }
        break;
    }
  });

  // --------------------------------------------------
  // Search and forms
  // --------------------------------------------------

  function initializeForms() {
    elements.loginForm?.addEventListener("submit", handleLogin);
    elements.signupForm?.addEventListener("submit", handleSignup);
    elements.chatForm?.addEventListener("submit", handleSendMessage);

    elements.guestButton?.addEventListener("click", startGuestMode);

    elements.newChatButton?.addEventListener("click", createNewChat);

    elements.fileInput?.addEventListener("change", handleFileSelection);

    elements.micButton?.addEventListener("click", startVoiceInput);

    $("#google-login-btn")?.addEventListener("click", handleGoogleLogin);

    $("#theme-toggle")?.addEventListener("click", toggleTheme);

    $("#chat-search, #conversation-search")?.addEventListener(
      "input",
      event => renderChatList(event.target.value)
    );

    $("#export-chat-btn")?.addEventListener("click", exportCurrentChat);

    $("#clear-chats-btn")?.addEventListener("click", clearAllChats);

    $("#delete-chat-btn")?.addEventListener("click", deleteCurrentChat);

    $$("[data-prompt]").forEach(button => {
      button.addEventListener("click", () => {
        if (!elements.messageInput) return;

        elements.messageInput.value = button.dataset.prompt;
        elements.messageInput.focus();
      });
    });

    elements.messageInput?.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        elements.chatForm?.requestSubmit();
      }
    });
  }

  // --------------------------------------------------
  // Initialize application
  // --------------------------------------------------

  function initialize() {
    loadLocalData();
    applyTheme(state.theme);

    initializeNavigation();
    initializeForms();

    if (state.chats.length) {
      state.currentChatId = state.chats[0].id;
    }

    renderChat();
    renderChatList();

    initializeAuth();

    // Backend status check; does not require an authenticated session.
    checkBackend();

    console.log(
      `${APP_NAME} Version ${CONFIG.APP?.VERSION || "252.0"} initialized.`
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

  // Expose a small, controlled public interface for other frontend files.
  window.KULTRA_APP = Object.freeze({
    showView,
    createNewChat,
    sendMessage: handleSendMessage,
    checkBackend,
    signOut,
    showNotification,
    getCurrentChat: () => getCurrentChat()
  });

})();
