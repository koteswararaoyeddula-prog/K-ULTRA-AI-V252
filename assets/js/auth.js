
/* =========================================
   @K-UNIQUE — AUTHENTICATION SYSTEM
   Firebase Authentication
   VERSION: 1.0.1
========================================= */

(function (window) {
  "use strict";

  const CONFIG = window.KUNIQUE_CONFIG;

  const AUTH = {
    initialized: false,
    available: false,
    firebaseAuth: null,
    currentUser: null
  };

  function getFirebaseConfig() {
    return CONFIG?.FIREBASE?.CONFIG || {};
  }

  function validateFirebaseConfig(config) {
    return Boolean(
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId &&
      !String(config.apiKey).includes("YOUR_") &&
      !String(config.projectId).includes("YOUR_")
    );
  }

  function getFriendlyError(error) {
    const messages = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Password must contain at least 6 characters.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/popup-closed-by-user": "Google login was cancelled.",
      "auth/popup-blocked": "Popup blocked. Trying redirect login.",
      "auth/network-request-failed": "Network error. Check your internet.",
      "auth/operation-not-allowed": "Enable this login method in Firebase.",
      "auth/unauthorized-domain": "Add this website domain in Firebase Authorized Domains."
    };

    return messages[error?.code] || error?.message || "Authentication failed.";
  }

  function ensureAvailable() {
    if (!AUTH.available || !AUTH.firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not ready. Check SDK and config.js."
      );
    }
  }

  function emitAuthEvent(user) {
    AUTH.currentUser = user || null;

    window.dispatchEvent(
      new CustomEvent("kunique:auth-state-changed", {
        detail: { user: AUTH.currentUser }
      })
    );
  }

  function initialize() {
    if (AUTH.initialized) return AUTH.available;

    if (!window.firebase) {
      console.error("[K-UNIQUE Auth] Firebase SDK not loaded.");
      return false;
    }

    const firebaseConfig = getFirebaseConfig();

    if (!validateFirebaseConfig(firebaseConfig)) {
      console.error("[K-UNIQUE Auth] Firebase config is incomplete.");
      return false;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      AUTH.firebaseAuth = window.firebase.auth();
      AUTH.available = true;
      AUTH.initialized = true;

      AUTH.firebaseAuth.setPersistence(
        window.firebase.auth.Auth.Persistence.LOCAL
      ).catch(error => {
        console.warn("[K-UNIQUE Auth] Persistence error:", error);
      });

      AUTH.firebaseAuth.onAuthStateChanged(user => {
        emitAuthEvent(user);
      });

      console.log("[K-UNIQUE Auth] Firebase initialized.");

      return true;

    } catch (error) {
      console.error("[K-UNIQUE Auth] Initialization failed:", error);

      AUTH.available = false;
      AUTH.initialized = false;

      return false;
    }
  }

  async function register(email, password, displayName = "") {
    ensureAvailable();

    try {
      const result =
        await AUTH.firebaseAuth.createUserWithEmailAndPassword(
          email.trim(),
          password
        );

      if (displayName.trim()) {
        await result.user.updateProfile({
          displayName: displayName.trim()
        });
      }

      await result.user.sendEmailVerification();

      return {
        success: true,
        user: result.user,
        message: "Account created. Please verify your email."
      };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function login(email, password) {
    ensureAvailable();

    try {
      const result =
        await AUTH.firebaseAuth.signInWithEmailAndPassword(
          email.trim(),
          password
        );

      return {
        success: true,
        user: result.user,
        message: "Login successful."
      };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function googleLogin() {
    ensureAvailable();

    try {
      const provider =
        new window.firebase.auth.GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account"
      });

      try {
        const result =
          await AUTH.firebaseAuth.signInWithPopup(provider);

        return {
          success: true,
          user: result.user,
          message: "Google login successful."
        };

      } catch (error) {
        if (
          error.code === "auth/popup-blocked" ||
          error.code === "auth/operation-not-supported-in-this-environment"
        ) {
          await AUTH.firebaseAuth.signInWithRedirect(provider);

          return {
            success: true,
            redirecting: true,
            message: "Redirecting to Google login."
          };
        }

        throw error;
      }

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function handleRedirectResult() {
    ensureAvailable();

    try {
      const result =
        await AUTH.firebaseAuth.getRedirectResult();

      if (result && result.user) {
        return {
          success: true,
          user: result.user,
          message: "Google login successful."
        };
      }

      return { success: true, user: null };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function logout() {
    ensureAvailable();

    try {
      await AUTH.firebaseAuth.signOut();

      return {
        success: true,
        message: "Logged out successfully."
      };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function resetPassword(email) {
    ensureAvailable();

    try {
      await AUTH.firebaseAuth.sendPasswordResetEmail(
        email.trim()
      );

      return {
        success: true,
        message: "Password reset email sent."
      };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  async function resendVerificationEmail() {
    ensureAvailable();

    const user = getCurrentUser();

    if (!user) {
      throw new Error("Please login first.");
    }

    try {
      await user.sendEmailVerification();

      return {
        success: true,
        message: "Verification email sent."
      };

    } catch (error) {
      throw new Error(getFriendlyError(error));
    }
  }

  function getCurrentUser() {
    return AUTH.firebaseAuth?.currentUser || null;
  }

  function isLoggedIn() {
    return Boolean(getCurrentUser());
  }

  function onAuthStateChanged(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback must be a function.");
    }

    if (!AUTH.available) {
      initialize();
    }

    if (!AUTH.firebaseAuth) {
      return function () {};
    }

    return AUTH.firebaseAuth.onAuthStateChanged(callback);
  }

  async function getIdToken(forceRefresh = false) {
    const user = getCurrentUser();

    if (!user) return null;

    return user.getIdToken(forceRefresh);
  }

  function requireLogin() {
    if (!isLoggedIn()) {
      window.dispatchEvent(
        new CustomEvent("kunique:login-required")
      );

      return false;
    }

    return true;
  }

  window.KUNIQUE_AUTH = Object.freeze({
    initialize,
    register,
    login,
    googleLogin,
    handleRedirectResult,
    logout,
    resetPassword,
    resendVerificationEmail,
    getCurrentUser,
    getIdToken,
    isLoggedIn,
    onAuthStateChanged,
    requireLogin,
    getFriendlyError,

    get available() {
      return AUTH.available;
    }
  });

  initialize();

})(window);
