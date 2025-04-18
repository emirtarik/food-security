// src/components/ComparisonTable.js
import React, { useEffect, useState } from 'react';
import '../styles/ComparisonTable.css';
import { useTranslationHook } from "../i18n";

const classificationSeverity = {
  "Non analysée": 0,
  "Phase 1 : minimal": 1,
  "Phase 2 : sous pression": 2,
  "Phase 3 : crises": 3,
  "Phase 4 : urgence": 4,
  "inaccessible": 5
};

const classificationColor = {
  "Non analysée": "#ffffff",
  "Phase 1 : minimal": "#d3f3d4",
  "Phase 2 : sous pression": "#ffe252",
  "Phase 3 : crises": "#fa890f",
  "Phase 4 : urgence": "#eb3333",
  "inaccessible": "#cccccc"
};

const severityToClassification = (sev) => {
  for (let key in classificationSeverity) {
    if (classificationSeverity[key] === sev) return key;
  }
  return "Unknown";
};

const aggregateFeatures = (features) => {
  let totalPop = 0;
  let totalPh2 = 0;
  let totalPh3 = 0;
  let maxSeverity = -1;

  features.forEach(f => {
    const cl = f["classification"];
    const sev = classificationSeverity[cl] !== undefined ? classificationSeverity[cl] : 0;
    if (sev > maxSeverity) maxSeverity = sev;

    // Since population is already in thousands, we simply parse.
    const pop = parseFloat(f["Population totale"]) || 0;
    const ph2 = parseFloat(f["Population totale en Ph 2"]) || 0;
    const ph3 = parseFloat(f["Population totale en Ph 3 à 5"]) || 0;
    totalPop += pop;
    totalPh2 += ph2;
    totalPh3 += ph3;
  });

  return {
    classification: severityToClassification(maxSeverity),
    pop: totalPop,
    ph2: totalPh2,
    ph3: totalPh3
  };
};

const groupDataByRegion = (data, regionSelection) => {
  const { admin0, admin1, admin2 } = regionSelection;
  const groups = {};

  if (admin0 && !admin1) {
    data.forEach(f => {
      if (f.admin0Name === admin0) {
        const key = f.admin1Name || "Unknown Region";
        groups[key] = groups[key] || [];
        groups[key].push(f);
      }
    });
  } else if (admin0 && admin1 && !admin2) {
    data.forEach(f => {
      if (f.admin0Name === admin0 && f.admin1Name === admin1) {
        const key = f.admin2Name || "Unknown District";
        groups[key] = groups[key] || [];
        groups[key].push(f);
      }
    });
  } else if (admin0 && admin1 && admin2) {
    const filtered = data.filter(f =>
      f.admin0Name === admin0 &&
      f.admin1Name === admin1 &&
      f.admin2Name === admin2
    );
    if (filtered.length > 0) {
      groups[admin2] = filtered;
    }
  } else {
    data.forEach(f => {
      const key = f.admin0Name || "Unknown Country";
      groups[key] = groups[key] || [];
      groups[key].push(f);
    });
  }
  return groups;
};

