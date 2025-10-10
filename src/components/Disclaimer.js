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
      <p className="disclaimer-content text-justify">
        {t("Disclaimer").split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
            {index < t("Disclaimer").split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
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
