import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { useTranslationHook } from "../i18n";

const CaptureSectionScreenshot = () => {
  const captureRef = useRef(null);
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  const handleCaptureClick = () => {
    const targetNode = document.querySelector('#projects');
    if (targetNode) {
      captureScreenshot(targetNode);
    }
  };

  const captureScreenshot = (node) => {
    html2canvas(node).then(canvas => {
      const imgData = canvas.toDataURL('image/png');

      // Create a temporary "a" element to trigger the download
      const a = document.createElement('a');
      a.href = imgData;
      a.download = 'screenshot.png';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
      <button className="btn" onClick={handleCaptureClick} ref={captureRef}>{t("Screenshot")}</button>
  );
};

export default CaptureSectionScreenshot;