const ComparisonTable = ({
  regionSelection = { admin0: "", admin1: "", admin2: "" },
  period1,  // e.g., "October-2024"
  period2   // e.g., "PJune-2025"
}) => {
  const { t } = useTranslationHook("analysis");
  const { t: tMisc } = useTranslationHook("misc");
  const [dataPeriod1, setDataPeriod1] = useState([]);
  const [dataPeriod2, setDataPeriod2] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: format number with thousands separators.
  const formatNumber = (num) => {
    const n = typeof num === "number" ? num : parseFloat(num);
    return isNaN(n) ? num : n.toLocaleString();
  };

  // Helper function to translate classification values.
  const translateClassification = (classification, t) => {
    switch (classification) {
      case "Non analysée":
        return t("nonAnalyzed");
      case "Phase 1 : minimal":
        return t("phase1");
      case "Phase 2 : sous pression":
        return t("phase2");
      case "Phase 3 : crises":
        return t("phase3");
      case "Phase 4 : urgence":
        return t("phase4");
      case "Phase 5 : famine":
        return t("phase5");
      case "inaccessible":
        return t("inaccessible");
      default:
        return classification || t("unknownClassification");
    }
  };


  // Fetch the combined geojson and extract period-specific data.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/data/combined.geojson`);
        const geojson = await res.json();
        const extractPeriodData = (features, period) => {
          return features.map(f => {
            const p = f.properties;
            return {
              admin0Name: p.admin0Name,
              admin1Name: p.admin1Name,
              admin2Name: p.admin2Name,
              classification: p[`classification_${period}`],
              "Population totale": p[`population_total_${period}`],
              "Population totale en Ph 2": p[`population_ph2_${period}`],
              "Population totale en Ph 3 à 5": p[`population_ph3_${period}`]
            };
          });
        };
        const d1 = extractPeriodData(geojson.features, period1);
        const d2 = extractPeriodData(geojson.features, period2);
        setDataPeriod1(d1);
        setDataPeriod2(d2);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching combined geojson:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [period1, period2]);

  if (loading) {
    return <div className="comparison-table-container">{t("loadingComparisonData")}</div>;
  }

  const grouped1 = groupDataByRegion(dataPeriod1, regionSelection);
  const grouped2 = groupDataByRegion(dataPeriod2, regionSelection);

  const rowKeys = Object.keys(grouped1);
  const rows = rowKeys.map(regionName => {
    const agg1 = aggregateFeatures(grouped1[regionName]);
    const agg2 = grouped2[regionName] ? aggregateFeatures(grouped2[regionName]) : null;
    
    const sev1 = classificationSeverity[agg1.classification] ?? 0;
    const sev2 = agg2 ? (classificationSeverity[agg2.classification] ?? 0) : -1;
    let classificationChange = t("noChange");
    if (!agg2) {
      classificationChange = t("nA");
    } else if (sev2 > sev1) {
      classificationChange = t("worse");
    } else if (sev2 < sev1) {
      classificationChange = t("better");
    }

    return {
      region: regionName,
      classification1: agg1.classification,
      population1: formatNumber(agg1.pop),
      popPh2_1: formatNumber(agg1.ph2),
      popPh3_1: formatNumber(agg1.ph3),
      classification2: agg2 ? agg2.classification : t("nA"),
      population2: agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2: agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2: agg2 ? formatNumber(agg2.ph3) : "0",
      classificationChange
    };
  });

  const cellStyle = (classification) => ({
    backgroundColor: classificationColor[classification] || '#ffffff'
  });

  return (
    <div style={{ position: 'relative' }}>
      <div className="comparison-table-container">
        <h3>{t("comparisonTableTitle")}</h3>
        <p>{t("comparingDataForPeriods")}: {period1} vs {period2} {t("inThousands")}</p>

        <div className="triple-table-wrapper">
          {/* Left Table: Regions */}
          <div className="table-block region-table">
            <h4>{t("regions")}</h4>
            <table className="comparison-table triple-table">
              <thead>
                <tr>
                  <th>{t("region")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Middle Table: Period1 Data */}
          <div className="table-block">
            <h4>{t("dataFor")} {period1} {t("inThousands")}</h4>
            <table className="comparison-table triple-table">
              <thead>
                <tr>
                  <th>{t("classification")}</th>
                  <th>{t("population")}</th>
                  <th>{t("populationPh2")}</th>
                  <th>{t("populationPh3")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={cellStyle(row.classification1)}>
                      {translateClassification(row.classification1, t)}
                    </td>
                    <td>{row.population1}</td>
                    <td>{row.popPh2_1}</td>
                    <td>{row.popPh3_1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Table: Period2 Data + Change */}
          <div className="table-block">
            <h4>{t("dataFor")} {period2} {t("inThousands")}</h4>
            <table className="comparison-table triple-table">
              <thead>
                <tr>
                  <th>{t("classification")}</th>
                  <th>{t("population")}</th>
                  <th>{t("populationPh2")}</th>
                  <th>{t("populationPh3")}</th>
                  <th>{t("change")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={cellStyle(row.classification2)}>
                      {translateClassification(row.classification2, t)}
                    </td>
                    <td>{row.population2}</td>
                    <td>{row.popPh2_2}</td>
                    <td>{row.popPh3_2}</td>
                    <td>{row.classificationChange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mask-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {tMisc("underRenovation")}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
