import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslationHook } from '../i18n';
import '../styles/ModuleSelection.css';

function ModuleSelection({ role, country, setIsLoggedIn, setRole, setCountry }) {
  const navigate = useNavigate();
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  const handleModule1Click = () => {
    // Navigate to Questionnaire.js, passing role and country
    // The role from props should be 'master'
    navigate(`/questionnaire/${role}`, { state: { role, country } });
  };

  const handleModule2Click = () => {
    // Navigate to Dashboard2.js, passing role and country
    navigate('/dashboard2', { state: { role, country } });
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('country');

    if (setIsLoggedIn) setIsLoggedIn(false);
    if (setRole) setRole(null);
    if (setCountry) setCountry(null);

    navigate('/login');
  };

  return (
    <div className="module-selection-container">
      <div className="module-selection-header">
        <h2>{t("SelectModule")}</h2>
        <div className="header-actions">
          <div className="language-switch">
            <ul className="nav nav-lang justify-content-end mb-0">
              <li className="nav-item">
                <button
                  className={`nav-link ${selectedLanguage === 'fr' ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange("fr")}
                >
                  FR
                </button>
              </li>
              <li className="nav-item">|</li>
              <li className="nav-item">
                <button
                  className={`nav-link ${selectedLanguage === 'en' ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange("en")}
                >
                  EN
                </button>
              </li>
            </ul>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            {t("Logout")}
          </button>
        </div>
      </div>
      <div className="module-selection-content">
        <p className="module-selection-description">
          {t("SelectModuleDescription")}
        </p>
        <div className="module-buttons">
          <button onClick={handleModule1Click} className="module-button module-button-1">
            <div className="module-button-content">
              <span className="module-number">{t("Module1")}</span>
              <span className="module-title">{t("Module1Title")}</span>
            </div>
          </button>
          <button onClick={handleModule2Click} className="module-button module-button-2">
            <div className="module-button-content">
              <span className="module-number">{t("Module2")}</span>
              <span className="module-title">{t("Module2Title")}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleSelection;
