
"use strict";

const $ = id => document.getElementById(id);

const state = {
  page: "chat",
  category: "All",
  cart: [],
  products: [
    { id: 1, name: "Wireless Headphones", price: 1499, category: "Electronics", icon: "🎧" },
    { id: 2, name: "Smart Watch", price: 2299, category: "Electronics", icon: "⌚" },
    { id: 3, name: "Premium Backpack", price: 999, category: "Fashion", icon: "🎒" },
    { id: 4, name: "Desk Lamp", price: 799, category: "Home", icon: "💡" },
    { id: 5, name: "Bluetooth Speaker", price: 1299, category: "Electronics", icon: "🔊" },
    { id: 6, name: "Phone Stand", price: 299, category: "Accessories", icon: "📱" },
    { id: 7, name: "Travel Mug", price: 499, category: "Home", icon: "☕" },
    { id: 8, name: "Laptop Sleeve", price: 699, category: "Accessories", icon: "💻" }
  ]
};

/* Toast */
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2500);
}

/* Navigation */
const pageTitles = {
  chat: "AI Chat",
  store: "K-ULTRA Store",
  developer: "Developer Studio",
  location: "Location & Maps",
  files: "File Tools",
  image: "Image Studio",
  office: "Office Tools",
  settings: "Settings"
};

function openPage(name) {
  const page = $("page-" + name);

  if (!page) {
    toast("Page not found: " + name);
    return;
  }

  state.page = name;

  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  page.classList.add("active");

  document.querySelectorAll(".nav-item[data-page]").forEach(el => {
    el.classList.toggle("active", el.dataset.page === name);
  });

  $("pageTitle").textContent = pageTitles[name] || name;
  $("sidebar").classList.remove("open");
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => openPage(button.dataset.page));
});

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* Themes */
const themes = ["dark", "light", "blue", "purple", "green"];

function setTheme(theme) {
  if (!themes.includes(theme)) theme = "dark";

  document.body.classList.remove(
    "theme-light", "theme-blue", "theme-purple", "theme-green"
  );

  if (theme !== "dark") {
    document.body.classList.add("theme-" + theme);
  }

  $("themeSelect").value = theme;

  try {
    localStorage.setItem("kultra-theme", theme);
  } catch (_) {}
}

$("themeBtn").addEventListener("click", () => {
  let current = "dark";

  for (const theme of themes) {
    if (theme !== "dark" && document.body.classList.contains("theme-" + theme)) {
      current = theme;
    }
  }

  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  setTheme(next);
  toast("Theme changed: " + next);
});

$("themeSelect").addEventListener("change", event => {
  setTheme(event.target.value);
});

$("fontSize").addEventListener("change", event => {
  document.body.style.fontSize = event.target.value;
});

/* Fullscreen */
$("fullscreenBtn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (_) {
    toast("Fullscreen is not supported.");
  }
});

/* Chat interface */
function addMessage(text, role) {
  $("welcome").style.display = "none";

  const message = document.createElement("div");
  message.className = "message " + role;

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "K-ULTRA AI";

  const content = document.createElement("div");
  content.textContent = text;

  message.append(label, content);
  $("chatArea").appendChild(message);
  $("chatArea").scrollTop = $("chatArea").scrollHeight;
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("messageInput");
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  addMessage(
    "The AI backend is not connected yet. We will connect Gemini through your secure Cloudflare Worker in the next setup.",
    "assistant"
  );
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    $("messageInput").value = button.dataset.prompt;
    $("messageInput").focus();
  });
});

$("clearChat").addEventListener("click", () => {
  document.querySelectorAll("#chatArea .message").forEach(el => el.remove());
  $("welcome").style.display = "";
  toast("Chat cleared.");
});

/* Store */
function price(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function renderProducts() {
  const search = $("productSearch").value.trim().toLowerCase();

  const products = state.products.filter(product => {
    const categoryOK =
      state.category === "All" || product.category === state.category;

    const searchOK =
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    return categoryOK && searchOK;
  });

  const grid = $("productGrid");
  grid.replaceChildren();

  if (!products.length) {
    grid.textContent = "No products found.";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("div");
    image.className = "product-image";
    image.textContent = product.icon;

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const amount = document.createElement("div");
    amount.className = "product-price";
    amount.textContent = price(product.price);

    const button = document.createElement("button");
    button.className = "primary-btn";
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => addToCart(product.id));

    info.append(name, amount, button);
    card.append(image, info);
    grid.appendChild(card);
  });
}

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;

    document.querySelectorAll(".category").forEach(el => {
      el.classList.toggle("active", el === button);
    });

    renderProducts();
  });
});

