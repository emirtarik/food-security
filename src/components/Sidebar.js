import React, { useState, useEffect } from "react";
import { useTranslationHook } from "../i18n";
import "../styles/Sidebar.css";

function Sidebar({
  children,
  countryData,
  level1Data,
  level2Data,
  regionInfo,
  selectedYear,
  selectedMonth,
  displayCompare,
  // need to add comparison function
}) {
  // REGIONINFO TRAE EL KEY
  const [appendedData, setAppendedData] = useState([]);
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  useEffect(() => {
    if (countryData && level1Data && level2Data) {
      // Additional check to ensure data is fully loaded
      const countryDataFeatures = countryData.features || [];
      const level1DataFeatures = level1Data.features || [];
      const level2DataFeatures = level2Data.features || [];

      // Ensure all data arrays are non-empty
      if (
        countryDataFeatures.length > 0 &&
        level1DataFeatures.length > 0 &&
        level2DataFeatures.length > 0
      ) {
        const mergedData = [
          ...countryDataFeatures,
          ...level1DataFeatures,
          ...level2DataFeatures,
        ];
        setAppendedData(mergedData);
      }
    }
  }, [regionInfo, countryData, level1Data, level2Data]);


  // Initialize variables for region information
  let Name = "";
  let Population = "";
  let Phase1 = "";
  let Percent1 = "";
  let Phase2 = "";
  let Percent2 = "";
  let Phase3 = "";
  let Percent3 = "";
  let Phase4 = "";
  let Percent4 = "";
  let Phase5 = "";
  let Percent5 = "";

  if (regionInfo) {
    const clickedKey = regionInfo.key;

    let foundRow = null;
    if (appendedData) {
      foundRow = appendedData.find(
        (feature) => feature.properties.Key === clickedKey
      );
    }

    const properties = foundRow ? foundRow.properties : {};
    let month;
    if (selectedMonth === 11) {
      month = "11";
    } else {
      month = `0${selectedMonth}`;
    }
    Name =
      properties["Name_2"] !== "0"
        ? properties["Name_2"]
        : properties["Name_1"];
    if (Name !== undefined) {
      Name = Name.replace(/(?<=[a-z])(?=[A-Z])/g, " "); // split Name with space using regex pattern
    }
    Population = formatNumber(properties[`POP-${selectedYear}-${month}`]);
    Phase1 = formatNumber(properties[`PH1-${selectedYear}-${month}`]);
    Percent1 = calculatePercentage(
      parseFloat(properties[`PH1-${selectedYear}-${month}`]),
      parseFloat(properties[`POP-${selectedYear}-${month}`])
    );
    Phase2 = formatNumber(properties[`PH2-${selectedYear}-${month}`]);
    Percent2 = calculatePercentage(
      parseFloat(properties[`PH2-${selectedYear}-${month}`]),
      parseFloat(properties[`POP-${selectedYear}-${month}`])
    );
    Phase3 = formatNumber(properties[`PH3-${selectedYear}-${month}`]);
    Percent3 = calculatePercentage(
      parseFloat(properties[`PH3-${selectedYear}-${month}`]),
      parseFloat(properties[`POP-${selectedYear}-${month}`])
    );
    Phase4 = formatNumber(properties[`PH4-${selectedYear}-${month}`]);
    Percent4 = calculatePercentage(
      parseFloat(properties[`PH4-${selectedYear}-${month}`]),
      parseFloat(properties[`POP-${selectedYear}-${month}`])
    );
    Phase5 = formatNumber(properties[`PH5-${selectedYear}-${month}`]);
    Percent5 = calculatePercentage(
      parseFloat(properties[`PH5-${selectedYear}-${month}`]),
      parseFloat(properties[`POP-${selectedYear}-${month}`])
    );
  }

  const regionPhaseData = [
    {
      total: Phase1,
      percent: Percent1,
    },
    {
      total: Phase2,
      percent: Percent2,
    },
    {
      total: Phase3,
      percent: Percent3,
    },
    {
      total: Phase4,
      percent: Percent4,
    },
    {
      total: Phase5,
      percent: Percent5,
    },
  ];

  // Calculate total values for Phase 1 to Phase 5 when no region is selected
  if (!regionInfo) {
    const totalPopulation =
      countryData && countryData.features
        ? countryData.features.reduce((total, feature) => {
          const month =
            selectedMonth < 10
              ? `0${selectedMonth}`
              : selectedMonth.toString();
          const population = parseFloat(
            feature.properties[`POP-${selectedYear}-${month}`]
          );
          return total + (isNaN(population) ? 0 : population);
        }, 0)
        : 0;

    const displayPopulation =
      totalPopulation === 0 ? null : formatNumber(totalPopulation);

    function calculateTotalPhase(phase, selectedYear, selectedMonth) {
      if (!countryData || !countryData.features) {
        return 0;
      }
      const total = countryData.features.reduce((total, feature) => {
        const month =
          selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth.toString();
        const phaseValue = parseFloat(
          feature.properties[`${phase}-${selectedYear}-${month}`]
        );
        return total + (isNaN(phaseValue) ? 0 : phaseValue);
      }, 0);
      return total === 0 ? null : total;
    }

    const totalPhase1 = calculateTotalPhase("PH1", selectedYear, selectedMonth);
    const totalPhase2 = calculateTotalPhase("PH2", selectedYear, selectedMonth);
    const totalPhase3 = calculateTotalPhase("PH3", selectedYear, selectedMonth);
    const totalPhase4 = calculateTotalPhase("PH4", selectedYear, selectedMonth);
    const totalPhase5 = calculateTotalPhase("PH5", selectedYear, selectedMonth);
    const percentTotal1 = calculatePercentage(totalPhase1, totalPopulation);
    const percentTotal2 = calculatePercentage(totalPhase2, totalPopulation);
    const percentTotal3 = calculatePercentage(totalPhase3, totalPopulation);
    const percentTotal4 = calculatePercentage(totalPhase4, totalPopulation);
    const percentTotal5 = calculatePercentage(totalPhase5, totalPopulation);

    const phaseData = [
      {
        total: formatNumber(totalPhase1),
        percent: formatNumber(percentTotal1),
      },
      {
        total: formatNumber(totalPhase2),
        percent: formatNumber(percentTotal2),
      },
      {
        total: formatNumber(totalPhase3),
        percent: formatNumber(percentTotal3),
      },
      {
        total: formatNumber(totalPhase4),
        percent: formatNumber(percentTotal4),
      },
      {
        total: formatNumber(totalPhase5),
        percent: formatNumber(percentTotal5),
      },
    ];

    // Display the total values for Phase 1 to Phase 5
    return (
      <nav className="sidebar">
        <div className="sidebar-container">
          <div className="logo">
            <img
              src={process.env.PUBLIC_URL + "/images/family_icon.svg"}
              alt="Family Icon"
            />
            <span className="logo-text">
              {t("Food Situation")} {selectedYear}{" "}
            </span>
          </div>
          {children}
          <div
            className="region-info"
            style={{ marginTop: "-60px", marginRight: "25px" }}
          >
            <h2 style={{ marginTop: "40px", marginBottom: "-10px" }}>
              <div>
                <p>{t("All Countries")}</p>
              </div>
            </h2>
            {displayCompare === "single" ? (
              <>
                <div className="info-row">
                  <h4>{t("Total Population")}</h4>
                  <p className="align-right">{formatNumber(displayPopulation)}</p>
                </div>
                <div className="info-columns">
                  <div className="info-column">
                    {phaseData.map((phase, index) => (
                      <div className="info-item" key={index}>
                        {phase.total && <p>{`Phase ${index + 1}:`}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="info-column align-right">
                    {phaseData.map((phase, index) => (
                      <div className="info-item" key={index}>
                        {phase.total && <p>{formatNumber(phase.total)}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="info-column align-right">
                    {phaseData.map((phase, index) => (
                      <div className="info-item" key={index}>
                        {phase.total && <p>{`${formatNumber(phase.percent)}%`}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>) : (
              <div className="info-row">
                <h4>{t("Switch Detail")}</h4>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Display information about the selected region
  return (
    <nav className="sidebar">
      <div className="sidebar-container">
        <div className="logo">
          <img
            src={process.env.PUBLIC_URL + "/images/family_icon.svg"}
            alt="Family Icon"
          />
          <span className="logo-text">
            {t("Food Situation")} {selectedYear}{" "}
          </span>
        </div>
        {children}
        <div
          className="region-info"
          style={{ marginTop: "-60px", marginRight: "25px" }}
        >
          <h2 style={{ marginTop: "40px", marginBottom: "-10px" }}>
            <div>
              <p>{Name}</p>
            </div>
          </h2>
          {displayCompare === "single" ? (
            <>
              <div className="info-row">
                <h4>Total population:</h4>
                <p className="align-right">{Population}</p>
              </div>
              <div className="info-columns">
                <div className="info-column">
                  {regionPhaseData.map((phase, index) => (
                    <div className="info-item" key={index}>
                      <p>{`${t("Phase")} ${index + 1}:`}</p>
                    </div>
                  ))}
                </div>

                <div className="info-column align-right">
                  {regionPhaseData.map((phase, index) => (
                    <div className="info-item" key={index}>
                      <p>{formatNumber(phase.total)}</p>
                    </div>
                  ))}
                </div>

                <div className="info-column align-right">
                  {regionPhaseData.map((phase, index) => (
                    <div className="info-item" key={index}>
                      <p>{`${formatNumber(phase.percent)}%`}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="info-row">
              <h4>{t("Switch Detail")}</h4>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function formatNumber(number) {
  return number
    ? number.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : null;
}

export function calculatePercentage(value, total) {
  const percentage = total ? ((value || 0) / total) * 100 : 0;
  return isNaN(percentage) || percentage === null ? "" : percentage.toFixed(1); // Displaying percentage with two decimal places or return empty string
}

export function Logo({ selectedYear }) {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <div className="logo">
      <img
        src={process.env.PUBLIC_URL + "/images/family_icon.svg"}
        alt="Family Icon"
      />
      <span className="logo-text">
        {selectedYear}{" "}{t("projects")}
      </span>
    </div>
  );
}

export default Sidebar;
