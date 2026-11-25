
/* =========================================================
   K-ULTRA AI — VERSION 252
   FILE: script.js
   Main Application Controller
   ========================================================= */

(function () {
  "use strict";

  window.KULTRA = window.KULTRA || {};

  const App = {};
  const Utils = window.KULTRA.utils || {};
  const API = window.KULTRA.API || {};
  const Auth = window.KULTRA.auth || {};

  const STORAGE_KEYS = {
    CHATS: "kultra_v252_chats",
    ACTIVE_CHAT: "kultra_v252_active_chat",
    THEME: "kultra_v252_theme",
    LANGUAGE: "kultra_v252_language",
    CART: "kultra_v252_cart",
    WISHLIST: "kultra_v252_wishlist"
  };

  let chats = [];
  let activeChatId = null;
  let isGenerating = false;
  let currentRequestId = null;
  let selectedFiles = [];
  let recognition = null;

  /* =======================================================
     HELPERS
  ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function toast(message, type) {
    if (Utils.toast) {
      Utils.toast(message, type || "info");
    } else {
      console.log(message);
    }
  }

  function escapeHTML(value) {
    if (Utils.escapeHTML) {
      return Utils.escapeHTML(value);
    }

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createId() {
    if (Utils.generateId) {
      return Utils.generateId("chat");
    }

    return "chat_" + Date.now();
  }

  function getCurrentTime() {
    return new Date().toISOString();
  }

  function getActiveChat() {
    return chats.find(function (chat) {
      return chat.id === activeChatId;
    }) || null;
  }

  function getMessagesContainer() {
    return $("chatMessages");
  }

  function scrollChatToBottom() {
    const container = getMessagesContainer();

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /* =======================================================
     APPLICATION INITIALIZATION
  ======================================================= */

  App.init = function () {
    App.loadSettings();
    App.loadChats();
    App.bindNavigation();
    App.bindChatEvents();
    App.bindTheme();
    App.bindSettings();
    App.bindFeatureForms();
    App.bindStoreEvents();
    App.bindModalEvents();
    App.bindOnlineEvents();

    App.showApplication();
    App.renderChatList();
    App.renderActiveChat();
    App.updateChatWelcome();
    App.checkBackend();

    console.log(
      "K-ULTRA AI Version 252 initialized."
    );
  };

  App.showApplication = function () {
    const loader = $("appLoader");
    const app = $("app");

    if (loader) {
      loader.hidden = true;
    }

    if (app) {
      app.hidden = false;
    }
  };

  /* =======================================================
     SETTINGS
  ======================================================= */

  App.loadSettings = function () {
    const theme =
      Utils.storage &&
      Utils.storage.get(STORAGE_KEYS.THEME, "dark");

    const language =
      Utils.storage &&
      Utils.storage.get(STORAGE_KEYS.LANGUAGE, "en");

    App.setTheme(theme || "dark", false);
    App.setLanguage(language || "en", false);
  };

  App.bindSettings = function () {
    const languageSelect = $("settingsLanguage");

    if (languageSelect) {
      languageSelect.addEventListener(
        "change",
        function () {
          App.setLanguage(languageSelect.value);
        }
      );
    }
  };

  App.setLanguage = function (language, save) {
    const selected = language || "en";

    document.documentElement.lang = selected;

    const select = $("settingsLanguage");

    if (select) {
      select.value = selected;
    }

    if (save !== false && Utils.storage) {
      Utils.storage.set(
        STORAGE_KEYS.LANGUAGE,
        selected
      );
    }

    App.language = selected;
  };

  /* =======================================================
     THEME
  ======================================================= */

  App.bindTheme = function () {
    const themeToggle = $("themeToggleBtn");
    const themeSelect = $("settingsTheme");

    if (themeToggle) {
      themeToggle.addEventListener(
        "click",
        function () {
          const isLight =
            document.body.classList.contains(
              "light-theme"
            );

          App.setTheme(
            isLight ? "dark" : "light"
          );
        }
      );
    }

    if (themeSelect) {
      themeSelect.addEventListener(
        "change",
        function () {
          App.setTheme(themeSelect.value);
        }
      );
    }
  };

  App.setTheme = function (theme, save) {
    const selected =
      theme === "light" ? "light" : "dark";

    document.body.classList.toggle(
      "light-theme",
      selected === "light"
    );

    const themeSelect = $("settingsTheme");

    if (themeSelect) {
      themeSelect.value = selected;
    }

    if (save !== false && Utils.storage) {
      Utils.storage.set(
        STORAGE_KEYS.THEME,
        selected
      );
    }

    App.theme = selected;
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  App.bindNavigation = function () {
    document
      .querySelectorAll(".nav-item[data-page]")
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const page = button.dataset.page;

            if (page) {
              App.navigate(page);
            }
          }
        );
      });

    const sidebarOpen = $("sidebarOpenBtn");
    const sidebarClose = $("sidebarCloseBtn");

    if (sidebarOpen) {
      sidebarOpen.addEventListener(
        "click",
        App.openSidebar
      );
    }

    if (sidebarClose) {
      sidebarClose.addEventListener(
        "click",
        App.closeSidebar
      );
    }

    const overlay =
      document.querySelector(".sidebar-overlay");

    if (overlay) {
      overlay.addEventListener(
        "click",
        App.closeSidebar
      );
    }

    const newChatBtn = $("newChatBtn");

    if (newChatBtn) {
      newChatBtn.addEventListener(
        "click",
        function () {
          App.createNewChat();
          App.navigate("chat");
        }
      );
    }

    const openCartBtn = $("openCartBtn");

    if (openCartBtn) {
      openCartBtn.addEventListener(
        "click",
        function () {
          App.openModal("cartModal");
          App.renderCart();
        }
      );
    }
  };

  App.navigate = function (pageName) {
    const pageId = "page-" + pageName;

    const page = $(pageId);

    if (!page) {
      console.warn("Page not found:", pageName);
      return;
    }

    document
      .querySelectorAll(".page")
      .forEach(function (element) {
        element.classList.remove("active");
      });

    page.classList.add("active");

    document
      .querySelectorAll(".nav-item[data-page]")
      .forEach(function (button) {
        button.classList.toggle(
          "active",
          button.dataset.page === pageName
        );
      });

    const title = $("pageTitle");

    if (title) {
      title.textContent =
        page.dataset.title ||
        pageName.charAt(0).toUpperCase() +
        pageName.slice(1);
    }

    App.closeSidebar();

    if (pageName === "shop") {
      App.loadProducts();
    }

    if (pageName === "cart") {
      App.renderCart();
    }

    if (pageName === "orders") {
      App.loadOrders();
    }

    if (pageName === "admin") {
      App.loadAdmin();
    }

    if (pageName === "chat") {
      App.renderActiveChat();
    }

    window.dispatchEvent(
      new CustomEvent("kultra:page-change", {
        detail: { page: pageName }
      })
    );
  };

  App.openSidebar = function () {
    const sidebar = $("sidebar");
    const overlay =
      document.querySelector(".sidebar-overlay");

    if (sidebar) {
      sidebar.classList.add("open");
    }

    if (overlay) {
      overlay.classList.add("active");
    }
  };

  App.closeSidebar = function () {
    const sidebar = $("sidebar");
    const overlay =
      document.querySelector(".sidebar-overlay");

    if (sidebar) {
      sidebar.classList.remove("open");
    }

    if (overlay) {
      overlay.classList.remove("active");
    }
  };

  /* =======================================================
     CHAT STORAGE
  ======================================================= */

  App.loadChats = function () {
    chats =
      Utils.storage &&
      Utils.storage.get(STORAGE_KEYS.CHATS, []);

    if (!Array.isArray(chats)) {
      chats = [];
    }

    activeChatId =
      Utils.storage &&
      Utils.storage.get(
        STORAGE_KEYS.ACTIVE_CHAT,
        null
      );

    if (
      !activeChatId ||
      !chats.some(function (chat) {
        return chat.id === activeChatId;
      })
    ) {
      if (chats.length > 0) {
        activeChatId = chats[0].id;
      } else {
        App.createNewChat(false);
      }
    }
  };

  App.saveChats = function () {
    if (Utils.storage) {
      Utils.storage.set(
        STORAGE_KEYS.CHATS,
        chats
      );

      Utils.storage.set(
        STORAGE_KEYS.ACTIVE_CHAT,
        activeChatId
      );
    }
  };

  App.createNewChat = function (save) {
    const chat = {
      id: createId(),
      title: "New Chat",
      messages: [],
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime()
    };

    chats.unshift(chat);
    activeChatId = chat.id;

    if (save !== false) {
      App.saveChats();
    }

    App.renderChatList();
    App.renderActiveChat();

    return chat;
  };

  App.selectChat = function (chatId) {
    activeChatId = chatId;

    App.saveChats();
    App.renderChatList();
    App.renderActiveChat();
    App.navigate("chat");
  };

  App.deleteChat = function (chatId) {
    chats = chats.filter(function (chat) {
      return chat.id !== chatId;
    });

    if (activeChatId === chatId) {
      activeChatId =
        chats.length > 0
          ? chats[0].id
          : null;

      if (!activeChatId) {
        App.createNewChat(false);
      }
    }

    App.saveChats();
    App.renderChatList();
    App.renderActiveChat();

    toast("Chat deleted.", "success");
  };

  App.renameChatFromMessage = function (chat) {
    if (
      chat.title === "New Chat" &&
      chat.messages.length > 0
    ) {
      const firstUserMessage =
        chat.messages.find(function (message) {
          return message.role === "user";
        });

      if (firstUserMessage) {
        chat.title =
          firstUserMessage.content
            .slice(0, 42)
            .trim() || "New Chat";
      }
    }
  };

  /* =======================================================
     CHAT LIST
  ======================================================= */

  App.renderChatList = function (filter) {
    const container =
      document.querySelector(
        ".chat-history-list"
      ) ||
      $("chatHistoryList");

    if (!container) {
      return;
    }

    const search =
      String(filter || "").toLowerCase();

    const filtered = chats.filter(
      function (chat) {
        return (
          !search ||
          chat.title.toLowerCase().includes(search)
        );
      }
    );

    container.innerHTML = "";

    filtered.forEach(function (chat) {
      const item = document.createElement("div");

      item.className =
        "chat-history-item" +
        (chat.id === activeChatId
          ? " active"
          : "");

      item.dataset.chatId = chat.id;

      const title = document.createElement("span");

      title.className = "chat-history-title";
      title.textContent = chat.title;

      const deleteButton =
        document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className =
        "chat-history-delete";
      deleteButton.textContent = "×";
      deleteButton.title = "Delete chat";

      deleteButton.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();

          if (
            window.confirm(
              "Delete this conversation?"
            )
          ) {
            App.deleteChat(chat.id);
          }
        }
      );

      item.appendChild(title);
      item.appendChild(deleteButton);

      item.addEventListener(
        "click",
        function () {
          App.selectChat(chat.id);
        }
      );

      container.appendChild(item);
    });
  };

  App.bindChatSearch = function () {
    const input = $("chatSearchInput");

    if (!input) {
      return;
    }

    input.addEventListener(
      "input",
      function () {
        App.renderChatList(input.value);
      }
    );
  };

  /* =======================================================
     CHAT RENDERING
  ======================================================= */

  App.updateChatWelcome = function () {
    const welcome = $("chatWelcome");

    if (!welcome) {
      return;
    }

    const chat = getActiveChat();

    welcome.hidden = Boolean(
      chat &&
      chat.messages &&
      chat.messages.length > 0
    );
  };

  App.renderActiveChat = function () {
    const container =
      getMessagesContainer();

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const chat = getActiveChat();

    if (!chat) {
      App.updateChatWelcome();
      return;
    }

    (chat.messages || []).forEach(
      function (message) {
        App.renderMessage(message);
      }
    );

    App.updateChatWelcome();
    scrollChatToBottom();
  };

  App.renderMessage = function (message) {
    const container =
      getMessagesContainer();

    if (!container) {
      return null;
    }

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "message message-" +
      (message.role === "user"
        ? "user"
        : "assistant");

    wrapper.dataset.messageId =
      message.id || "";

    const content =
      document.createElement("div");

    content.className = "message-content";

    content.innerHTML =
      App.renderMarkdown(message.content || "");

    wrapper.appendChild(content);

    const actions =
      document.createElement("div");

    actions.className = "message-actions";

    if (message.role === "assistant") {
      const copyButton =
        document.createElement("button");

      copyButton.type = "button";
      copyButton.textContent = "Copy";

      copyButton.addEventListener(
        "click",
        async function () {
          const success =
            await Utils.copyText(
              message.content || ""
            );

          toast(
            success
              ? "Copied to clipboard."
              : "Could not copy text.",
            success ? "success" : "error"
          );
        }
      );

      actions.appendChild(copyButton);

      const regenerateButton =
        document.createElement("button");

      regenerateButton.type = "button";
      regenerateButton.textContent =
        "Regenerate";

      regenerateButton.addEventListener(
        "click",
        function () {
          App.regenerateLastResponse();
        }
      );

      actions.appendChild(regenerateButton);
    }

    wrapper.appendChild(actions);
    container.appendChild(wrapper);

    return wrapper;
  };

  /* =======================================================
     BASIC MARKDOWN RENDERER
     Safe text rendering; no external library required.
  ======================================================= */

  App.renderMarkdown = function (text) {
    let html = escapeHTML(text);

    /*
     * Code blocks
     */

    html = html.replace(
      /```([\w-]*)\n([\s\S]*?)```/g,
      function (_, language, code) {
        return (
          '<pre><code class="language-' +
          escapeHTML(language || "text") +
          '">' +
          code +
          "</code></pre>"
        );
      }
    );

    /*
     * Inline code
     */

    html = html.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );

    /*
     * Bold
     */

    html = html.replace(
      /\*\*([^*]+)\*\*/g,
      "<strong>$1</strong>"
    );

    /*
     * Italic
     */

    html = html.replace(
      /\*([^*]+)\*/g,
      "<em>$1</em>"
    );

    /*
     * New lines
     */

    html = html.replace(/\n/g, "<br>");

    return html;
  };

  /* =======================================================
     CHAT EVENTS
  ======================================================= */

  App.bindChatEvents = function () {
    const form = $("chatForm");
    const input = $("chatInput");
    const stopButton = $("stopGenerationBtn");
    const attachButton = $("attachFileBtn");
    const fileInput = $("chatFileInput");
    const voiceButton = $("voiceInputBtn");

    if (form) {
      form.addEventListener(
        "submit",
        App.handleChatSubmit
      );
    }

    if (input) {
      input.addEventListener(
        "input",
        function () {
          input.style.height = "auto";

          input.style.height =
            Math.min(input.scrollHeight, 220) +
            "px";
        }
      );

      input.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();

            if (form) {
              form.requestSubmit();
            }
          }
        }
      );
    }

    if (stopButton) {
      stopButton.addEventListener(
        "click",
        App.stopGeneration
      );
    }

    if (attachButton && fileInput) {
      attachButton.addEventListener(
        "click",
        function () {
          fileInput.click();
        }
      );
    }

    if (fileInput) {
      fileInput.addEventListener(
        "change",
        App.handleChatFiles
      );
    }

    if (voiceButton) {
      voiceButton.addEventListener(
        "click",
        App.startVoiceInput
      );
    }

    App.bindChatSearch();

    document
      .querySelectorAll("[data-prompt]")
      .forEach(function (element) {
        element.addEventListener(
          "click",
          function () {
            const prompt =
              element.dataset.prompt;

            if ($("chatInput")) {
              $("chatInput").value = prompt;
              $("chatInput").focus();
            }

            App.navigate("chat");
          }
        );
      });
  };

  /* =======================================================
     CHAT FILES
  ======================================================= */

  App.handleChatFiles = function (event) {
    const files =
      Array.from(event.target.files || []);

    selectedFiles = files;

    const preview =
      $("attachmentPreview");

    if (!preview) {
      return;
    }

    preview.innerHTML = "";

    files.forEach(function (file) {
      const item =
        document.createElement("div");

      item.className = "attachment-item";

      item.textContent =
        file.name +
        " (" +
        Utils.formatFileSize(file.size) +
        ")";

      preview.appendChild(item);
    });
  };

  /* =======================================================
     CHAT SUBMIT
  ======================================================= */

  App.handleChatSubmit = async function (event) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    const input = $("chatInput");

    const text =
      input ? input.value.trim() : "";

    if (!text && selectedFiles.length === 0) {
      return;
    }

    if (!API.chat) {
      toast(
        "Backend connector is not available.",
        "error"
      );

      return;
    }

    let chat = getActiveChat();

    if (!chat) {
      chat = App.createNewChat();
    }

    const userMessage = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: getCurrentTime()
    };

    chat.messages.push(userMessage);
    chat.updatedAt = getCurrentTime();

    App.renameChatFromMessage(chat);
    App.saveChats();

    if (input) {
      input.value = "";
      input.style.height = "auto";
    }

    App.renderActiveChat();
    App.renderChatList();

    await App.sendChatRequest(chat);
  };

  /* =======================================================
     SEND CHAT REQUEST
  ======================================================= */

  App.sendChatRequest = async function (
    chat,
    retry
  ) {
    if (!chat) {
      return;
    }

    isGenerating = true;

    const stopButton =
      $("stopGenerationBtn");

    if (stopButton) {
      stopButton.hidden = false;
    }

    const typing =
      $("chatTypingIndicator");

    if (typing) {
      typing.hidden = false;
    }

    const lastUserMessage =
      [...chat.messages]
        .reverse()
        .find(function (message) {
          return message.role === "user";
        });

    if (!lastUserMessage) {
      App.finishGeneration();
      return;
    }

    const history =
      chat.messages
        .filter(function (message) {
          return (
            message.role === "user" ||
            message.role === "assistant"
          );
        })
        .slice(-20)
        .map(function (message) {
          return {
            role: message.role,
            content: message.content
          };
        });

    currentRequestId = createId();

    try {
      const payload = {
        message: lastUserMessage.content,
        prompt: lastUserMessage.content,
        history: history,
        conversationId: chat.id,
        requestId: currentRequestId,
        model:
          window.KULTRA_CONFIG &&
          window.KULTRA_CONFIG.AI &&
          window.KULTRA_CONFIG.AI.DEFAULT_MODEL
            ? window.KULTRA_CONFIG.AI.DEFAULT_MODEL
            : "gemini-2.5-flash"
      };

      /*
       * Attachments are sent as metadata in this
       * basic connector. Actual file processing
       * needs backend upload/analyze support.
       */

      if (selectedFiles.length > 0) {
        payload.attachments =
          selectedFiles.map(function (file) {
            return {
              name: file.name,
              type: file.type,
              size: file.size
            };
          });
      }

      const response =
        await API.chat(payload, {
          requestId: currentRequestId,
          timeout: 120000
        });

      if (!response) {
        throw new Error(
          "Backend returned an empty response."
        );
      }

      const answer =
        response.reply ||
        response.response ||
        response.text ||
        response.message ||
        response.output ||
        (
          response.data &&
          (
            response.data.reply ||
            response.data.text
          )
        );

      if (!answer) {
        throw new Error(
          "No AI response was returned. Check your Worker /api/chat response format."
        );
      }

      chat.messages.push({
        id: createId(),
        role: "assistant",
        content: String(answer),
        createdAt: getCurrentTime()
      });

      chat.updatedAt = getCurrentTime();

      App.saveChats();
      App.renderActiveChat();
      App.renderChatList();

      selectedFiles = [];

      const preview =
        $("attachmentPreview");

      if (preview) {
        preview.innerHTML = "";
      }

      const fileInput =
        $("chatFileInput");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Chat request error:", error);

      if (
        error.message !==
        "Request timed out or was cancelled."
      ) {
        toast(
          error.message ||
          "Could not get an AI response.",
          "error"
        );
      }
    } finally {
      App.finishGeneration();
    }
  };

  /* =======================================================
     STOP GENERATION
  ======================================================= */

  App.stopGeneration = function () {
    if (!isGenerating) {
      return;
    }

    if (
      currentRequestId &&
      API.cancelRequest
    ) {
      API.cancelRequest(currentRequestId);
    }

    App.finishGeneration();

    toast("Generation stopped.", "info");
  };

  App.finishGeneration = function () {
    isGenerating = false;
    currentRequestId = null;

    const stopButton =
      $("stopGenerationBtn");

    if (stopButton) {
      stopButton.hidden = true;
    }

    const typing =
      $("chatTypingIndicator");

    if (typing) {
      typing.hidden = true;
    }
  };

  /* =======================================================
     REGENERATE
  ======================================================= */

  App.regenerateLastResponse = async function () {
    if (isGenerating) {
      return;
    }

    const chat = getActiveChat();

    if (!chat) {
      return;
    }

    const lastAssistantIndex =
      chat.messages.findLastIndex
        ? chat.messages.findLastIndex(
            function (message) {
              return message.role === "assistant";
            }
          )
        : -1;

    if (lastAssistantIndex >= 0) {
      chat.messages.splice(
        lastAssistantIndex,
        1
      );
    }

    App.saveChats();
    App.renderActiveChat();

    await App.sendChatRequest(chat, true);
  };

  /* =======================================================
     BACKEND HEALTH
  ======================================================= */

  App.checkBackend = async function () {
    if (!API.checkConnection) {
      return;
    }

    await API.checkConnection();
  };

  /* =======================================================
     ONLINE / OFFLINE
  ======================================================= */

  App.bindOnlineEvents = function () {
    window.addEventListener(
      "online",
      function () {
        toast("Internet connection restored.", "success");
        App.checkBackend();
      }
    );

    window.addEventListener(
      "offline",
      function () {
        toast("You are offline.", "warning");
      }
    );
  };

  /* =======================================================
     MODALS
  ======================================================= */

  App.openModal = function (modalId) {
    const modal = $(modalId);

    if (!modal) {
      return;
    }

    modal.hidden = false;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  };

  App.closeModal = function (modalId) {
    const modal = $(modalId);

    if (!modal) {
      return;
    }

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    modal.hidden = true;
  };

  App.bindModalEvents = function () {
    document
      .querySelectorAll("[data-close-modal]")
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const modalId =
              button.dataset.closeModal;

            App.closeModal(modalId);
          }
        );
      });
  };

  /* =======================================================
     VOICE INPUT
  ======================================================= */

  App.startVoiceInput = function () {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast(
        "Voice input is not supported in this browser.",
        "warning"
      );

      return;
    }

    if (recognition) {
      try {
        recognition.stop();
      } catch (_) {}
    }

    recognition = new SpeechRecognition();

    recognition.lang =
      App.language === "te"
        ? "te-IN"
        : "en-IN";

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = function (event) {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      const input = $("chatInput");

      if (input) {
        input.value = transcript;
      }
    };

    recognition.onerror = function (event) {
      console.warn(
        "Speech recognition error:",
        event.error
      );

      toast(
        "Voice input error: " + event.error,
        "error"
      );
    };

    recognition.onend = function () {
      recognition = null;
    };

    try {
      recognition.start();

      toast(
        "Listening... Speak now.",
        "info"
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* =======================================================
     FEATURE FORM HELPER
  ======================================================= */

  App.handleFeatureForm = async function (
    formId,
    inputId,
    resultId,
    apiMethod,
    buildPayload
  ) {
    const form = $(formId);

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        const input = $(inputId);
        const result = $(resultId);

        const value =
          input ? input.value.trim() : "";

        if (!value) {
          toast("Please enter your request.", "warning");
          return;
        }

        if (!API[apiMethod]) {
          toast(
            "This backend feature is not connected yet.",
            "warning"
          );

          return;
        }

        const submitButton =
          form.querySelector(
            'button[type="submit"]'
          );

        if (Utils.setButtonLoading) {
          Utils.setButtonLoading(
            submitButton,
            true,
            "Processing..."
          );
        }

        try {
          const payload =
            buildPayload
              ? buildPayload(value)
              : { prompt: value };

          const response =
            await API[apiMethod](payload);

          const output =
            response.reply ||
            response.result ||
            response.text ||
            response.message ||
            JSON.stringify(response, null, 2);

          if (result) {
            result.textContent =
              String(output);
          }
        } catch (error) {
          console.error(error);

          if (result) {
            result.textContent =
              error.message;
          }

          toast(error.message, "error");
        } finally {
          if (Utils.setButtonLoading) {
            Utils.setButtonLoading(
              submitButton,
              false
            );
          }
        }
      }
    );
  };

  /* =======================================================
     FEATURE FORMS
  ======================================================= */

  App.bindFeatureForms = function () {
    App.handleFeatureForm(
      "imageForm",
      "imagePrompt",
      "imageResult",
      "generateImage",
      function (prompt) {
        return {
          prompt: prompt,
          aspectRatio:
            $("imageAspectRatio") &&
            $("imageAspectRatio").value,
          quality:
            $("imageQuality") &&
            $("imageQuality").value
        };
      }
    );

    App.handleFeatureForm(
      "searchForm",
      "webSearchInput",
      "searchResults",
      "search",
      function (query) {
        return { query: query };
      }
    );

    App.handleFeatureForm(
      "researchForm",
      "researchTopic",
      "researchResult",
      "research",
      function (topic) {
        return { topic: topic };
      }
    );

    App.handleFeatureForm(
      "codingForm",
      "codingPrompt",
      "codingResult",
      "coding",
      function (prompt) {
        return {
          prompt: prompt,
          language:
            $("codingLanguage") &&
            $("codingLanguage").value
        };
      }
    );

    App.handleFeatureForm(
      "agentForm",
      "agentTask",
      "agentResult",
      "agent",
      function (task) {
        return { task: task };
      }
    );

    App.handleFeatureForm(
      "documentForm",
      "documentQuestion",
      "documentResult",
      "analyzeDocument",
      function (question) {
        return { question: question };
      }
    );

    App.handleFeatureForm(
      "dataAnalysisForm",
      "dataQuestion",
      "dataResult",
      "analyzeData",
      function (question) {
        return { question: question };
      }
    );

    App.bindVoicePage();
    App.bindBrowserPage();
  };

  /* =======================================================
     VOICE PAGE
  ======================================================= */

  App.bindVoicePage = function () {
    const startButton = $("startVoiceBtn");
    const stopButton = $("stopVoiceBtn");

    if (startButton) {
      startButton.addEventListener(
        "click",
        function () {
          App.startVoiceInput();
        }
      );
    }

    if (stopButton) {
      stopButton.addEventListener(
        "click",
        function () {
          if (recognition) {
            recognition.stop();
          }
        }
      );
    }
  };

  /* =======================================================
     BROWSER TASK PAGE
  ======================================================= */

  App.bindBrowserPage = function () {
    const form = $("browserForm");

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();

        const result = $("browserResult");

        if (result) {
          result.textContent =
            "Browser automation requires a secure backend browser service. It is not executed directly by this frontend.";
        }

        toast(
          "Browser automation backend is required.",
          "warning"
        );
      }
    );
  };

  /* =======================================================
     STORE / PRODUCTS
  ======================================================= */

  App.bindStoreEvents = function () {
    const form = $("productSearchForm");

    if (form) {
      form.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();
          App.loadProducts();
        }
      );
    }

    const category = $("productCategoryFilter");
    const sort = $("productSort");

    if (category) {
      category.addEventListener(
        "change",
        App.loadProducts
      );
    }

    if (sort) {
      sort.addEventListener(
        "change",
        App.loadProducts
      );
    }

    const checkoutButton = $("checkoutBtn");

    if (checkoutButton) {
      checkoutButton.addEventListener(
        "click",
        function () {
          App.openModal("checkoutModal");
        }
      );
    }

    const checkoutForm = $("checkoutForm");

    if (checkoutForm) {
      checkoutForm.addEventListener(
        "submit",
        App.handleCheckout
      );
    }

    const cartCheckout =
      $("cartModalCheckoutBtn");

    if (cartCheckout) {
      cartCheckout.addEventListener(
        "click",
        function () {
          App.closeModal("cartModal");
          App.openModal("checkoutModal");
        }
      );
    }
  };

  App.loadProducts = async function () {
    const grid = $("productGrid");

    if (!grid) {
      return;
    }

    if (!API.getProducts) {
      grid.textContent =
        "Product backend is not connected.";
      return;
    }

    const params = {
      search:
        $("productSearchInput") &&
        $("productSearchInput").value,

      category:
        $("productCategoryFilter") &&
        $("productCategoryFilter").value,

      sort:
        $("productSort") &&
        $("productSort").value
    };

    grid.textContent = "Loading products...";

    try {
      const response =
        await API.getProducts(params);

      const products =
        Array.isArray(response)
          ? response
          : response.products || [];

      App.renderProducts(products);
    } catch (error) {
      console.error(error);

      grid.textContent =
        "Could not load products. " +
        error.message;
    }
  };

  App.renderProducts = function (products) {
    const grid = $("productGrid");

    if (!grid) {
      return;
    }

    grid.innerHTML = "";

    if (!products.length) {
      grid.textContent =
        "No products found.";
      return;
    }

    products.forEach(function (product) {
      const card =
        document.createElement("div");

      card.className = "product-card";

      const image =
        document.createElement("img");

      image.alt = product.name || "Product";

      image.src =
        product.image ||
        product.imageUrl ||
        "";

      image.loading = "lazy";

      const name =
        document.createElement("h3");

      name.textContent =
        product.name || product.title || "Product";

      const price =
        document.createElement("p");

      price.textContent =
        Utils.formatCurrency(product.price || 0);

      const addButton =
        document.createElement("button");

      addButton.type = "button";
      addButton.textContent = "Add to Cart";

      addButton.addEventListener(
        "click",
        function () {
          App.addToCart(product);
        }
      );

      card.appendChild(image);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(addButton);

      grid.appendChild(card);
    });
  };

  /* =======================================================
     CART
  ======================================================= */

  App.getCart = function () {
    const cart =
      Utils.storage &&
      Utils.storage.get(STORAGE_KEYS.CART, []);

    return Array.isArray(cart) ? cart : [];
  };

  App.saveCart = function (cart) {
    if (Utils.storage) {
      Utils.storage.set(
        STORAGE_KEYS.CART,
        cart
      );
    }

    App.updateCartCount();
  };

  App.addToCart = function (product) {
    if (!product) {
      return;
    }

    const cart = App.getCart();

    const id =
      product.id ||
      product.productId ||
      product.name;

    const existing = cart.find(
      function (item) {
        return item.id === id;
      }
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: id,
        name:
          product.name ||
          product.title ||
          "Product",
        price: Number(product.price || 0),
        image:
          product.image ||
          product.imageUrl ||
          "",
        quantity: 1
      });
    }

    App.saveCart(cart);
    App.renderCart();

    toast("Added to cart.", "success");
  };

  App.updateCartCount = function () {
    const cart = App.getCart();

    const count = cart.reduce(
      function (total, item) {
        return total + item.quantity;
      },
      0
    );

    const element = $("cartCount");

    if (element) {
      element.textContent = String(count);
    }
  };

  App.renderCart = function () {
    const cart = App.getCart();

    const containers = [
      $("cartItems"),
      $("cartModalItems")
    ].filter(Boolean);

    const total = cart.reduce(
      function (sum, item) {
        return sum +
          Number(item.price || 0) *
          Number(item.quantity || 1);
      },
      0
    );

    containers.forEach(function (container) {
      container.innerHTML = "";

      if (!cart.length) {
        container.textContent =
          "Your cart is empty.";
        return;
      }

      cart.forEach(function (item) {
        const row =
          document.createElement("div");

        row.className = "cart-item";

        const name =
          document.createElement("span");

        name.textContent =
          item.name +
          " × " +
          item.quantity;

        const price =
          document.createElement("span");

        price.textContent =
          Utils.formatCurrency(
            item.price * item.quantity
          );

        const remove =
          document.createElement("button");

        remove.type = "button";
        remove.textContent = "Remove";

        remove.addEventListener(
          "click",
          function () {
            const updated =
              App.getCart().filter(
                function (cartItem) {
                  return cartItem.id !== item.id;
                }
              );

            App.saveCart(updated);
            App.renderCart();
          }
        );

        row.appendChild(name);
        row.appendChild(price);
        row.appendChild(remove);

        container.appendChild(row);
      });
    });

    [
      $("cartSummary"),
      $("cartModalSummary")
    ].filter(Boolean).forEach(
      function (element) {
        element.textContent =
          "Total: " +
          Utils.formatCurrency(total);
      }
    );

    App.updateCartCount();
  };

  /* =======================================================
     CHECKOUT
  ======================================================= */

  App.handleCheckout = async function (event) {
    event.preventDefault();

    const cart = App.getCart();

    if (!cart.length) {
      toast("Your cart is empty.", "warning");
      return;
    }

    if (!API.checkout) {
      toast(
        "Checkout backend is not connected.",
        "error"
      );

      return;
    }

    const payload = {
      customer: {
        fullName:
          $("checkoutFullName") &&
          $("checkoutFullName").value,

        phone:
          $("checkoutPhone") &&
          $("checkoutPhone").value,

        address:
          $("checkoutAddress") &&
          $("checkoutAddress").value,

        city:
          $("checkoutCity") &&
          $("checkoutCity").value,

        postalCode:
          $("checkoutPostalCode") &&
          $("checkoutPostalCode").value
      },

      items: cart
    };

    try {
      const response =
        await API.checkout(payload);

      toast(
        "Checkout request submitted.",
        "success"
      );

      const message =
        $("checkoutMessage");

      if (message) {
        message.textContent =
          response.message ||
          "Checkout request submitted.";
      }

      /*
       * Do not clear cart until the backend
       * confirms order/payment success.
       */

    } catch (error) {
      toast(error.message, "error");

      const message =
        $("checkoutMessage");

      if (message) {
        message.textContent = error.message;
      }
    }
  };

  /* =======================================================
     ORDERS
  ======================================================= */

  App.loadOrders = async function () {
    const container = $("ordersList");

    if (!container) {
      return;
    }

    if (!API.getOrders) {
      container.textContent =
        "Orders backend is not connected.";
      return;
    }

    container.textContent = "Loading orders...";

    try {
      const response =
        await API.getOrders();

      const orders =
        Array.isArray(response)
          ? response
          : response.orders || [];

      container.innerHTML = "";

      if (!orders.length) {
        container.textContent =
          "No orders found.";
        return;
      }

      orders.forEach(function (order) {
        const item =
          document.createElement("div");

        item.className = "order-item";

        item.textContent =
          "Order " +
          (order.id || order.orderId || "") +
          " — " +
          (order.status || "Processing") +
          " — " +
          Utils.formatCurrency(order.total || 0);

        container.appendChild(item);
      });
    } catch (error) {
      container.textContent =
        "Could not load orders: " +
        error.message;
    }
  };

  /* =======================================================
     ADMIN
  ======================================================= */

  App.loadAdmin = async function () {
    const stats = $("adminStats");

    if (stats) {
      stats.textContent =
        "Admin data requires authenticated admin API access.";
    }

    /*
     * Admin permissions must be enforced by
     * Firebase Security Rules and backend.
     * Frontend visibility is not security.
     */
  };

  /* =======================================================
     START APPLICATION
  ======================================================= */

  window.KULTRA.app = App;

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      App.init();
    }
  );
})();
