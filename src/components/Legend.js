import React from "react";
import "../styles/Legend.css";
import logoCadre from "../assets/img/logo_cadre.png";
import { useTranslationHook } from "../i18n";

function Legend({ displayCompare }) {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  const layers = [
    "Phase 1",
    "Phase 2",
    "Phase 3",
    "Phase 4",
    "Phase 5",
    t("No data"),
  ];
  const colors = [
    "#d3f3d4",
    "#ffe252",
    "#fa890f",
    "#eb3333",
    "#900101e3",
    "#ffffff",
  ];
  const layersCompare = ["Improving", "Same", "Deteriorating", t("No data")];
  const colorsCompare = ["#d3f3d4", "#ffe252", "#fa890f", "#ffffff"];

  return (
    <nav className="legend">
      <div className="legend-container">
        <li className="list-inline-item">
          <img src={logoCadre} alt="" />
        </li>
        {displayCompare === "single"
          ? layers.map((layer, i) => (
              <div key={i} className="legend-item">
                <span
                  className="legend-key"
                  style={{ backgroundColor: colors[i] }}
                />
                <span className="legend-value">{layer}</span>
              </div>
            ))
          : layersCompare.map((layer, i) => (
              <div key={i} className="legend-item">
                <span
                  className="legend-key"
                  style={{ backgroundColor: colorsCompare[i] }}
                />
                <span className="legend-value">{layer}</span>
              </div>
            ))}

        <div className="legend-item">
          <img
            className="legend-image"
            src={process.env.PUBLIC_URL + "/images/stripes2.jpg"}
            alt="stripes"
          />
          <span className="legend-value"> {t("Inaccessible Zone")}</span>
        </div>
      </div>
    </nav>
  );
}

export default Legend;
