
"use strict";

(() => {
  const config = window.KULTRA_FIREBASE_CONFIG;

  if (!config || !config.apiKey ||
      config.apiKey.startsWith("PASTE_")) {
    console.warn("K-ULTRA: Firebase configuration is missing.");
    return;
  }

  if (!window.firebase) {
    console.error("Firebase SDK did not load.");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const auth = firebase.auth();
  window.KULTRA_AUTH = auth;

  const style = document.createElement("style");
  style.textContent = `
    .auth-overlay {
      position:fixed; inset:0; z-index:200;
      display:none; place-items:center; padding:16px;
      background:rgba(3,8,20,.78); backdrop-filter:blur(8px);
    }
    .auth-overlay.open { display:grid; }
    .auth-card {
      width:min(100%,420px); max-height:90vh; overflow:auto;
      padding:25px; border:1px solid var(--border);
      border-radius:18px; background:var(--panel);
      box-shadow:0 25px 80px rgba(0,0,0,.4);
    }
    .auth-card h2 { margin:0 0 7px; font-size:23px; }
    .auth-subtitle { color:var(--muted); font-size:11px; line-height:1.6; }
    .auth-field { display:grid; gap:6px; margin-top:15px; }
    .auth-field label { font-size:11px; color:var(--muted); }
    .auth-field input {
      width:100%; height:42px; padding:0 12px;
      border:1px solid var(--border); border-radius:9px;
      background:var(--bg); color:var(--text);
      outline:none; font-size:13px;
    }
    .auth-field input:focus { border-color:var(--primary); }
    .auth-action {
      width:100%; min-height:42px; margin-top:13px;
      border:0; border-radius:9px; background:var(--primary);
      color:white; font-weight:700; font-size:12px;
    }
    .auth-google {
      background:var(--panel-2); border:1px solid var(--border);
      color:var(--text);
    }
    .auth-switch {
      margin-top:15px; text-align:center; color:var(--muted);
      font-size:11px;
    }
    .auth-switch button {
      border:0; background:none; color:var(--primary);
      font-weight:700;
    }
    .auth-message {
      min-height:18px; margin-top:10px;
      color:#ff8b9b; font-size:11px; line-height:1.5;
    }
    .auth-close {
      float:right; border:0; background:transparent;
      color:var(--muted); font-size:20px;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "auth-overlay";
  overlay.id = "kultraAuthOverlay";
  overlay.innerHTML = `
    <section class="auth-card">
      <button class="auth-close" id="authClose" aria-label="Close">×</button>
      <div class="brand-logo">K</div>
      <h2 id="authTitle">Welcome back</h2>
      <p class="auth-subtitle" id="authSubtitle">
        Sign in to your K-ULTRA AI account.
      </p>

      <form id="authForm">
        <div class="auth-field" id="nameField" hidden>
          <label for="authName">Your name</label>
          <input id="authName" type="text" autocomplete="name">
        </div>
        <div class="auth-field">
          <label for="authEmail">Email address</label>
          <input id="authEmail" type="email"
            autocomplete="email" required>
        </div>
        <div class="auth-field">
          <label for="authPassword">Password</label>
          <input id="authPassword" type="password"
            autocomplete="current-password" minlength="6" required>
        </div>
        <button class="auth-action" id="authSubmit" type="submit">
          Sign In
        </button>
      </form>

      <button class="auth-action auth-google" id="googleSignIn">
        Continue with Google
      </button>

      <div class="auth-message" id="authMessage" role="status"></div>
      <div class="auth-switch" id="authSwitch">
        New here? <button id="authModeToggle">Create account</button>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  let mode = "login";
  let busy = false;

  const $ = (id) => document.getElementById(id);

  function message(text, error = true) {
    $("authMessage").textContent = text;
    $("authMessage").style.color =
      error ? "#ff8b9b" : "#42d5a0";
  }

  function renderMode() {
    const signup = mode === "signup";
    $("authTitle").textContent =
      signup ? "Create your account" : "Welcome back";
    $("authSubtitle").textContent =
      signup ? "Join the K-ULTRA AI workspace." :
      "Sign in to your K-ULTRA AI account.";
    $("nameField").hidden = !signup;
    $("authPassword").autocomplete =
      signup ? "new-password" : "current-password";
    $("authSubmit").textContent =
      signup ? "Create Account" : "Sign In";
    $("authSwitch").innerHTML = signup
      ? 'Already registered? <button id="authModeToggle">Sign in</button>'
      : 'New here? <button id="authModeToggle">Create account</button>';

    $("authModeToggle").addEventListener("click", () => {
      mode = signup ? "login" : "signup";
      message("");
      renderMode();
    });
  }

  function openAuth() {
    mode = "login";
    renderMode();
    message("");
    overlay.classList.add("open");
  }

  function closeAuth() {
    overlay.classList.remove("open");
  }

  function friendlyError(error) {
    const errors = {
      "auth/email-already-in-use": "This email is already registered. Please sign in.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/user-not-found": "No account found for this email.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/popup-closed-by-user": "Google sign-in window was closed.",
      "auth/popup-blocked": "Popup blocked. Allow popups and try again.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase.",
      "auth/operation-not-allowed": "Enable this sign-in method in Firebase Console.",
      "auth/network-request-failed": "Network error. Check your internet connection."
    };

    return errors[error.code] ||
      error.message ||
      "Authentication failed. Please try again.";
  }

  $("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;

    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    const name = $("authName").value.trim();

    if (!email || !password) {
      message("Enter your email and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      message("Password must contain at least 6 characters.");
      return;
    }

    busy = true;
    $("authSubmit").disabled = true;
    $("authSubmit").textContent = "Please wait...";

    try {
      if (mode === "signup") {
        const result =
          await auth.createUserWithEmailAndPassword(email, password);

        if (name) {
          await result.user.updateProfile({ displayName: name });
        }

        await result.user.sendEmailVerification();
        message("Account created. Verification email sent.", false);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
        message("Signed in successfully.", false);
      }

      closeAuth();
      if (window.KULTRA_APP?.showToast) {
        window.KULTRA_APP.showToast("Authentication successful.");
      }
    } catch (error) {
      message(friendlyError(error));
    } finally {
      busy = false;
      $("authSubmit").disabled = false;
      $("authSubmit").textContent =
        mode === "signup" ? "Create Account" : "Sign In";
    }
  });

  $("googleSignIn").addEventListener("click", async () => {
    if (busy) return;

    busy = true;
    $("googleSignIn").disabled = true;
    message("Connecting to Google...", false);

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithPopup(provider);
      closeAuth();

      if (window.KULTRA_APP?.showToast) {
        window.KULTRA_APP.showToast("Google sign-in successful.");
      }
    } catch (error) {
      message(friendlyError(error));
    } finally {
      busy = false;
      $("googleSignIn").disabled = false;
    }
  });

  $("authClose").addEventListener("click", closeAuth);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeAuth();
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-auth-open]");
    if (button) openAuth();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAuth();
  });

  auth.onAuthStateChanged((user) => {
    const name = user?.displayName || user?.email?.split("@")[0] || "My Account";
    document.querySelectorAll(".user-details strong, .profile-label")
      .forEach((element) => {
        element.textContent = name;
      });

    document.querySelectorAll(".user-avatar").forEach((element) => {
      element.textContent = user
        ? (name.trim()[0] || "U").toUpperCase()
        : "U";
    });

    const details = document.querySelector(".user-details small");
    if (details) {
      details.textContent = user ? user.email : "Signed out";
    }

    const profileMenu = $("profileMenu");
    if (profileMenu) {
      let logout = $("kultraLogout");
      if (user && !logout) {
        logout = document.createElement("button");
        logout.id = "kultraLogout";
        logout.textContent = "↪ Sign Out";
        profileMenu.appendChild(logout);
        logout.addEventListener("click", async () => {
          try {
            await auth.signOut();
            if (window.KULTRA_APP?.showToast) {
              window.KULTRA_APP.showToast("Signed out.");
            }
          } catch (error) {
            message(friendlyError(error));
          }
        });
      } else if (!user && logout) {
        logout.remove();
      }
    }

    window.KULTRA_USER = user || null;
    document.dispatchEvent(new CustomEvent("kultra-auth-changed", {
      detail: { user: user || null }
    }));
  });

  const accountNav = document.querySelector(".side-nav");
  if (accountNav && !document.querySelector("[data-auth-open]")) {
    const button = document.createElement("button");
    button.className = "nav-item";
    button.dataset.authOpen = "true";
    button.innerHTML = "<span>⇥</span> Sign In / Create Account";
    const heading = Array.from(accountNav.querySelectorAll(".nav-heading"))
      .find((item) => item.textContent.trim() === "ACCOUNT");
    if (heading) heading.after(button);
    else accountNav.appendChild(button);
  }

  window.KULTRA_AUTH_UI = Object.freeze({
    open: openAuth,
    close: closeAuth,
    getCurrentUser: () => auth.currentUser
  });

  console.info("K-ULTRA AI Firebase Authentication initialized.");
})();
      
