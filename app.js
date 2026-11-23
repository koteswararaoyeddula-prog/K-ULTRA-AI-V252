
"use strict";

(() => {
  const cfg = window.KULTRA_CONFIG;
  const $ = id => document.getElementById(id);

  const authScreen = $("authScreen");
  const app = $("app");
  const authForm = $("authForm");
  const authEmail = $("authEmail");
  const authPassword = $("authPassword");
  const authSubmit = $("authSubmit");
  const authError = $("authError");
  const messagesEl = $("messages");
  const input = $("messageInput");
  const sendBtn = $("sendBtn");
  const welcome = $("welcome");
  const statusEl = $("connectionStatus");

  let auth;
  let signupMode = false;
  let currentMessages = [];
  let busy = false;
  let recognition = null;
  let currentChatId = null;

  const STORAGE_KEY = "kultra_v252_chats";

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3000);
  }

  function friendlyError(error) {
    const map = {
      "auth/email-already-in-use": "ఈ Email తో Account ఇప్పటికే ఉంది.",
      "auth/invalid-email": "Email address సరిగ్గా లేదు.",
      "auth/weak-password": "Password కనీసం 6 అక్షరాలు ఉండాలి.",
      "auth/user-not-found": "ఈ Email తో Account కనిపించలేదు.",
      "auth/wrong-password": "Password తప్పు.",
      "auth/invalid-credential": "Email లేదా Password తప్పు.",
      "auth/popup-blocked": "Google login popup block అయింది.",
      "auth/operation-not-allowed": "Firebase Console లో ఈ Login method enable చేయాలి.",
      "auth/unauthorized-domain": "Firebase Authentication లో GitHub Pages domain add చేయాలి."
    };
    return map[error.code] || error.message || "ఏదో సమస్య వచ్చింది.";
  }

  function setAuthMode(signup) {
    signupMode = signup;
    $("loginTab").classList.toggle("active", !signup);
    $("signupTab").classList.toggle("active", signup);
    authSubmit.textContent = signup ? "Create account" : "Login";
    authPassword.autocomplete = signup ? "new-password" : "current-password";
    authError.textContent = "";
  }

  $("loginTab").addEventListener("click", () => setAuthMode(false));
  $("signupTab").addEventListener("click", () => setAuthMode(true));

  function showApp(user) {
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    toast("Welcome " + (user.displayName || user.email || "to K-ULTRA AI"));
    checkBackend();
    loadHistory();
    startNewChat();
  }

  function showAuth() {
    app.classList.add("hidden");
    authScreen.classList.remove("hidden");
  }

  async function initFirebase() {
    try {
      if (!cfg || !cfg.FIREBASE || !cfg.FIREBASE.apiKey) {
        throw new Error("config.js Firebase settings కనిపించడం లేదు.");
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(cfg.FIREBASE);
      }

      auth = firebase.auth();

      auth.onAuthStateChanged(user => {
        if (user) showApp(user);
        else showAuth();
      });
    } catch (error) {
      authError.textContent = error.message;
      console.error("Firebase initialization:", error);
    }
  }

  authForm.addEventListener("submit", async event => {
    event.preventDefault();
    authError.textContent = "";
    authSubmit.disabled = true;

    try {
      const email = authEmail.value.trim();
      const password = authPassword.value;

      if (signupMode) {
        await auth.createUserWithEmailAndPassword(email, password);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      authError.textContent = friendlyError(error);
    } finally {
      authSubmit.disabled = false;
    }
  });

  $("googleLogin").addEventListener("click", async () => {
    authError.textContent = "";
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (error) {
      authError.textContent = friendlyError(error);
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    if (auth) await auth.signOut();
  });

  async function checkBackend() {
    try {
      const response = await fetch(cfg.API.BASE_URL + cfg.API.HEALTH_ENDPOINT);
      if (!response.ok) throw new Error("Backend unavailable");
      const data = await response.json();
      statusEl.textContent = data.status === "online" ? "● Backend online" : "● Backend issue";
      statusEl.className = "status " + (data.status === "online" ? "online" : "offline");
    } catch (error) {
      statusEl.textContent = "● Backend connection failed";
      statusEl.className = "status offline";
      console.error(error);
    }
  }

  function getSavedChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveCurrentChat() {
    if (!currentChatId || !currentMessages.length) return;
    const chats = getSavedChats();
    const title = currentMessages.find(m => m.role === "user")?.content.slice(0, 45) || "New chat";
    const record = {
      id: currentChatId,
      title,
      messages: currentMessages,
      updatedAt: Date.now()
    };
    const index = chats.findIndex(c => c.id === currentChatId);
    if (index >= 0) chats[index] = record;
    else chats.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 50)));
    loadHistory();
  }

  function loadHistory() {
    const list = $("historyList");
    list.replaceChildren();

    getSavedChats().forEach(chat => {
      const button = document.createElement("button");
      button.className = "history-item";
      button.textContent = chat.title || "Chat";
      button.addEventListener("click", () => openChat(chat.id));
      list.appendChild(button);
    });
  }

  function openChat(id) {
    const chat = getSavedChats().find(c => c.id === id);
    if (!chat) return;
    currentChatId = id;
    currentMessages = chat.messages || [];
    renderMessages();
    $("welcome").classList.toggle("hidden", currentMessages.length > 0);
    $("sidebar").classList.remove("open");
  }

  function startNewChat() {
    currentChatId = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    currentMessages = [];
    messagesEl.replaceChildren();
    welcome.classList.remove("hidden");
    input.value = "";
    input.focus();
  }

  $("newChat").addEventListener("click", startNewChat);

  $("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("kultra_theme", document.body.classList.contains("light") ? "light" : "dark");
  });

  if (localStorage.getItem("kultra_theme") === "light") {
    document.body.classList.add("light");
  }

  $("menuToggle").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  function addMessage(role, content) {
    currentMessages.push({ role, content });
    renderMessages();
    saveCurrentChat();
  }

  function renderMessages() {
    messagesEl.replaceChildren();
    welcome.classList.toggle("hidden", currentMessages.length > 0);

    currentMessages.forEach((message, index) => {
      const row = document.createElement("div");
      row.className = "message " + (message.role === "user" ? "user" : "assistant");

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = message.role === "user" ? "YOU" : "K";

      const body = document.createElement("div");
      body.className = "message-body";

      const name = document.createElement("div");
      name.className = "message-name";
      name.textContent = message.role === "user" ? "You" : "K-ULTRA AI";

      const text = document.createElement("div");
      text.textContent = message.content;

      body.append(name, text);

      if (message.role === "assistant") {
        const actions = document.createElement("div");
        actions.className = "message-actions";

        const copy = document.createElement("button");
        copy.textContent = "Copy";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(message.content);
            toast("Copied!");
          } catch {
            toast("Copy చేయలేకపోయాను.");
          }
        });

        const speak = document.createElement("button");
        speak.textContent = "🔊 Read aloud";
        speak.addEventListener("click", () => speakText(message.content));

        actions.append(copy, speak);
        body.appendChild(actions);
      }

      row.append(avatar, body);
      messagesEl.appendChild(row);
    });

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function sendMessage(text) {
    text = text.trim();
    if (!text || busy) return;
    if (!auth || !auth.currentUser) {
      toast("ముందుగా Login చేయాలి.");
      return;
    }

    busy = true;
    sendBtn.disabled = true;
    welcome.classList.add("hidden");

    currentMessages.push({ role: "user", content: text });
    renderMessages();
    input.value = "";

    const waiting = { role: "assistant", content: "K-ULTRA AI is thinking..." };
    currentMessages.push(waiting);
    renderMessages();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.API.TIMEOUT);

    try {
      const token = await auth.currentUser.getIdToken(true);
      const history = currentMessages
        .filter(m => m !== waiting)
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(cfg.API.BASE_URL + cfg.API.CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || ("Server error: " + response.status));
      }

      const answer =
        data.reply ||
        data.response ||
        data.text ||
        data.message ||
        data.result?.response ||
        data.result?.text ||
        data.choices?.[0]?.message?.content;

      if (typeof answer !== "string" || !answer.trim()) {
        console.error("Unexpected backend response:", data);
        throw new Error("Backend నుంచి AI సమాధానం రాలేదు. Response format పరిశీలించాలి.");
      }

      currentMessages[currentMessages.length - 1].content = answer;
      renderMessages();
      saveCurrentChat();
    } catch (error) {
      const message = error.name === "AbortError"
        ? "Request timeout. మళ్లీ ప్రయత్నించు."
        : error.message;
      currentMessages[currentMessages.length - 1].content = "⚠️ " + message;
      renderMessages();
      toast(message);
    } finally {
      clearTimeout(timeout);
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  $("chatForm").addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input.value);
    }
  });

  document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.prompt));
  });

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      toast("ఈ Browser లో voice output support లేదు.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    speechSynthesis.speak(utterance);
  }

  $("voiceBtn").addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("ఈ Browser లో voice input support లేదు. Chrome లో ప్రయత్నించు.");
      return;
    }

    if (recognition) {
      recognition.stop();
      recognition = null;
      $("voiceBtn").textContent = "🎙 Voice";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      $("voiceBtn").textContent = "⏹ Stop listening";
    };
    recognition.onresult = event => {
      input.value = event.results[0][0].transcript;
      input.focus();
    };
    recognition.onerror = event => toast("Voice error: " + event.error);
    recognition.onend = () => {
      recognition = null;
      $("voiceBtn").textContent = "🎙 Voice";
    };
    recognition.start();
  });

  initFirebase();
})();
 
