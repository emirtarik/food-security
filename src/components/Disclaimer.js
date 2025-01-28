// src/components/Disclaimer.js
import React from "react";
import PropTypes from "prop-types";
import { useTranslationHook } from "../i18n";
import "../styles/Disclaimer.css"; // Import the Disclaimer.css file for custom styles

export default function Disclaimer({ isProject }) {
  const { t } = useTranslationHook("misc");

  return (
    <div className="disclaimer-container mt-4">
      {isProject && (
        <p className="disclaimer-text">
          {t("Disclaimer Tool")}{" "}
          <a
            href="https://www.oecd.org/swac"
            target="_blank"
            rel="noopener noreferrer"
            className="disclaimer-link"
          >
            (CSAO/OCDE)
          </a>
        </p>
      )}
      <p className="disclaimer-content text-center">
        {t("Disclaimer")}
      </p>
    </div>
  );
}

Disclaimer.propTypes = {
  isProject: PropTypes.bool,
};

Disclaimer.defaultProps = {
  isProject: false,
};
