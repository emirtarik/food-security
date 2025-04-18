import i18n from "i18next";
import { useState, useEffect } from "react";
import { initReactI18next, useTranslation } from "react-i18next";

// Load your resources
const resources = {
  en: {
    misc: require("./data/locales/en/misc.json"),
    slideDataLeft: require("./data/locales/en/slideDataLeft.json"),
    slideDataRight: require("./data/locales/en/slideDataRight.json"),
    analysis: require("./data/locales/en/analysis.json") // new analysis namespace for EN
  },
  fr: {
    misc: require("./data/locales/fr/misc.json"),
    slideDataLeft: require("./data/locales/fr/slideDataLeft.json"),
    slideDataRight: require("./data/locales/fr/slideDataRight.json"),
    analysis: require("./data/locales/fr/analysis.json") // new analysis namespace for FR
  },
};

const storedLanguage = localStorage.getItem("language") || "fr";

// Initialize `i18next` with your resources and settings
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: storedLanguage, // Use stored language as initial value
    fallbackLng: "fr", // Fallback language
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
  });

export default i18n;

// Updated translation hook
export function useTranslationHook(namespace) {
  const { t, i18n } = useTranslation(namespace);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("language") || i18n.language
  );

  useEffect(() => {
    // Function to update state when the language changes globally
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
      localStorage.setItem("language", lng);
      console.log("Language changed to:", lng);
    };

    // Attach event listener for language changes
    i18n.on("languageChanged", handleLanguageChange);

    // Cleanup event listener on component unmount
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  // Function to explicitly change the language
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return { t, currentLanguage, changeLanguage };
}
