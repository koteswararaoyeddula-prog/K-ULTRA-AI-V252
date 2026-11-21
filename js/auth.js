
/*
 * K-ULTRA AI — VERSION 252
 * FILE: js/auth.js
 * Firebase Authentication Module
 */

import "./config.js";

import { initializeApp, getApps, getApp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG;

  if (!CONFIG) {
    console.error("K-ULTRA Auth: Configuration is missing.");
    return;
  }

  const authSettings = CONFIG.AUTH || {};
  const firebaseSettings = CONFIG.FIREBASE || {};

  let firebaseApp = null;
  let auth = null;
  let currentUser = null;
  let initialized = false;

  const listeners = new Set();

  // -----------------------------------------
  // FIREBASE CONFIGURATION
  // -----------------------------------------

  function findFirebaseConfig() {
    const candidates = [
      firebaseSettings.CONFIG,
      firebaseSettings.config,
      firebaseSettings,
      authSettings.FIREBASE_CONFIG,
      authSettings.firebaseConfig,
      authSettings.FIREBASE,
      CONFIG.FIREBASE_CONFIG
    ];

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        candidate.apiKey &&
        candidate.authDomain &&
        candidate.projectId &&
        candidate.appId
      ) {
        return candidate;
      }
    }

    // Search nested configuration objects safely.
    const visited = new Set();

    function search(object, depth = 0) {
      if (
        !object ||
        typeof object !== "object" ||
        depth > 4 ||
        visited.has(object)
      ) {
        return null;
      }

      visited.add(object);

      if (
        object.apiKey &&
        object.authDomain &&
        object.projectId &&
        object.appId
      ) {
        return object;
      }

      for (const value of Object.values(object)) {
        if (value && typeof value === "object") {
          const result = search(value, depth + 1);
          if (result) return result;
        }
      }

      return null;
    }

    return search(CONFIG);
  }

  // -----------------------------------------
  // NOTIFICATIONS
  // -----------------------------------------

  function notify(message, type = "info") {
    if (window.KULTRA?.showToast) {
      window.KULTRA.showToast(message, type);
      return;
    }

    console.log(`[K-ULTRA Auth] ${message}`);
  }

  function updateAuthStatus(message, statusClass = "checking") {
    const element = document.querySelector("#authStatus");

    if (!element) return;

    element.textContent = message;

    element.classList.remove(
      "connected",
      "error",
      "checking"
    );

    element.classList.add(statusClass);
  }

  // -----------------------------------------
  // ERROR HANDLING
  // -----------------------------------------

  function getFriendlyError(error) {
    const code = error?.code || "";

    const errors = {
      "auth/email-already-in-use":
        "This email is already registered.",

      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/weak-password":
        "Password must be at least 6 characters.",

      "auth/user-not-found":
        "No account was found with this email.",

      "auth/wrong-password":
        "Incorrect email or password.",

      "auth/invalid-credential":
        "Invalid login details. Please check your email and password.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/popup-closed-by-user":
        "Google sign-in was cancelled.",

      "auth/popup-blocked":
        "Your browser blocked the sign-in popup.",

      "auth/network-request-failed":
        "Network error. Check your internet connection.",

      "auth/operation-not-allowed":
        "This login method is not enabled in Firebase.",

      "auth/unauthorized-domain":
        "This website domain is not authorized in Firebase."
    };

    return errors[code] || error?.message || "Authentication failed.";
  }

  // -----------------------------------------
  // AUTH INITIALIZATION
  // -----------------------------------------

  function initialize() {
    if (initialized) return true;

    const firebaseConfig = findFirebaseConfig();

    if (!firebaseConfig) {
      console.warn(
        "K-ULTRA Auth: Firebase configuration is missing or incomplete."
      );

      updateAuthStatus(
        "Firebase configuration required",
        "error"
      );

      return false;
    }

    try {
      firebaseApp = getApps().length
        ? getApp()
        : initializeApp(firebaseConfig);

      auth = getAuth(firebaseApp);

      initialized = true;

      onAuthStateChanged(auth, user => {
        currentUser = user || null;

        updateAuthStatus(
          user ? "Signed in" : "Not signed in",
          user ? "connected" : "checking"
        );

        listeners.forEach(callback => {
          try {
            callback(currentUser);
          } catch (error) {
            console.error("Auth listener error:", error);
          }
        });

        document.dispatchEvent(
          new CustomEvent("kultra:authchange", {
            detail: {
              user: currentUser
                ? {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName
                  }
                : null
            }
          })
        );
      });

      console.info("K-ULTRA Firebase Authentication initialized.");

      return true;

    } catch (error) {
      console.error("Firebase initialization failed:", error);

      updateAuthStatus("Firebase initialization failed", "error");

      return false;
    }
  }

  function requireAuth() {
    if (!initialized || !auth) {
      throw new Error(
        "Firebase is not initialized. Check your Firebase configuration."
      );
    }
  }

  // -----------------------------------------
  // SIGN UP
  // -----------------------------------------

  async function signUp(name, email, password) {
    requireAuth();

    if (!name || !email || !password) {
      throw new Error("Please fill in all required fields.");
    }

    if (password.length < 6) {
      throw new Error("Password must contain at least 6 characters.");
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    if (name.trim()) {
      await updateProfile(credential.user, {
        displayName: name.trim()
      });
    }

    currentUser = credential.user;

    notify("Your account has been created successfully.");

    return credential.user;
  }

  // -----------------------------------------
  // EMAIL LOGIN
  // -----------------------------------------

  async function login(email, password) {
    requireAuth();

    if (!email || !password) {
      throw new Error("Enter your email and password.");
    }

    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    currentUser = credential.user;

    notify("Login successful.");

    return credential.user;
  }

  // -----------------------------------------
  // GOOGLE LOGIN
  // -----------------------------------------

  async function loginWithGoogle() {
    requireAuth();

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const result = await signInWithPopup(auth, provider);

    currentUser = result.user;

    notify("Google login successful.");

    return result.user;
  }

  // -----------------------------------------
  // PASSWORD RESET
  // -----------------------------------------

  async function resetPassword(email) {
    requireAuth();

    if (!email) {
      throw new Error("Enter your registered email address.");
    }

    await sendPasswordResetEmail(auth, email.trim());

    notify("Password reset email sent.");

    return true;
  }

  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------

  async function logout() {
    requireAuth();

    await signOut(auth);

    currentUser = null;

    notify("You have been logged out.");

    return true;
  }

  // -----------------------------------------
  // USER INFORMATION
  // -----------------------------------------

  function getCurrentUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return Boolean(currentUser);
  }

  function onChange(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback must be a function.");
    }

    listeners.add(callback);

    if (initialized) {
      callback(currentUser);
    }

    return () => listeners.delete(callback);
  }

  // -----------------------------------------
  // AUTH MODAL
  // -----------------------------------------

  function createAuthModal() {
    if (document.querySelector("#kultraAuthModal")) return;

    const modal = document.createElement("div");

    modal.id = "kultraAuthModal";
    modal.hidden = true;

    modal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:100000;
      background:rgba(0,0,0,.72);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      overflow-y:auto;
    `;

    const panel = document.createElement("div");

    panel.style.cssText = `
      width:100%;
      max-width:420px;
      padding:26px;
      border-radius:18px;
      background:var(--card, #151d30);
      color:var(--text, #fff);
      border:1px solid var(--border, #30394d);
      box-shadow:0 20px 60px rgba(0,0,0,.35);
    `;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <h2 id="kultraAuthHeading" style="margin:0;font-size:22px">Welcome</h2>
        <button type="button" data-auth-close aria-label="Close"
          style="font-size:24px;background:transparent;border:0;color:inherit;cursor:pointer">×</button>
      </div>

      <p id="kultraAuthMessage" style="opacity:.75;line-height:1.5">
        Sign in to your K-ULTRA AI account.
      </p>

      <form id="kultraAuthForm">
        <div id="kultraNameField" hidden>
          <label for="kultraAuthName">Full name</label>
          <input id="kultraAuthName" name="name" autocomplete="name"
            placeholder="Your name"
            style="width:100%;box-sizing:border-box;padding:12px;margin:8px 0 15px;border-radius:9px">
        </div>

        <label for="kultraAuthEmail">Email address</label>
        <input id="kultraAuthEmail" name="email" type="email"
          autocomplete="email" required placeholder="you@example.com"
          style="width:100%;box-sizing:border-box;padding:12px;margin:8px 0 15px;border-radius:9px">

        <label for="kultraAuthPassword">Password</label>
        <input id="kultraAuthPassword" name="password" type="password"
          autocomplete="current-password" minlength="6" required
          placeholder="At least 6 characters"
          style="width:100%;box-sizing:border-box;padding:12px;margin:8px 0 15px;border-radius:9px">

        <p id="kultraAuthError" role="alert"
          style="color:#ff7777;font-size:13px;min-height:18px"></p>

        <button id="kultraAuthSubmit" type="submit"
          style="width:100%;padding:13px;border:0;border-radius:10px;background:var(--primary,#637cff);color:white;font-weight:700;cursor:pointer">
          Login
        </button>
      </form>

      <button type="button" id="kultraGoogleLogin"
        style="width:100%;padding:12px;margin-top:12px;border-radius:10px;cursor:pointer">
        Continue with Google
      </button>

      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:18px;font-size:13px">
        <button type="button" id="kultraAuthSwitch"
          style="background:none;border:0;color:inherit;cursor:pointer">
          Create account
        </button>

        <button type="button" id="kultraForgotPassword"
          style="background:none;border:0;color:inherit;cursor:pointer">
          Forgot password?
        </button>
      </div>
    `;

    modal.appendChild(panel);
    document.body.appendChild(modal);

    let mode = "login";

    const form = panel.querySelector("#kultraAuthForm");
    const heading = panel.querySelector("#kultraAuthHeading");
    const message = panel.querySelector("#kultraAuthMessage");
    const nameField = panel.querySelector("#kultraNameField");
    const nameInput = panel.querySelector("#kultraAuthName");
    const passwordInput = panel.querySelector("#kultraAuthPassword");
    const submit = panel.querySelector("#kultraAuthSubmit");
    const errorBox = panel.querySelector("#kultraAuthError");
    const switchButton = panel.querySelector("#kultraAuthSwitch");
    const forgotButton = panel.querySelector("#kultraForgotPassword");
    const googleButton = panel.querySelector("#kultraGoogleLogin");

    function setMode(nextMode) {
      mode = nextMode;

      const signup = mode === "signup";

      heading.textContent = signup ? "Create account" : "Welcome back";
      message.textContent = signup
        ? "Create your K-ULTRA AI account."
        : "Sign in to your K-ULTRA AI account.";

      nameField.hidden = !signup;
      nameInput.required = signup;

      passwordInput.autocomplete = signup
        ? "new-password"
        : "current-password";

      submit.textContent = signup ? "Create account" : "Login";

      switchButton.textContent = signup
        ? "Already have an account? Login"
        : "Create account";

      forgotButton.hidden = signup;
      errorBox.textContent = "";
    }

    function close() {
      modal.hidden = true;
    }

    panel.querySelector("[data-auth-close]").addEventListener("click", close);

    modal.addEventListener("click", event => {
      if (event.target === modal) close();
    });

    switchButton.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();

      errorBox.textContent = "";
      submit.disabled = true;
      submit.textContent = "Please wait...";

      const email = panel.querySelector("#kultraAuthEmail").value;
      const password = passwordInput.value;

      try {
        if (mode === "signup") {
          await signUp(nameInput.value, email, password);
        } else {
          await login(email, password);
        }

        close();
      } catch (error) {
        errorBox.textContent = getFriendlyError(error);
      } finally {
        submit.disabled = false;
        submit.textContent = mode === "signup"
          ? "Create account"
          : "Login";
      }
    });

    googleButton.addEventListener("click", async () => {
      errorBox.textContent = "";
      googleButton.disabled = true;
      googleButton.textContent = "Connecting...";

      try {
        await loginWithGoogle();
        close();
      } catch (error) {
        errorBox.textContent = getFriendlyError(error);
      } finally {
        googleButton.disabled = false;
        googleButton.textContent = "Continue with Google";
      }
    });

    forgotButton.addEventListener("click", async () => {
      const email = panel.querySelector("#kultraAuthEmail").value;

      if (!email) {
        errorBox.textContent = "Enter your email address first.";
        return;
      }

      try {
        await resetPassword(email);
      } catch (error) {
        errorBox.textContent = getFriendlyError(error);
      }
    });

    modal.openAuth = requestedMode => {
      setMode(requestedMode === "signup" ? "signup" : "login");
      modal.hidden = false;
    };
  }

  function openAuth(mode = "login") {
    if (!initialized && !initialize()) {
      notify("Firebase configuration is required.", "error");
      return;
    }

    createAuthModal();

    document.querySelector("#kultraAuthModal").openAuth(mode);
  }

  // -----------------------------------------
  // PUBLIC AUTH API
  // -----------------------------------------

  const authAPI = {
    initialize,
    signUp,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
    getCurrentUser,
    isLoggedIn,
    onChange,
    openAuth,
    getAuth: () => auth
  };

  window.KULTRA = window.KULTRA || {};
  window.KULTRA.auth = authAPI;

  // Initialize after the browser has loaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

  // Buttons can use data-auth-open="login" or "signup".
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-auth-open]");

    if (!button) return;

    openAuth(button.dataset.authOpen);
  });

  console.info("K-ULTRA AI authentication module loaded.");

})();
        