$("productSearch").addEventListener("input", renderProducts);

function addToCart(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;

  const existing = state.cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  renderCart();
  toast("Product added to cart.");
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;

  const panel = $("cartPanel");
  panel.replaceChildren();

  const heading = document.createElement("h2");
  heading.textContent = "Your Cart";
  panel.appendChild(heading);

  if (!state.cart.length) {
    panel.appendChild(document.createTextNode("Your cart is empty."));
    return;
  }

  state.cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const text = document.createElement("p");
    text.textContent =
      `${item.name} × ${item.quantity} — ${price(item.price * item.quantity)}`;

    const remove = document.createElement("button");
    remove.className = "small-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.cart = state.cart.filter(product => product.id !== item.id);
      renderCart();
    });

    row.append(text, remove);
    panel.appendChild(row);
  });

  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const totalEl = document.createElement("h3");
  totalEl.textContent = "Total: " + price(total);
  panel.appendChild(totalEl);

  const checkout = document.createElement("button");
  checkout.className = "primary-btn";
  checkout.textContent = "Proceed to Checkout";
  checkout.addEventListener("click", () => {
    toast("Secure checkout and payment will be connected later.");
  });

  panel.appendChild(checkout);
}

$("cartBtn").addEventListener("click", () => {
  $("cartPanel").hidden = false;
  $("cartPanel").scrollIntoView({ behavior: "smooth" });
});

/* Code preview */
$("previewBtn").addEventListener("click", () => {
  $("codePreview").srcdoc = $("codeEditor").value;
});

/* Location */
$("locationBtn").addEventListener("click", () => {
  const output = $("locationResult");

  if (!navigator.geolocation) {
    output.textContent = "Geolocation is not supported.";
    return;
  }

  output.textContent = "Requesting location permission...";

  navigator.geolocation.getCurrentPosition(
    position => {
      output.textContent =
        "Latitude: " + position.coords.latitude.toFixed(6) +
        " | Longitude: " + position.coords.longitude.toFixed(6);
    },
    error => {
      const messages = {
        1: "Location permission denied.",
        2: "Location unavailable.",
        3: "Location request timed out."
      };
      output.textContent = messages[error.code] || "Location error.";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
});

/* File list */
$("fileInput").addEventListener("change", event => {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    $("fileResult").textContent = "No files selected.";
    return;
  }

  $("fileResult").textContent = files.map(file =>
    file.name + " — " + (file.size / 1024).toFixed(1) + " KB"
  ).join("\n");
});

/* Image preview */
$("imageInput").addEventListener("change", event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Please select an image file.");
    return;
  }

  const url = URL.createObjectURL(file);
  const preview = $("imagePreview");
  preview.replaceChildren();

  const image = document.createElement("img");
  image.src = url;
  image.alt = "Image preview";
  image.onload = () => URL.revokeObjectURL(url);

  preview.appendChild(image);
});

/* Download notes */
$("downloadNotes").addEventListener("click", () => {
  const blob = new Blob([$(
    "officeEditor"
  ).value], { type: "text/plain;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "K-ULTRA-notes.txt";
  link.click();

  URL.revokeObjectURL(url);
});

/* Attach */
$("attachBtn").addEventListener("click", () => {
  $("hiddenFileInput").click();
});

$("hiddenFileInput").addEventListener("change", event => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const names = files.map(file => file.name).join(", ");
  $("messageInput").value +=
    ($("messageInput").value ? "\n" : "") + "[Selected files: " + names;

  toast(files.length + " file(s) selected.");
});

/* Start */
try {
  setTheme(localStorage.getItem("kultra-theme") || "dark");
} catch (_) {
  setTheme("dark");
}

renderProducts();
renderCart();

console.log("K-ULTRA AI Version 252 loaded.");
    
