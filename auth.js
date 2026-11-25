
/* =========================================================
   K-ULTRA AI — VERSION 252
   FILE: auth.js
   Firebase Authentication
   ========================================================= */

(function () {
  "use strict";

  window.KULTRA = window.KULTRA || {};

  const Auth = {};

  let firebaseAuth = null;
  let currentUser = null;
  let authMode = "signin";
  let authInitialized = false;

  /* -------------------------------------------------------
     DOM HELPER
  ------------------------------------------------------- */

  function getElement(id) {
    return document.getElementById(id);
  }

  function showElement(id) {
    const element = getElement(id);

    if (element) {
      element.hidden = false;
    }
  }

  function hideElement(id) {
    const element = getElement(id);

    if (element) {
      element.hidden = true;
    }
  }

  function setText(id, text) {
    const element = getElement(id);

    if (element) {
      element.textContent = text || "";
    }
  }

  function toast(message, type) {
    const utils = window.KULTRA.utils;

    if (utils && typeof utils.toast === "function") {
      utils.toast(message, type || "info");
    } else {
      console.log(message);
    }
  }

  /* -------------------------------------------------------
     INITIALIZE FIREBASE
  ------------------------------------------------------- */

  Auth.initialize = function () {
    if (authInitialized && firebaseAuth) {
      return firebaseAuth;
    }

    if (!window.firebase) {
      console.error(
        "Firebase SDK is not loaded."
      );

      return null;
    }

    const config =
      window.KULTRA_CONFIG &&
      window.KULTRA_CONFIG.firebase;

    if (!config || !config.apiKey) {
      console.error(
        "Firebase configuration is missing."
      );

      return null;
    }

    try {
      let firebaseApp;

      if (window.firebase.apps.length > 0) {
        firebaseApp = window.firebase.app();
      } else {
        firebaseApp = window.firebase.initializeApp(config);
      }

      firebaseAuth = firebaseApp.auth();

      Auth.firebaseAuth = firebaseAuth;
      Auth.app = firebaseApp;

      authInitialized = true;

      Auth.listenForAuthChanges();

      console.log(
        "K-ULTRA Firebase Authentication initialized."
      );

      return firebaseAuth;
    } catch (error) {
      console.error(
        "Firebase initialization error:",
        error
      );

      toast(
        "Firebase initialization failed.",
        "error"
      );

      return null;
    }
  };

  /* -------------------------------------------------------
     AUTH STATE LISTENER
  ------------------------------------------------------- */

  Auth.listenForAuthChanges = function () {
    if (!firebaseAuth) {
      return;
    }

    firebaseAuth.onAuthStateChanged(
      function (user) {
        currentUser = user || null;

        Auth.currentUser = currentUser;

        Auth.updateUI();

        document.dispatchEvent(
          new CustomEvent("kultra:auth-state", {
            detail: {
              user: currentUser
            }
          })
        );
      },
      function (error) {
        console.error(
          "Authentication state error:",
          error
        );
      }
    );
  };

  /* -------------------------------------------------------
     GET CURRENT USER
  ------------------------------------------------------- */

  Auth.getCurrentUser = function () {
    return currentUser;
  };

  Auth.isSignedIn = function () {
    return Boolean(currentUser);
  };

  /* -------------------------------------------------------
     OPEN AUTH MODAL
  ------------------------------------------------------- */

  Auth.openModal = function (mode) {
    authMode = mode || "signin";

    Auth.updateAuthModal();

    showElement("authModal");

    const modal = getElement("authModal");

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }

    const emailInput = getElement("authEmail");

    if (emailInput) {
      emailInput.focus();
    }
  };

  /* -------------------------------------------------------
     CLOSE AUTH MODAL
  ------------------------------------------------------- */

  Auth.closeModal = function () {
    const modal = getElement("authModal");

    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      modal.hidden = true;
    }

    setText("authError", "");
  };

  /* -------------------------------------------------------
     UPDATE AUTH MODAL CONTENT
  ------------------------------------------------------- */

  Auth.updateAuthModal = function () {
    const isSignup = authMode === "signup";

    setText(
      "authModalTitle",
      isSignup ? "Create your account" : "Welcome back"
    );

    setText(
      "authModalDescription",
      isSignup
        ? "Create an account to use K-ULTRA AI."
        : "Sign in to continue using K-ULTRA AI."
    );

    setText(
      "authSubmitBtn",
      isSignup ? "Create Account" : "Sign In"
    );

    setText(
      "authSwitchText",
      isSignup
        ? "Already have an account?"
        : "Don't have an account?"
    );

    setText(
      "authSwitchBtn",
      isSignup ? "Sign In" : "Create Account"
    );

    const displayName = getElement("authDisplayName");

    if (displayName) {
      displayName.hidden = !isSignup;
      displayName.required = isSignup;
    }

    const forgotPassword = getElement("forgotPasswordBtn");

    if (forgotPassword) {
      forgotPassword.hidden = isSignup;
    }

    setText("authError", "");
  };

  /* -------------------------------------------------------
     SWITCH SIGN IN / SIGN UP
  ------------------------------------------------------- */

  Auth.switchMode = function () {
    authMode =
      authMode === "signin"
        ? "signup"
        : "signin";

    Auth.updateAuthModal();
  };

  /* -------------------------------------------------------
     EMAIL SIGN IN
  ------------------------------------------------------- */

  Auth.signInWithEmail = async function (
    email,
    password
  ) {
    if (!firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not initialized."
      );
    }

    const result =
      await firebaseAuth.signInWithEmailAndPassword(
        email.trim(),
        password
      );

    return result.user;
  };

  /* -------------------------------------------------------
     EMAIL SIGN UP
  ------------------------------------------------------- */

  Auth.createAccount = async function (
    email,
    password,
    displayName
  ) {
    if (!firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not initialized."
      );
    }

    const result =
      await firebaseAuth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );

    if (displayName) {
      await result.user.updateProfile({
        displayName: displayName.trim()
      });
    }

    return result.user;
  };

  /* -------------------------------------------------------
     GOOGLE SIGN IN
  ------------------------------------------------------- */

  Auth.signInWithGoogle = async function () {
    if (!firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not initialized."
      );
    }

    const provider =
      new window.firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result =
        await firebaseAuth.signInWithPopup(provider);

      return result.user;
    } catch (error) {
      /*
       * Popup may not work in some mobile browsers.
       * Use redirect as a fallback for popup errors.
       */

      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        await firebaseAuth.signInWithRedirect(provider);
        return null;
      }

      throw error;
    }
  };

  /* -------------------------------------------------------
     PASSWORD RESET
  ------------------------------------------------------- */

  Auth.resetPassword = async function (email) {
    if (!firebaseAuth) {
      throw new Error(
        "Firebase Authentication is not initialized."
      );
    }

    if (!email || !email.trim()) {
      throw new Error(
        "Please enter your email address."
      );
    }

    await firebaseAuth.sendPasswordResetEmail(
      email.trim()
    );

    return true;
  };

  /* -------------------------------------------------------
     SIGN OUT
  ------------------------------------------------------- */

  Auth.signOut = async function () {
    if (!firebaseAuth) {
      return;
    }

    await firebaseAuth.signOut();

    currentUser = null;
    Auth.currentUser = null;

    Auth.updateUI();

    toast("Signed out successfully.", "success");
  };

  /* -------------------------------------------------------
     UPDATE UI AFTER AUTH CHANGE
  ------------------------------------------------------- */

  Auth.updateUI = function () {
    const user = currentUser;

    const signInBtn = getElement("signInBtn");
    const settingsSignInBtn =
      getElement("settingsSignInBtn");

    const signOutBtn = getElement("signOutBtn");
    const adminNavBtn = getElement("adminNavBtn");

    if (signInBtn) {
      signInBtn.textContent = user
        ? user.displayName || user.email || "Account"
        : "Sign In";
    }

    if (settingsSignInBtn) {
      settingsSignInBtn.hidden = Boolean(user);
    }

    if (signOutBtn) {
      signOutBtn.hidden = !user;
    }

    if (adminNavBtn) {
      /*
       * Admin access must also be checked securely
       * on the backend. Hiding the button is only UI.
       */
      adminNavBtn.hidden = !user;
    }

    if (user) {
      Auth.closeModal();
    }
  };

  /* -------------------------------------------------------
     AUTH ERROR MESSAGE
  ------------------------------------------------------- */

  Auth.getAuthErrorMessage = function (error) {
    const code = error && error.code;

    const messages = {
      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/user-disabled":
        "This account has been disabled.",

      "auth/user-not-found":
        "No account found with this email.",

      "auth/wrong-password":
        "Incorrect email or password.",

      "auth/invalid-credential":
        "Email or password is incorrect.",

      "auth/email-already-in-use":
        "This email is already registered.",

      "auth/weak-password":
        "Password must be at least 6 characters.",

      "auth/operation-not-allowed":
        "This sign-in method is not enabled in Firebase.",

      "auth/network-request-failed":
        "Network error. Please check your internet.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/popup-blocked":
        "Google sign-in popup was blocked.",

      "auth/account-exists-with-different-credential":
        "This email is registered using another sign-in method."
    };

    return (
      messages[code] ||
      (error && error.message) ||
      "Authentication failed. Please try again."
    );
  };

  /* -------------------------------------------------------
     FORM SUBMIT
  ------------------------------------------------------- */

  Auth.handleAuthSubmit = async function (event) {
    event.preventDefault();

    const emailInput = getElement("authEmail");
    const passwordInput = getElement("authPassword");
    const displayNameInput =
      getElement("authDisplayName");

    const submitButton = getElement("authSubmitBtn");

    const email =
      emailInput ? emailInput.value.trim() : "";

    const password =
      passwordInput ? passwordInput.value : "";

    const displayName =
      displayNameInput
        ? displayNameInput.value.trim()
        : "";

    setText("authError", "");

    if (!email || !password) {
      setText(
        "authError",
        "Please enter your email and password."
      );

      return;
    }

    if (authMode === "signup" && password.length < 6) {
      setText(
        "authError",
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      authMode === "signup" &&
      !displayName
    ) {
      setText(
        "authError",
        "Please enter your name."
      );

      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Please wait...";
    }

    try {
      if (authMode === "signup") {
        await Auth.createAccount(
          email,
          password,
          displayName
        );

        toast(
          "Account created successfully!",
          "success"
        );
      } else {
        await Auth.signInWithEmail(
          email,
          password
        );

        toast(
          "Signed in successfully!",
          "success"
        );
      }

      Auth.closeModal();
    } catch (error) {
      console.error("Auth error:", error);

      setText(
        "authError",
        Auth.getAuthErrorMessage(error)
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        Auth.updateAuthModal();
      }
    }
  };

  /* -------------------------------------------------------
     GOOGLE BUTTON
  ------------------------------------------------------- */

  Auth.handleGoogleSignIn = async function () {
    const button = getElement("googleSignInBtn");

    if (button) {
      button.disabled = true;
      button.textContent = "Connecting...";
    }

    setText("authError", "");

    try {
      await Auth.signInWithGoogle();

      toast(
        "Google sign-in successful!",
        "success"
      );
    } catch (error) {
      console.error("Google sign-in error:", error);

      setText(
        "authError",
        Auth.getAuthErrorMessage(error)
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Continue with Google";
      }
    }
  };

  /* -------------------------------------------------------
     FORGOT PASSWORD BUTTON
  ------------------------------------------------------- */

  Auth.handleForgotPassword = async function () {
    const emailInput = getElement("authEmail");

    const email =
      emailInput ? emailInput.value.trim() : "";

    if (!email) {
      setText(
        "authError",
        "Enter your email address first."
      );

      if (emailInput) {
        emailInput.focus();
      }

      return;
    }

    try {
      await Auth.resetPassword(email);

      toast(
        "Password reset email sent.",
        "success"
      );

      setText(
        "authError",
        "Check your email for the password reset link."
      );
    } catch (error) {
      setText(
        "authError",
        Auth.getAuthErrorMessage(error)
      );
    }
  };

  /* -------------------------------------------------------
     CONNECT BUTTON EVENTS
  ------------------------------------------------------- */

  Auth.bindEvents = function () {
    const signInBtn = getElement("signInBtn");

    const settingsSignInBtn =
      getElement("settingsSignInBtn");

    const authForm = getElement("authForm");

    const googleSignInBtn =
      getElement("googleSignInBtn");

    const forgotPasswordBtn =
      getElement("forgotPasswordBtn");

    const authSwitchBtn =
      getElement("authSwitchBtn");

    const signOutBtn = getElement("signOutBtn");

    if (signInBtn) {
      signInBtn.addEventListener(
        "click",
        function () {
          if (currentUser) {
            toast(
              currentUser.displayName ||
                currentUser.email ||
                "You are signed in.",
              "info"
            );
          } else {
            Auth.openModal("signin");
          }
        }
      );
    }

    if (settingsSignInBtn) {
      settingsSignInBtn.addEventListener(
        "click",
        function () {
          Auth.openModal("signin");
        }
      );
    }

    if (authForm) {
      authForm.addEventListener(
        "submit",
        Auth.handleAuthSubmit
      );
    }

    if (googleSignInBtn) {
      googleSignInBtn.addEventListener(
        "click",
        Auth.handleGoogleSignIn
      );
    }

    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener(
        "click",
        Auth.handleForgotPassword
      );
    }

    if (authSwitchBtn) {
      authSwitchBtn.addEventListener(
        "click",
        Auth.switchMode
      );
    }

    if (signOutBtn) {
      signOutBtn.addEventListener(
        "click",
        Auth.signOut
      );
    }

    document
      .querySelectorAll(
        '[data-close-modal="authModal"]'
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          Auth.closeModal
        );
      });
  };

  /* -------------------------------------------------------
     INITIALIZE AUTH
  ------------------------------------------------------- */

  Auth.init = function () {
    Auth.initialize();
    Auth.bindEvents();
  };

  /* -------------------------------------------------------
     EXPORT
  ------------------------------------------------------- */

  window.KULTRA.auth = Auth;

  /*
   * Expose Firebase auth instance for workers.js
   * so it can obtain the current user's ID token.
   */

  Auth.firebaseAuth = firebaseAuth;
  Auth.currentUser = currentUser;

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      Auth.init();
    }
  );

  console.log(
    "K-ULTRA AI authentication module loaded."
  );
})();
