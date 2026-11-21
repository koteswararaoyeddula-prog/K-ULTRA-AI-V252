
/*
 * K-ULTRA AI — VERSION 252
 * FILE: js/chat.js
 * AI Chat Workspace
 */

import "./config.js";

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG || {};
  const STORAGE_KEY = "kultra_chat_history_v252";
  const MAX_HISTORY = CONFIG.AI?.MAX_HISTORY || 20;

  let messages = [];
  let isSending = false;
  let initialized = false;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  // -----------------------------------------
  // STORAGE
  // -----------------------------------------

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        )
        .slice(-MAX_HISTORY * 2);

    } catch (error) {
      console.warn("Could not load chat history:", error);
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_HISTORY * 2))
      );
    } catch (error) {
      console.warn("Could not save chat history:", error);
      showToast("Chat history could not be saved.");
    }
  }

  // -----------------------------------------
  // HELPERS
  // -----------------------------------------

  function showToast(message, type = "info") {
    window.KULTRA?.showToast?.(message, type);
  }

  function extractReply(response) {
    if (typeof response === "string") {
      return response;
    }

    if (!response || typeof response !== "object") {
      return "The AI returned an empty response.";
    }

    const candidates = [
      response.reply,
      response.response,
      response.message,
      response.content,
      response.output,
      response.text,
      response.result?.response,
      response.result?.text,
      response.choices?.[0]?.message?.content,
      response.choices?.[0]?.text
    ];

    const result = candidates.find(
      value => typeof value === "string" && value.trim()
    );

    return result || "The AI returned an unsupported response format.";
  }

  function scrollToBottom() {
    const area = $("#kultraChatMessages");

    if (area) {
      area.scrollTop = area.scrollHeight;
    }
  }

  // -----------------------------------------
  // MESSAGE UI
  // -----------------------------------------

  function createMessageElement(message) {
    const wrapper = document.createElement("div");

    wrapper.className = `chat-message ${message.role}`;

    const label = document.createElement("div");
    label.className = "chat-message-label";
    label.textContent =
      message.role === "user" ? "You" : "K-ULTRA AI";

    const content = document.createElement("div");
    content.className = "chat-message-content";

    // Use textContent to prevent HTML/script injection.
    content.textContent = message.content;

    wrapper.append(label, content);

    return wrapper;
  }

  function renderMessages() {
    const area = $("#kultraChatMessages");

    if (!area) return;

    area.replaceChildren();

    if (!messages.length) {
      const welcome = document.createElement("div");
      welcome.className = "chat-empty-state";

      const title = document.createElement("h3");
      title.textContent = "How can I help you today?";

      const description = document.createElement("p");
      description.textContent =
        "Ask questions, learn programming, explore ideas or get help with your projects.";

      welcome.append(title, description);
      area.appendChild(welcome);

    } else {
      messages.forEach(message => {
        area.appendChild(createMessageElement(message));
      });
    }

    scrollToBottom();
  }

  function addMessage(role, content) {
    const message = {
      role,
      content: String(content),
      timestamp: Date.now()
    };

    messages.push(message);
    messages = messages.slice(-MAX_HISTORY * 2);

    saveHistory();
    renderMessages();

    return message;
  }

  function showTyping() {
    const area = $("#kultraChatMessages");

    if (!area) return;

    const typing = document.createElement("div");
    typing.id = "kultraChatTyping";
    typing.className = "chat-message assistant";
    typing.textContent = "K-ULTRA AI is thinking...";

    area.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    $("#kultraChatTyping")?.remove();
  }

  // -----------------------------------------
  // SEND MESSAGE
  // -----------------------------------------

  async function sendMessage(text) {
    const prompt = String(text || "").trim();

    if (!prompt || isSending) return;

    const maxLength = CONFIG.AI?.MAX_MESSAGE_LENGTH || 12000;

    if (prompt.length > maxLength) {
      showToast(
        `Message is too long. Maximum length is ${maxLength} characters.`,
        "error"
      );
      return;
    }

    const api = window.KULTRA?.API;

    if (!api?.chat) {
      showToast("AI API connector is not loaded.", "error");
      return;
    }

    // Check whether the backend requires authentication.
    try {
      window.KULTRA?.ensureAuthenticated?.();
    } catch (error) {
      showToast(error.message, "error");
      window.KULTRA?.auth?.openAuth?.("login");
      return;
    }

    addMessage("user", prompt);

    const sendButton = $("#kultraChatSend");
    const input = $("#kultraChatInput");

    isSending = true;

    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = "Sending...";
    }

    if (input) {
      input.disabled = true;
    }

    showTyping();

    try {
      const conversation = messages.map(item => ({
        role: item.role,
        content: item.content
      }));

      const response = await api.chat(conversation, {
        model: CONFIG.AI?.DEFAULT_MODEL || "default",
        requestId: "kultra-main-chat",
        timeout: CONFIG.API?.TIMEOUT || 60000
      });

      const reply = extractReply(response);

      addMessage("assistant", reply);

    } catch (error) {
      console.error("AI chat request failed:", error);

      addMessage(
        "assistant",
        `Sorry, I could not get a response.\n\nError: ${error.message}`
      );

    } finally {
      hideTyping();

      isSending = false;

      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = "Send";
      }

      if (input) {
        input.disabled = false;
        input.focus();
      }
    }
  }

  // -----------------------------------------
  // NEW CONVERSATION
  // -----------------------------------------

  function newConversation() {
    if (isSending) {
      showToast("Please wait for the current response to finish.");
      return;
    }

    messages = [];

    saveHistory();
    renderMessages();

    showToast("New conversation started.");
  }

  // -----------------------------------------
  // CHAT INTERFACE
  // -----------------------------------------

  function renderChat() {
    const container = $("#moduleContent");

    if (!container) return;

    container.replaceChildren();

    const chat = document.createElement("section");
    chat.className = "kultra-chat-workspace";

    chat.innerHTML = `
      <div class="kultra-chat-toolbar">
        <div>
          <h3>AI Assistant</h3>
          <p>Your intelligent conversation workspace</p>
        </div>

        <button type="button" id="kultraNewChat">
          + New Chat
        </button>
      </div>

      <div
        id="kultraChatMessages"
        class="kultra-chat-messages"
        aria-live="polite"
        aria-label="Conversation messages"
      ></div>

      <form id="kultraChatForm" class="kultra-chat-form">
        <textarea
          id="kultraChatInput"
          rows="2"
          maxlength="${CONFIG.AI?.MAX_MESSAGE_LENGTH || 12000}"
          placeholder="Message K-ULTRA AI..."
          aria-label="Your message"
          required
        ></textarea>

        <button type="submit" id="kultraChatSend">
          Send
        </button>
      </form>

      <p class="kultra-chat-disclaimer">
        AI responses can contain mistakes. Verify important information.
      </p>
    `;

    container.appendChild(chat);

    const form = $("#kultraChatForm", chat);
    const input = $("#kultraChatInput", chat);
    const newButton = $("#kultraNewChat", chat);

    form.addEventListener("submit", event => {
      event.preventDefault();

      const value = input.value.trim();

      if (!value) return;

      input.value = "";
      sendMessage(value);
    });

    input.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    newButton.addEventListener("click", newConversation);

    renderMessages();
    initialized = true;
  }

  // -----------------------------------------
  // PAGE NAVIGATION
  // -----------------------------------------

  function handleNavigation(event) {
    const page = event.detail?.page;

    if (page === "ai-chat") {
      renderChat();
    }
  }

  document.addEventListener(
    "kultra:navigate",
    handleNavigation
  );

  // -----------------------------------------
  // PUBLIC API
  // -----------------------------------------

  window.KULTRA = window.KULTRA || {};

  window.KULTRA.chat = {
    sendMessage,
    newConversation,
    renderChat,
    getMessages: () => [...messages],
    isSending: () => isSending
  };

  // -----------------------------------------
  // INITIALIZATION
  // -----------------------------------------

  messages = loadHistory();

  console.info("K-ULTRA AI Chat module loaded.");

})();
    
