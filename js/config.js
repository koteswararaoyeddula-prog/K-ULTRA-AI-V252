
/* ============================================================
   K-ULTRA AI — VERSION 252.0
   FILE: js/config.js
   CENTRAL APPLICATION CONFIGURATION
   ============================================================ */

"use strict";

window.KULTRA_CONFIG = Object.freeze({

  APP: {
    NAME: "K-ULTRA AI",
    VERSION: "252.0",
    EDITION: "ULTIMATE COMPLETE EDITION",
    DESCRIPTION: "All-in-One AI and Technology Platform",
    AUTHOR: "K-ULTRA AI",
    DEFAULT_LANGUAGE: "en",
    DEFAULT_THEME: "midnight",
    ENVIRONMENT: "production",
    DEBUG: false
  },

  URLS: {
    WORKER: "https://YOUR-CLOUDFLARE-WORKER-URL",
    API_BASE: "https://YOUR-CLOUDFLARE-WORKER-URL/api"
  },

  API: {
    TIMEOUT: 60000,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1500,

    ENDPOINTS: {
      HEALTH: "/health",
      CHAT: "/api/chat",
      IMAGE: "/api/image",
      VOICE: "/api/voice",
      SEARCH: "/api/search",
      RESEARCH: "/api/research",
      ANALYZE: "/api/analyze",
      AGENT: "/api/agent",
      TRANSLATE: "/api/translate",
      DOCUMENT: "/api/document"
    }
  },

  AI: {
    DEFAULT_PROVIDER: "gemini",
    DEFAULT_MODEL: "gemini-2.5-flash",
    STREAMING: true,
    MAX_MESSAGE_LENGTH: 12000,
    MAX_HISTORY: 30,
    TEMPERATURE: 0.7,

    PROVIDERS: {
      GEMINI: {
        NAME: "Google Gemini",
        ENABLED: true,
        MODEL: "gemini-2.5-flash",
        KEY_LOCATION: "CLOUDFLARE_SECRET"
      },

      OPENAI: {
        NAME: "OpenAI",
        ENABLED: false,
        MODEL: "",
        KEY_LOCATION: "CLOUDFLARE_SECRET"
      },

      ANTHROPIC: {
        NAME: "Anthropic Claude",
        ENABLED: false,
        MODEL: "",
        KEY_LOCATION: "CLOUDFLARE_SECRET"
      },

      CLOUDFLARE: {
        NAME: "Cloudflare Workers AI",
        ENABLED: false,
        MODEL: "",
        BINDING: "AI"
      }
    }
  },

  FIREBASE: {
    ENABLED: true,

    // Add your Firebase web configuration here.
    // Firebase API key is a client configuration value.
    // Secure access with Firebase Authentication and Rules.

    CONFIG: {
      apiKey: "YOUR_FIREBASE_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_FIREBASE_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.firebasestorage.app",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_FIREBASE_APP_ID"
    },

    AUTH: {
      EMAIL_LOGIN: true,
      GOOGLE_LOGIN: true,
      ANONYMOUS_LOGIN: false
    }
  },

  FEATURES: {
    AI_CHAT: true,
    AI_MODEL_HUB: true,
    IMAGE_GENERATION: true,
    VOICE_STUDIO: true,
    WEB_RESEARCH: true,
    AI_AGENTS: true,
    DOCUMENT_AI: true,

    CODE_STUDIO: true,
    CODE_PLAYGROUND: true,
    WEBSITE_BUILDER: true,
    API_TESTER: true,
    GITHUB_WORKSPACE: true,
    DATABASE_STUDIO: true,

    ECOMMERCE: true,
    MARKETPLACE: true,
    SELLER_CENTER: true,
    ORDER_MANAGEMENT: true,

    EDUCATION: true,
    COURSES: true,
    STUDENT_PROJECTS: true,
    CAREER_CENTER: true,

    CLOUD_STORAGE: true,
    FILE_MANAGER: true,
    DOCUMENT_EDITOR: true,
    TASK_MANAGER: true,
    CALENDAR: true,
    TEAM_WORKSPACE: true,

    COMMUNITY: true,
    SMART_UTILITIES: true,
    ANALYTICS: true,
    ADMIN_PANEL: true
  },

  THEMES: [
    { id: "midnight", name: "Midnight", type: "dark" },
    { id: "amoled", name: "AMOLED Black", type: "dark" },
    { id: "cyberpunk", name: "Cyberpunk", type: "dark" },
    { id: "ocean", name: "Ocean Blue", type: "dark" },
    { id: "royal", name: "Royal Purple", type: "dark" },
    { id: "forest", name: "Forest Green", type: "dark" },
    { id: "sunset", name: "Sunset", type: "dark" },
    { id: "light", name: "Light", type: "light" },
    { id: "rose", name: "Rose", type: "dark" },
    { id: "graphite", name: "Graphite", type: "dark" },
    { id: "solar", name: "Solar Gold", type: "dark" },
    { id: "matrix", name: "Neon Matrix", type: "dark" }
  ],

  LANGUAGES: [
    { id: "en", name: "English", native: "English" },
    { id: "te", name: "Telugu", native: "తెలుగు" },
    { id: "hi", name: "Hindi", native: "हिन्दी" },
    { id: "ta", name: "Tamil", native: "தமிழ்" },
    { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { id: "ml", name: "Malayalam", native: "മലയാളം" },
    { id: "bn", name: "Bengali", native: "বাংলা" },
    { id: "mr", name: "Marathi", native: "मराठी" },
    { id: "gu", name: "Gujarati", native: "ગુજરાતી" },
    { id: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { id: "ur", name: "Urdu", native: "اردو" },
    { id: "ar", name: "Arabic", native: "العربية" },
    { id: "fr", name: "French", native: "Français" },
    { id: "de", name: "German", native: "Deutsch" },
    { id: "es", name: "Spanish", native: "Español" },
    { id: "pt", name: "Portuguese", native: "Português" },
    { id: "it", name: "Italian", native: "Italiano" },
    { id: "ru", name: "Russian", native: "Русский" },
    { id: "ja", name: "Japanese", native: "日本語" },
    { id: "ko", name: "Korean", native: "한국어" },
    { id: "zh", name: "Chinese", native: "中文" },
    { id: "id", name: "Indonesian", native: "Bahasa Indonesia" },
    { id: "tr", name: "Turkish", native: "Türkçe" },
    { id: "th", name: "Thai", native: "ไทย" },
    { id: "vi", name: "Vietnamese", native: "Tiếng Việt" }
  ],

  PROGRAMMING_LANGUAGES: [
    { id: "html", name: "HTML", extension: "html" },
    { id: "css", name: "CSS", extension: "css" },
    { id: "javascript", name: "JavaScript", extension: "js" },
    { id: "typescript", name: "TypeScript", extension: "ts" },
    { id: "python", name: "Python", extension: "py" },
    { id: "java", name: "Java", extension: "java" },
    { id: "c", name: "C", extension: "c" },
    { id: "cpp", name: "C++", extension: "cpp" },
    { id: "csharp", name: "C#", extension: "cs" },
    { id: "php", name: "PHP", extension: "php" },
    { id: "go", name: "Go", extension: "go" },
    { id: "rust", name: "Rust", extension: "rs" },
    { id: "ruby", name: "Ruby", extension: "rb" },
    { id: "swift", name: "Swift", extension: "swift" },
    { id: "kotlin", name: "Kotlin", extension: "kt" },
    { id: "dart", name: "Dart", extension: "dart" },
    { id: "sql", name: "SQL", extension: "sql" },
    { id: "r", name: "R", extension: "r" },
    { id: "scala", name: "Scala", extension: "scala" },
    { id: "perl", name: "Perl", extension: "pl" },
    { id: "lua", name: "Lua", extension: "lua" },
    { id: "bash", name: "Bash", extension: "sh" },
    { id: "powershell", name: "PowerShell", extension: "ps1" },
    { id: "matlab", name: "MATLAB", extension: "m" },
    { id: "assembly", name: "Assembly", extension: "asm" },
    { id: "solidity", name: "Solidity", extension: "sol" },
    { id: "elixir", name: "Elixir", extension: "ex" },
    { id: "haskell", name: "Haskell", extension: "hs" },
    { id: "objective-c", name: "Objective-C", extension: "m" },
    { id: "graphql", name: "GraphQL", extension: "graphql" }
  ],

  SECURITY: {
    USE_HTTPS: true,
    STORE_API_KEYS_IN_BROWSER: false,
    REQUIRE_AUTH: true,
    SANITIZE_USER_INPUT: true,
    MAX_UPLOAD_SIZE_MB: 20,
    ALLOW_UNTRUSTED_HTML: false
  },

  STORAGE: {
    CHAT_HISTORY_KEY: "kultra_chat_history",
    THEME_KEY: "kultra_theme",
    LANGUAGE_KEY: "kultra_language",
    SETTINGS_KEY: "kultra_settings"
  },

  LIMITS: {
    MAX_UPLOADS: 5,
    MAX_HISTORY: 30,
    MAX_SEARCH_RESULTS: 20,
    REQUEST_TIMEOUT: 60000
  },

  PWA: {
    ENABLED: true,
    SERVICE_WORKER: "sw.js"
  }

});
     
