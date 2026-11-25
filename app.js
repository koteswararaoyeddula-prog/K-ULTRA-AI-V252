
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  currentPage: "chat",
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

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* Navigation */
function openPage(page) {
  const target = $("page-" + page);

  if (!target) {
    showToast("This module is coming soon.");
    return;
  }

  state.currentPage = page;

  document.querySelectorAll(".page").forEach((el) => {
    el.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll(".nav-item[data-page]").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  const titles = {
    chat: "AI Chat",
    store: "K-ULTRA Store",
    developer: "Developer Studio",
    location: "Location & Maps",
    files: "File Tools",
    image: "Image Studio",
    office: "Office Tools",
    settings: "Settings"
  };

  $("pageTitle").textContent = titles[page] || page;
  $("sidebar").classList.remove("open");
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* Theme */
const themes = ["dark", "light", "blue", "purple", "green"];

function setTheme(theme) {
  if (!themes.includes(theme)) theme = "dark";

  document.body.classList.remove(
    "theme-light",
    "theme-blue",
    "theme-purple",
    "theme-green"
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
  const current = themes.find((theme) =>
    document.body.classList.contains("theme-" + theme)
  ) || "dark";

  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  setTheme(next);
  showToast("Theme: " + next);
});

$("themeSelect").addEventListener("change", (event) => {
  setTheme(event.target.value);
});

$("fontSize").addEventListener("change", (event) => {
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
    showToast("Fullscreen is not supported here.");
  }
});

/* Chat UI */
function addMessage(text, role) {
  const welcome = $("welcome");
  if (welcome) welcome.style.display = "none";

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

$("chatForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const input = $("messageInput");
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  addMessage(
    "AI backend is not connected yet. In the next setup step, we will connect this chat securely to your Cloudflare Worker and Gemini API.",
    "assistant"
  );
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    $("messageInput").value = button.dataset.prompt;
    $("messageInput").focus();
  });
});

$("clearChat").addEventListener("click", () => {
  $("chatArea").innerHTML = "";
  $("chatArea").appendChild($("welcome"));
  $("welcome").style.display = "";
  showToast("Current chat cleared.");
});

/* Store */
function formatPrice(price) {
  return "₹" + Number(price).toLocaleString("en-IN");
}

function renderProducts() {
  const search = $("productSearch").value.trim().toLowerCase();

  const filtered = state.products.filter((product) => {
    const categoryMatch =
      state.category === "All" || product.category === state.category;

    const searchMatch =
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    return categoryMatch && searchMatch;
  });

  const grid = $("productGrid");
  grid.innerHTML = "";

  if (!filtered.length) {
    grid.textContent = "No products found.";
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("div");
    image.className = "product-image";
    image.textContent = product.icon;

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);

    const add = document.createElement("button");
    add.className = "primary-btn";
    add.textContent = "Add to Cart";
    add.addEventListener("click", () => addToCart(product.id));

    info.append(name, price, add);
    card.append(image, info);
    grid.appendChild(card);
  });
}

document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;

    document.querySelectorAll(".category").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    renderProducts();
  });
});

$("productSearch").addEventListener("input", renderProducts);

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  renderCart();
  showToast("Added to cart.");
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;

  const panel = $("cartPanel");
  panel.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Your Cart";
  panel.appendChild(heading);

  if (!state.cart.length) {
    panel.appendChild(document.createTextNode("Your cart is empty."));
    return;
  }

  state.cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const text = document.createElement("p");
    text.textContent =
      `${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`;

    const remove = document.createElement("button");
    remove.className = "tool-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.cart = state.cart.filter((product) => product.id !== item.id);
      renderCart();
    });

    row.append(text, remove);
    panel.appendChild(row);
  });

  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalLine = document.createElement("h3");
  totalLine.textContent = "Total: " + formatPrice(total);
  panel.appendChild(totalLine);

  const checkout = document.createElement("button");
  checkout.className = "primary-btn";
  checkout.textContent = "Proceed to Checkout";
  checkout.addEventListener("click", () => {
    showToast("Secure checkout will be connected in the payment setup.");
  });

  panel.appendChild(checkout);
}

$("cartBtn").addEventListener("click", () => {
  $("cartPanel").hidden = false;
  $("cartPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* Code preview */
$("previewBtn").addEventListener("click", () => {
  const code = $("codeEditor").value;
  $("codePreview").srcdoc = code;
});

/* Location */
$("locationBtn").addEventListener("click", () => {
  const result = $("locationResult");

  if (!navigator.geolocation) {
    result.textContent = "Geolocation is not supported by this browser.";
    return;
  }

  result.textContent = "Requesting location permission...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      result.textContent =
        `Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(6)}`;
    },
    (error) => {
      const messages = {
        1: "Location permission was denied.",
        2: "Your location could not be determined.",
        3: "Location request timed out."
      };

      result.textContent = messages[error.code] || "Location error.";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    }
  );
});

/* File information */
$("fileInput").addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);

  if (!files.length) {
    $("fileResult").textContent = "No files selected.";
    return;
  }

  $("fileResult").textContent = files.map((file) => {
    return `${file.name} — ${(file.size / 1024).toFixed(1)} KB`;
  }).join("\n");
});

/* Image preview */
$("imageInput").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image.");
    return;
  }

  const url = URL.createObjectURL(file);
  const preview = $("imagePreview");
  preview.innerHTML = "";

  const image = document.createElement("img");
  image.src = url;
  image.alt = "Uploaded image preview";

  image.onload = () => URL.revokeObjectURL(url);
  preview.appendChild(image);
});

/* Download notes */
$("downloadNotes").addEventListener("click", () => {
  const text = $("officeEditor").value;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "K-ULTRA-notes.txt";
  link.click();

  URL.revokeObjectURL(url);
});

/* Attach file */
$("attachBtn").addEventListener("click", () => {
  $("hiddenFileInput").click();
});

$("hiddenFileInput").addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const names = files.map((file) => file.name).join(", ");
  $("messageInput").value +=
    ($("messageInput").value ? "\n" : "") + "[Selected files: " + names + "]";

  showToast(files.length + " file(s) selected.");
});

/* Initial setup */
try {
  const savedTheme = localStorage.getItem("kultra-theme") || "dark";
  setTheme(savedTheme);
} catch (_) {
  setTheme("dark");
}

renderProducts();
renderCart();

console.log("K-ULTRA AI Version 252 interface loaded.");
