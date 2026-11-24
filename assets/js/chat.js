
/* =========================================
   @K-UNIQUE — AI CHAT ENGINE
   Version 1.0.0
   ========================================= */

(function () {
  "use strict";

  const CONFIG = window.KUNIQUE_CONFIG || {};

  const CHAT = {
    history: [],
    isSending: false,
    maxHistory: CONFIG.AI?.CHAT?.MAX_HISTORY || 20,
    elements: {},
    initialized: false
  };

  const SELECTORS = {
    input: [
      "#chatInput",
      "#messageInput",
      "[data-chat-input]"
    ],
    send: [
      "#sendMessage",
      "#sendButton",
      "[data-chat-send]"
    ],
    messages: [
      "#chatMessages",
      "#messagesContainer",
      "[data-chat-messages]"
    ],
    newChat: [
      "#newChat",
      "[data-new-chat]"
    ]
  };

  function findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  function cacheElements() {
    CHAT.elements.input = findElement(SELECTORS.input);
    CHAT.elements.send = findElement(SELECTORS.send);
    CHAT.elements.messages = findElement(SELECTORS.messages);
    CHAT.elements.newChat = findElement(SELECTORS.newChat);
  }

  function createId() {
    return "msg_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function saveHistory() {
    try {
      const safeHistory = CHAT.history.slice(-CHAT.maxHistory);

      sessionStorage.setItem(
        "kunique_chat_history",
        JSON.stringify(safeHistory)
      );
    } catch (error) {
      console.warn("[K-UNIQUE Chat] History could not be saved.", error);
    }
  }

  function loadHistory() {
    try {
      const saved = sessionStorage.getItem("kunique_chat_history");

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        CHAT.history = parsed
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-CHAT.maxHistory);
      }
    } catch (error) {
      console.warn("[K-UNIQUE Chat] Could not load history.", error);
      CHAT.history = [];
    }
  }

  function scrollToBottom() {
    const container = CHAT.elements.messages;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }

  function createMessageElement(role, content, id) {
    const wrapper = document.createElement("article");
    wrapper.className = "chat-message " + role + "-message";
    wrapper.dataset.messageId = id || createId();

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "You" : "AI";

    const body = document.createElement("div");
    body.className = "message-body";

    const heading = document.createElement("div");
    heading.className = "message-author";
    heading.textContent = role === "user" ? "You" : "@K-UNIQUE AI";

    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = content;

    body.append(heading, text);
    wrapper.append(avatar, body);

    if (role === "assistant") {
      const actions = document.createElement("div");
      actions.className = "message-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "copy-message";
      copyButton.textContent = "Copy";
      copyButton.addEventListener("click", () => {
        copyText(content, copyButton);
      });

      actions.append(copyButton);
      body.append(actions);
    }

    return wrapper;
  }

  async function copyText(value, button) {
    try {
      await navigator.clipboard.writeText(value);

      if (button) {
        const previous = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = previous;
        }, 1500);
      }
    } catch (error) {
      console.error("[K-UNIQUE Chat] Copy failed:", error);
    }
  }

  function renderMessage(message) {
    const container = CHAT.elements.messages;
    if (!container) return;

    const element = createMessageElement(
      message.role,
      message.content,
      message.id
    );

    container.appendChild(element);
    scrollToBottom();
  }

  function renderHistory() {
    const container = CHAT.elements.messages;
    if (!container) return;

    container.replaceChildren();

    CHAT.history.forEach(renderMessage);
  }

  function addMessage(role, content) {
    const message = {
      id: createId(),
      role,
      content: String(content),
      timestamp: Date.now()
    };

    CHAT.history.push(message);
    CHAT.history = CHAT.history.slice(-CHAT.maxHistory);

    renderMessage(message);
    saveHistory();

    return message;
  }

  function showTyping() {
    const container = CHAT.elements.messages;
    if (!container) return;

    removeTyping();

    const typing = document.createElement("div");
    typing.className = "chat-typing";
    typing.id = "kuniqueTypingIndicator";
    typing.textContent = "@K-UNIQUE AI is thinking...";

    container.appendChild(typing);
    scrollToBottom();
  }

  function removeTyping() {
    document.getElementById("kuniqueTypingIndicator")?.remove();
  }

  function setSendingState(sending) {
    CHAT.isSending = sending;

    if (CHAT.elements.send) {
      CHAT.elements.send.disabled = sending;
      CHAT.elements.send.textContent = sending ? "Sending..." : "Send";
    }

    if (CHAT.elements.input) {
      CHAT.elements.input.disabled = sending;
    }
  }

  function getConversationHistory() {
    return CHAT.history
      .filter(item => ["user", "assistant"].includes(item.role))
      .slice(-CHAT.maxHistory)
      .map(item => ({
        role: item.role,
        content: item.content
      }));
  }

  async function requestAI(message) {
    if (!window.KUNIQUE_API?.chat) {
      throw new Error("AI API connector is not loaded.");
    }

    const history = getConversationHistory();

    // Current user message is already in history.
    return window.KUNIQUE_API.chat({
      message,
      history,
      provider: "auto"
    });
  }

  function extractAIResponse(result) {
    if (typeof result === "string") return result;

    if (!result || typeof result !== "object") {
      throw new Error("The AI returned an empty response.");
    }

    const response =
      result.response ??
      result.message ??
      result.content ??
      result.text ??
      result.data?.response ??
      result.data?.message;

    if (typeof response === "string" && response.trim()) {
      return response.trim();
    }

    throw new Error("Could not read the AI response.");
  }

  async function sendMessage(value) {
    const message = String(value || "").trim();

    if (!message || CHAT.isSending) return;

    const maxLength = CONFIG.AI?.CHAT?.MAX_MESSAGE_LENGTH || 12000;

    if (message.length > maxLength) {
      addMessage(
        "assistant",
        "Your message is too long. Please keep it under " +
        maxLength + " characters."
      );
      return;
    }

    if (CHAT.elements.input) {
      CHAT.elements.input.value = "";
    }

    addMessage("user", message);
    setSendingState(true);
    showTyping();

    try {
      const result = await requestAI(message);
      const response = extractAIResponse(result);

      removeTyping();
      addMessage("assistant", response);

    } catch (error) {
      removeTyping();

      console.error("[K-UNIQUE Chat] AI request failed:", error);

      addMessage(
        "assistant",
        "Sorry, I couldn't get a response right now. " +
        (error.message || "Please try again.")
      );

    } finally {
      removeTyping();
      setSendingState(false);

      if (CHAT.elements.input) {
        CHAT.elements.input.focus();
      }
    }
  }

  function clearChat() {
    CHAT.history = [];

    try {
      sessionStorage.removeItem("kunique_chat_history");
    } catch (error) {
      console.warn("[K-UNIQUE Chat] Could not clear saved history.");
    }

    if (CHAT.elements.messages) {
      CHAT.elements.messages.replaceChildren();
    }

    window.dispatchEvent(
      new CustomEvent("kunique:new-chat")
    );
  }

  function bindEvents() {
    const input = CHAT.elements.input;
    const send = CHAT.elements.send;
    const newChat = CHAT.elements.newChat;

    if (send) {
      send.addEventListener("click", () => {
        sendMessage(input?.value || "");
      });
    }

    if (input) {
      input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage(input.value);
        }
      });
    }

    if (newChat) {
      newChat.addEventListener("click", clearChat);
    }
  }

  function initialize() {
    if (CHAT.initialized) return;

    cacheElements();

    if (!CHAT.elements.input || !CHAT.elements.messages) {
      console.info(
        "[K-UNIQUE Chat] Chat UI elements not found yet. " +
        "Call KUNIQUE_CHAT.initialize() after rendering the chat page."
      );
      return;
    }

    loadHistory();
    renderHistory();
    bindEvents();

    CHAT.initialized = true;

    console.log("[K-UNIQUE Chat] Chat engine initialized.");
  }

  window.KUNIQUE_CHAT = Object.freeze({
    initialize,
    sendMessage,
    clearChat,
    getHistory: () => [...CHAT.history],
    get isSending() {
      return CHAT.isSending;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

})();
