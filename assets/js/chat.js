
/* ============================================
   @K-UNIQUE AI CHAT
   VERSION: 1.0.0
   FILE: assets/js/chat.js
============================================ */

(function (window) {
  "use strict";

  const API = window.KUNIQUE_API;

  if (!API) {
    console.error("[K-UNIQUE] API connector not loaded.");
    return;
  }

  const CHAT = {
    history: [],
    busy: false,
    storageKey: "kunique_chat_history"
  };

  const elements = {};

  function getElements() {
    elements.form = document.getElementById("chatForm");
    elements.input = document.getElementById("messageInput");
    elements.send = document.getElementById("sendBtn");
    elements.messages = document.getElementById("messageContainer");
    elements.welcome = document.getElementById("welcomeScreen");
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        CHAT.storageKey,
        JSON.stringify(CHAT.history.slice(-50))
      );
    } catch (error) {
      console.warn("[K-UNIQUE] Could not save history:", error);
    }
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(CHAT.storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      CHAT.history = Array.isArray(parsed)
        ? parsed.filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          ).slice(-50)
        : [];
    } catch (error) {
      CHAT.history = [];
    }
  }

  function createMessage(role, content) {
    const message = document.createElement("div");

    message.className = "chat-message " + role;
    message.textContent = content;

    elements.messages.appendChild(message);

    return message;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      elements.messages.scrollTop =
        elements.messages.scrollHeight;

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    });
  }

  function renderHistory() {
    elements.messages.innerHTML = "";

    if (CHAT.history.length > 0) {
      elements.welcome.hidden = true;
    } else {
      elements.welcome.hidden = false;
      return;
    }

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

  async function sendMessage(rawMessage) {
    const message = rawMessage.trim();

    if (!message || CHAT.busy) return;

    if (message.length > 12000) {
      alert("Message is too long. Maximum 12000 characters.");
      return;
    }

    elements.welcome.hidden = true;

    CHAT.history.push({
      role: "user",
      content: message
    });

    createMessage("user", message);

    elements.input.value = "";
    elements.input.style.height = "auto";

    saveHistory();
    scrollToBottom();

    const loadingMessage = createMessage(
      "assistant",
      "Thinking..."
    );

    setBusy(true);

    try {
      // Exclude the latest user message from history because
      // the API sends it separately as "message".
      const previousHistory = CHAT.history
        .slice(0, -1)
        .slice(-20);

      const response = await API.chat(
        message,
        previousHistory
      );

      loadingMessage.remove();

      const answer =
        response?.reply ||
        response?.response ||
        response?.message ||
        response?.data?.reply ||
        response?.data?.response ||
        (typeof response === "string" ? response : "");

      if (!answer) {
        throw new Error(
          response?.error || "AI returned an empty response."
        );
      }

      const finalAnswer = String(answer);

      CHAT.history.push({
        role: "assistant",
        content: finalAnswer
      });

      createMessage("assistant", finalAnswer);

      saveHistory();
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
    saveHistory();

    elements.messages.innerHTML = "";
    elements.welcome.hidden = false;
    elements.input.value = "";
    elements.input.focus();
  }

  function clearHistory() {
    if (!confirm("Clear all chat history?")) return;
    newChat();
  }

  function showHistory() {
    const historyList = document.getElementById("historyList");

    if (!historyList) return;

    historyList.innerHTML = "";

    if (!CHAT.history.length) {
      const empty = document.createElement("p");
      empty.textContent = "No chat history yet.";
      historyList.appendChild(empty);
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent =
      CHAT.history[0].content.slice(0, 70);

    button.addEventListener("click", () => {
      renderHistory();

      const aiPage = document.getElementById("aiPage");
      const historyPage = document.getElementById("historyPage");

      if (aiPage) aiPage.hidden = false;
      if (historyPage) historyPage.hidden = true;
    });

    historyList.appendChild(button);
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

    document.getElementById("historyPage")
      ?.addEventListener("click", showHistory);
  }

  function init() {
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

    loadHistory();
    bindEvents();
    renderHistory();

    console.log("[K-UNIQUE] AI Chat initialized.");
  }

  window.KUNIQUE_CHAT = Object.freeze({
    init,
    sendMessage,
    newChat,
    clearHistory,
    getHistory: () => CHAT.history.slice()
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})(window);
