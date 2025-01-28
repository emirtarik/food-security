import React, { useEffect } from 'react';
import { useTranslationHook } from '../i18n';
import popupData from '../data/popupData.json';
import '../styles/Popup.css';

const Popup = ({ onClose }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

    // Determine the content to display based on the current language
    const popupContent = currentLanguage === 'fr' ? popupData.popup.fr : popupData.popup.en;
  

  const renderContentWithLineBreaks = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <img src={popupContent.img} alt={popupContent.title} />
        <h2>{popupContent.title}</h2>
        <div>{renderContentWithLineBreaks(popupContent.content)}</div>
        <button className="popup-close-button" onClick={onClose}>{t("close")}</button>
      </div>
    </div>
  );
};

export default Popup;