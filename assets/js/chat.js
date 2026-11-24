
/* ============================================
   @K-UNIQUE AI CHAT
   VERSION: 1.1.0
   FILE: assets/js/chat.js
============================================ */

(function (window, document) {
  "use strict";

  const API = window.KUNIQUE_API;

  if (!API) {
    console.error("[K-UNIQUE] API connector not loaded.");
    return;
  }

  const CHAT = {
    history: [],
    conversations: [],
    currentConversationId: null,
    busy: false,
    initialized: false,
    storageKey: "kunique_chat_history",
    maxHistory: 50
  };

  const elements = {};

  function getElements() {
    elements.form = document.getElementById("chatForm");
    elements.input = document.getElementById("messageInput");
    elements.send = document.getElementById("sendBtn");
    elements.messages = document.getElementById("messageContainer");
    elements.welcome = document.getElementById("welcomeScreen");
  }

  function createId() {
    return Date.now().toString(36) +
      Math.random().toString(36).slice(2, 9);
  }

  function saveHistory() {
    try {
      const data = {
        conversations: CHAT.conversations.slice(-CHAT.maxHistory),
        currentConversationId: CHAT.currentConversationId
      };

      localStorage.setItem(
        CHAT.storageKey,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn("[K-UNIQUE] History save failed:", error);
    }
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(CHAT.storageKey);

      if (!saved) {
        CHAT.conversations = [];
        return;
      }

      const parsed = JSON.parse(saved);

      // Backward compatibility with old array-based history.
      if (Array.isArray(parsed)) {
        CHAT.conversations = parsed.length
          ? [{
              id: createId(),
              title: "Previous conversation",
              messages: parsed,
              updatedAt: Date.now()
            }]
          : [];
      } else {
        CHAT.conversations = Array.isArray(parsed.conversations)
          ? parsed.conversations.filter(item =>
              item &&
              typeof item.id === "string" &&
              Array.isArray(item.messages)
            ).slice(-CHAT.maxHistory)
          : [];

        CHAT.currentConversationId =
          parsed.currentConversationId || null;
      }

      let current = CHAT.conversations.find(
        item => item.id === CHAT.currentConversationId
      );

      if (!current && CHAT.conversations.length) {
        current = CHAT.conversations[
          CHAT.conversations.length - 1
        ];
      }

      if (current) {
        CHAT.currentConversationId = current.id;
        CHAT.history = current.messages.filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        );
      }

    } catch (error) {
      console.warn("[K-UNIQUE] History load failed:", error);
      CHAT.conversations = [];
      CHAT.history = [];
      CHAT.currentConversationId = null;
    }
  }

  function getCurrentConversation() {
    return CHAT.conversations.find(
      item => item.id === CHAT.currentConversationId
    );
  }

  function ensureConversation() {
    let conversation = getCurrentConversation();

    if (!conversation) {
      conversation = {
        id: createId(),
        title: "New conversation",
        messages: [],
        updatedAt: Date.now()
      };

      CHAT.conversations.push(conversation);
      CHAT.currentConversationId = conversation.id;
    }

    return conversation;
  }

  function syncConversation() {
    const conversation = ensureConversation();

    conversation.messages = CHAT.history.slice();
    conversation.updatedAt = Date.now();

    const firstUserMessage = CHAT.history.find(
      item => item.role === "user"
    );

    if (firstUserMessage) {
      conversation.title =
        firstUserMessage.content.slice(0, 60);
    }

    saveHistory();
  }

  function createMessage(role, content) {
    const message = document.createElement("div");

    message.className = "chat-message " + role;
    message.textContent = String(content);

    elements.messages.appendChild(message);

    return message;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      elements.messages.scrollTop =
        elements.messages.scrollHeight;
    });
  }

  function renderHistory() {
    elements.messages.innerHTML = "";

    if (!CHAT.history.length) {
      elements.welcome.hidden = false;
      return;
    }

    elements.welcome.hidden = true;

    CHAT.history.forEach(item => {
      createMessage(item.role, item.content);
    });

    scrollToBottom();
  }

  function setBusy(busy) {
    CHAT.busy = busy;

    elements.send.disabled = busy;
    elements.input.disabled = busy;

    elements.send.textContent = busy ? "…" : "➤";

    elements.send.setAttribute(
      "aria-label",
      busy ? "Sending message" : "Send message"
    );
  }

  function extractAnswer(response) {
    if (typeof response === "string") {
      return response;
    }

    if (!response || typeof response !== "object") {
      return "";
    }

    const candidates = [
      response.reply,
      response.response,
      response.message,
      response.output_text,
      response.data?.reply,
      response.data?.response,
      response.data?.message,
      response.result?.response
    ];

    return candidates.find(
      value => typeof value === "string" && value.trim()
    ) || "";
  }

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || "").trim();

    if (!message || CHAT.busy) return;

    const maxLength =
      window.KUNIQUE_CONFIG?.AI?.CHAT?.MAX_MESSAGE_LENGTH || 12000;

    if (message.length > maxLength) {
      alert("Message is too long. Maximum " + maxLength + " characters.");
      return;
    }

    ensureConversation();

    elements.welcome.hidden = true;

    CHAT.history.push({
      role: "user",
      content: message
    });

    createMessage("user", message);

    elements.input.value = "";
    elements.input.style.height = "auto";

    syncConversation();
    scrollToBottom();

    const loadingMessage = createMessage(
      "assistant",
      "Thinking..."
    );

    setBusy(true);

    try {
      const maxHistory =
        window.KUNIQUE_CONFIG?.AI?.CHAT?.MAX_HISTORY || 20;

      // Latest message is passed separately to API.chat().
      const previousHistory = CHAT.history
        .slice(0, -1)
        .slice(-maxHistory);

      const response = await API.chat(
        message,
        previousHistory
      );

      const answer = extractAnswer(response);

      loadingMessage.remove();

      if (!answer) {
        throw new Error(
          response?.error ||
          response?.message ||
          "AI returned an empty response."
        );
      }

      CHAT.history.push({
        role: "assistant",
        content: answer
      });

      createMessage("assistant", answer);

      syncConversation();
      scrollToBottom();

    } catch (error) {
      loadingMessage.textContent =
        "Error: " + (error.message || "Unable to contact AI.");

      console.error("[K-UNIQUE] Chat error:", error);

    } finally {
      setBusy(false);
      elements.input.focus();
    }
  }

  function newChat() {
    if (CHAT.busy) return;

    CHAT.history = [];
    CHAT.currentConversationId = null;

    ensureConversation();
    syncConversation();

    elements.messages.innerHTML = "";
    elements.welcome.hidden = false;
    elements.input.value = "";
    elements.input.style.height = "auto";
    elements.input.focus();

    showHistory();
  }

  function clearHistory() {
    if (CHAT.busy) return;

    if (!confirm("Clear all saved conversations?")) {
      return;
    }

    CHAT.history = [];
    CHAT.conversations = [];
    CHAT.currentConversationId = null;

    try {
      localStorage.removeItem(CHAT.storageKey);
    } catch (error) {
      console.warn("[K-UNIQUE] Could not clear history:", error);
    }

    elements.messages.innerHTML = "";
    elements.welcome.hidden = false;
    elements.input.value = "";

    showHistory();
  }

  function openConversation(id) {
    if (CHAT.busy) return;

    const conversation = CHAT.conversations.find(
      item => item.id === id
    );

    if (!conversation) return;

    CHAT.currentConversationId = conversation.id;
    CHAT.history = conversation.messages.slice();

    saveHistory();
    renderHistory();

    document.getElementById("aiPage").hidden = false;
    document.getElementById("historyPage").hidden = true;

    const settingsPage = document.getElementById("settingsPage");
    if (settingsPage) settingsPage.hidden = true;
  }

  function showHistory() {
    const historyList = document.getElementById("historyList");

    if (!historyList) return;

    historyList.innerHTML = "";

    if (!CHAT.conversations.length) {
      const empty = document.createElement("p");
      empty.textContent = "No chat history yet.";
      historyList.appendChild(empty);
      return;
    }

    CHAT.conversations
      .slice()
      .reverse()
      .forEach(conversation => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "history-item";
        button.textContent =
          conversation.title || "Untitled conversation";

        button.addEventListener("click", () => {
          openConversation(conversation.id);
        });

        historyList.appendChild(button);
      });
  }

  function bindEvents() {
    elements.form.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage(elements.input.value);
    });

    elements.input.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        elements.form.requestSubmit();
      }
    });

    elements.input.addEventListener("input", () => {
      elements.input.style.height = "auto";

      elements.input.style.height =
        Math.min(elements.input.scrollHeight, 180) + "px";
    });

    document.getElementById("newChatBtn")
      ?.addEventListener("click", newChat);

    document.getElementById("clearHistoryBtn")
      ?.addEventListener("click", clearHistory);

    document.querySelectorAll("[data-prompt]")
      .forEach(button => {
        button.addEventListener("click", () => {
          sendMessage(button.dataset.prompt || "");
        });
      });
  }

  function init() {
    if (CHAT.initialized) return;

    getElements();

    if (
      !elements.form ||
      !elements.input ||
      !elements.send ||
      !elements.messages ||
      !elements.welcome
    ) {
      console.error("[K-UNIQUE] Chat HTML elements are missing.");
      return;
    }

    CHAT.initialized = true;

    loadHistory();
    bindEvents();
    renderHistory();
    showHistory();

    console.log("[K-UNIQUE] AI Chat initialized.");
  }

  window.KUNIQUE_CHAT = Object.freeze({
    init,
    sendMessage,
    newChat,
    clearHistory,
    showHistory,
    openConversation,
    getHistory: () => CHAT.history.slice(),
    getConversations: () => CHAT.conversations.slice(),
    get busy() {
      return CHAT.busy;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})(window, document);
         
