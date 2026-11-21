
/*
 * K-ULTRA AI — VERSION 252
 * FILE: js/i18n.js
 * Internationalization and Language Manager
 */

import "./config.js";

(() => {
  "use strict";

  const CONFIG = window.KULTRA_CONFIG || {};

  const STORAGE_KEY =
    CONFIG.STORAGE?.LANGUAGE || "kultra_language";

  const DEFAULT_LANGUAGE =
    CONFIG.APP?.DEFAULT_LANGUAGE || "en";

  const translations = {
    en: {
      home: "Home",
      dashboard: "Dashboard",
      discover: "Discover",
      aiChat: "AI Chat",
      modelHub: "AI Model Hub",
      imageAI: "Image AI",
      voiceAI: "Voice AI",
      research: "Research",
      agents: "AI Agents",
      documents: "Documents",
      codeStudio: "Code Studio",
      playground: "Code Playground",
      websiteBuilder: "Website Builder",
      developerTools: "Developer Tools",
      database: "Database",
      security: "Security Center",
      store: "AI Store",
      marketplace: "Marketplace",
      seller: "Seller Center",
      orders: "Orders",
      learning: "Learning Center",
      courses: "Courses",
      projects: "Projects",
      career: "Career Center",
      cloud: "Cloud Workspace",
      files: "File Manager",
      tasks: "Tasks",
      calendar: "Calendar",
      team: "Team Workspace",
      community: "Community",
      utilities: "Utilities",
      analytics: "Analytics",
      settings: "Settings",
      help: "Help Center",
      plans: "Plans",
      profile: "My Profile",
      search: "Search",
      searchPlaceholder: "Search anything...",
      welcome: "Welcome to K-ULTRA AI",
      welcomeDescription: "Your all-in-one AI and productivity workspace.",
      getStarted: "Get Started",
      login: "Login",
      signup: "Create Account",
      logout: "Logout",
      email: "Email Address",
      password: "Password",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      loading: "Loading...",
      notifications: "Notifications",
      theme: "Theme",
      language: "Language",
      connected: "Connected",
      disconnected: "Disconnected",
      backendUnavailable: "Backend unavailable",
      comingSoon: "Coming soon",
      send: "Send",
      messagePlaceholder: "Type your message...",
      settingsDescription: "Customize your K-ULTRA AI experience."
    },

    te: {
      home: "హోమ్",
      dashboard: "డాష్‌బోర్డ్",
      discover: "అన్వేషించండి",
      aiChat: "AI చాట్",
      modelHub: "AI మోడల్ హబ్",
      imageAI: "చిత్రాల AI",
      voiceAI: "వాయిస్ AI",
      research: "పరిశోధన",
      agents: "AI ఏజెంట్లు",
      documents: "డాక్యుమెంట్లు",
      codeStudio: "కోడ్ స్టూడియో",
      playground: "కోడ్ ప్లేగ్రౌండ్",
      websiteBuilder: "వెబ్‌సైట్ బిల్డర్",
      developerTools: "డెవలపర్ టూల్స్",
      database: "డేటాబేస్",
      security: "భద్రతా కేంద్రం",
      store: "AI స్టోర్",
      marketplace: "మార్కెట్‌ప్లేస్",
      seller: "విక్రేత కేంద్రం",
      orders: "ఆర్డర్లు",
      learning: "అభ్యాస కేంద్రం",
      courses: "కోర్సులు",
      projects: "ప్రాజెక్టులు",
      career: "కెరీర్ కేంద్రం",
      cloud: "క్లౌడ్ వర్క్‌స్పేస్",
      files: "ఫైల్ మేనేజర్",
      tasks: "పనులు",
      calendar: "క్యాలెండర్",
      team: "టీమ్ వర్క్‌స్పేస్",
      community: "కమ్యూనిటీ",
      utilities: "ఉపయోగకరమైన టూల్స్",
      analytics: "విశ్లేషణలు",
      settings: "సెట్టింగ్స్",
      help: "సహాయ కేంద్రం",
      plans: "ప్లాన్లు",
      profile: "నా ప్రొఫైల్",
      search: "వెతకండి",
      searchPlaceholder: "ఏదైనా వెతకండి...",
      welcome: "K-ULTRA AIకి స్వాగతం",
      welcomeDescription: "మీ AI మరియు ఉత్పాదకత కోసం ఒకే వేదిక.",
      getStarted: "ప్రారంభించండి",
      login: "లాగిన్",
      signup: "ఖాతా సృష్టించండి",
      logout: "లాగౌట్",
      email: "ఈమెయిల్ చిరునామా",
      password: "పాస్‌వర్డ్",
      save: "సేవ్ చేయండి",
      cancel: "రద్దు చేయండి",
      close: "మూసివేయండి",
      loading: "లోడ్ అవుతోంది...",
      notifications: "నోటిఫికేషన్లు",
      theme: "థీమ్",
      language: "భాష",
      connected: "కనెక్ట్ అయింది",
      disconnected: "కనెక్ట్ కాలేదు",
      backendUnavailable: "బ్యాకెండ్ అందుబాటులో లేదు",
      comingSoon: "త్వరలో అందుబాటులోకి వస్తుంది",
      send: "పంపండి",
      messagePlaceholder: "మీ సందేశాన్ని టైప్ చేయండి...",
      settingsDescription: "K-ULTRA AIని మీకు నచ్చిన విధంగా మార్చుకోండి."
    },

    hi: {
      home: "होम",
      dashboard: "डैशबोर्ड",
      discover: "खोजें",
      aiChat: "AI चैट",
      modelHub: "AI मॉडल हब",
      imageAI: "इमेज AI",
      voiceAI: "वॉइस AI",
      research: "अनुसंधान",
      agents: "AI एजेंट",
      documents: "दस्तावेज़",
      codeStudio: "कोड स्टूडियो",
      playground: "कोड प्लेग्राउंड",
      websiteBuilder: "वेबसाइट बिल्डर",
      developerTools: "डेवलपर टूल्स",
      database: "डेटाबेस",
      security: "सुरक्षा केंद्र",
      store: "AI स्टोर",
      marketplace: "मार्केटप्लेस",
      seller: "विक्रेता केंद्र",
      orders: "ऑर्डर",
      learning: "लर्निंग सेंटर",
      courses: "कोर्स",
      projects: "प्रोजेक्ट",
      career: "करियर सेंटर",
      cloud: "क्लाउड वर्कस्पेस",
      files: "फ़ाइल मैनेजर",
      tasks: "कार्य",
      calendar: "कैलेंडर",
      team: "टीम वर्कस्पेस",
      community: "कम्युनिटी",
      utilities: "उपयोगी टूल्स",
      analytics: "एनालिटिक्स",
      settings: "सेटिंग्स",
      help: "सहायता केंद्र",
      plans: "प्लान",
      profile: "मेरी प्रोफ़ाइल",
      search: "खोजें",
      searchPlaceholder: "कुछ भी खोजें...",
      welcome: "K-ULTRA AI में आपका स्वागत है",
      welcomeDescription: "आपका AI और उत्पादकता वर्कस्पेस।",
      getStarted: "शुरू करें",
      login: "लॉगिन",
      signup: "खाता बनाएँ",
      logout: "लॉगआउट",
      email: "ईमेल पता",
      password: "पासवर्ड",
      save: "सहेजें",
      cancel: "रद्द करें",
      close: "बंद करें",
      loading: "लोड हो रहा है...",
      notifications: "सूचनाएँ",
      theme: "थीम",
      language: "भाषा",
      connected: "कनेक्टेड",
      disconnected: "डिस्कनेक्टेड",
      backendUnavailable: "बैकएंड उपलब्ध नहीं है",
      comingSoon: "जल्द आ रहा है",
      send: "भेजें",
      messagePlaceholder: "अपना संदेश लिखें...",
      settingsDescription: "अपने K-ULTRA AI अनुभव को अनुकूलित करें।"
    }
  };

  const languageNames = {
    en: "English",
    te: "తెలుగు",
    hi: "हिन्दी",
    ta: "தமிழ்",
    kn: "ಕನ್ನಡ",
    ml: "മലയാളം",
    bn: "বাংলা",
    mr: "मराठी",
    gu: "ગુજરાતી",
    pa: "ਪੰਜਾਬੀ",
    ur: "اردو",
    ar: "العربية",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    pt: "Português",
    it: "Italiano",
    ru: "Русский",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
    id: "Bahasa Indonesia",
    tr: "Türkçe",
    th: "ไทย",
    vi: "Tiếng Việt"
  };

  let currentLanguage = DEFAULT_LANGUAGE;

  // -----------------------------------------
  // LANGUAGE HELPERS
  // -----------------------------------------

  function getAvailableLanguages() {
    return Object.entries(languageNames).map(([code, name]) => ({
      code,
      name,
      translated: Boolean(translations[code])
    }));
  }

  function getLanguage() {
    return currentLanguage;
  }

  function getLanguageName(code = currentLanguage) {
    return languageNames[code] || code;
  }

  function translate(key, fallback = key) {
    const languageDictionary =
      translations[currentLanguage] || translations.en;

    return languageDictionary[key] ??
      translations.en[key] ??
      fallback;
  }

  // -----------------------------------------
  // APPLY TRANSLATIONS TO THE PAGE
  // -----------------------------------------

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;

      if (!key) return;

      const translated = translate(key, element.textContent);

      element.textContent = translated;
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
      const key = element.dataset.i18nPlaceholder;

      if (!key) return;

      element.setAttribute(
        "placeholder",
        translate(key, element.getAttribute("placeholder") || "")
      );
    });

    root.querySelectorAll("[data-i18n-title]").forEach(element => {
      const key = element.dataset.i18nTitle;

      if (!key) return;

      element.setAttribute("title", translate(key));
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
      const key = element.dataset.i18nAriaLabel;

      if (!key) return;

      element.setAttribute("aria-label", translate(key));
    });

    document.documentElement.lang = currentLanguage;

    document.documentElement.dir =
      ["ar", "ur"].includes(currentLanguage) ? "rtl" : "ltr";

    document.dispatchEvent(
      new CustomEvent("kultra:language-applied", {
        detail: { language: currentLanguage }
      })
    );
  }

  // -----------------------------------------
  // CHANGE LANGUAGE
  // -----------------------------------------

  function setLanguage(languageCode) {
    const code = String(languageCode || "").toLowerCase();

    if (!languageNames[code]) {
      throw new Error(`Unsupported language: ${code}`);
    }

    currentLanguage = code;

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (error) {
      console.warn("Could not save language preference:", error);
    }

    applyTranslations();

    document.dispatchEvent(
      new CustomEvent("kultra:languagechange", {
        detail: {
          language: code,
          languageName: getLanguageName(code)
        }
      })
    );

    return code;
  }

  // -----------------------------------------
  // LOAD SAVED LANGUAGE
  // -----------------------------------------

  function initialize() {
    let savedLanguage = null;

    try {
      savedLanguage = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not load saved language:", error);
    }

    const initialLanguage =
      savedLanguage && languageNames[savedLanguage]
        ? savedLanguage
        : languageNames[DEFAULT_LANGUAGE]
          ? DEFAULT_LANGUAGE
          : "en";

    currentLanguage = initialLanguage;

    applyTranslations();

    console.info(
      `K-ULTRA language system initialized: ${currentLanguage}`
    );
  }

  // -----------------------------------------
  // LANGUAGE SELECTOR
  // -----------------------------------------

  function createLanguageSelector(container) {
    if (!container) {
      throw new Error("Language selector container was not found.");
    }

    const label = document.createElement("label");
    label.textContent = "Language";

    const select = document.createElement("select");
    select.id = "kultraLanguageSelect";
    select.setAttribute("aria-label", "Select application language");

    getAvailableLanguages().forEach(language => {
      const option = document.createElement("option");

      option.value = language.code;
      option.textContent = language.translated
        ? language.name
        : `${language.name} (translation pending)`;

      option.selected = language.code === currentLanguage;

      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      setLanguage(select.value);
    });

    label.htmlFor = select.id;

    container.append(label, select);

    return select;
  }

  // -----------------------------------------
  // PUBLIC LANGUAGE API
  // -----------------------------------------

  const I18N = {
    translations,
    languageNames,
    getLanguage,
    getLanguageName,
    getAvailableLanguages,
    translate,
    setLanguage,
    applyTranslations,
    createLanguageSelector,
    initialize
  };

  window.KULTRA = window.KULTRA || {};
  window.KULTRA.i18n = I18N;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }

  console.info("K-ULTRA AI i18n module loaded.");

})();
      
