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
  "Phase 5 : famine": 5,
  "inaccessible": 6
};

const classificationColor = {
  "Non analysée": "#ffffff",
  "Phase 1 : minimal": "#d3f3d4",
  "Phase 2 : sous pression": "#ffe252",
  "Phase 3 : crises": "#fa890f",
  "Phase 4 : urgence": "#eb3333",
  "Phase 5 : famine": "#60090b",
  "inaccessible": "#cccccc"
};

const severityToClassification = (sev) => {
  for (let key in classificationSeverity) {
    if (classificationSeverity[key] === sev) return key;
  }
  return "Unknown";
};

const parseNumber = (value) => {
  const str = String(value).replace(/,/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const aggregateFeatures = (features) => {
  // 1) Split out admin-2 vs admin-1 matches
  const atAdmin2 = features.filter(f => f.matchLevel === 2);
  const atAdmin1 = features.filter(f => f.matchLevel === 1);

  // 2) Decide which set to sum
  let toSum, usedLevel;
  if (atAdmin2.length > 0) {
    toSum = atAdmin2;
    usedLevel = 2;
  } else if (atAdmin1.length > 0) {
    toSum = [ atAdmin1[0] ];   // only one aggregate row
    usedLevel = 1;
  } else {
    toSum = [];
    usedLevel = 0;             // no data
  }

  // 3) Sum + max‐severity as before
  let totalPop    = 0;
  let totalPh2    = 0;
  let totalPh3    = 0;
  let maxSeverity = -1;

  toSum.forEach(f => {
    const sev = classificationSeverity[f.classification] ?? 0;
    if (sev > maxSeverity) maxSeverity = sev;

    totalPop += parseNumber(f["Population totale"]);
    totalPh2  += parseNumber(f["Population totale en Ph 2"]);
    totalPh3  += parseNumber(f["Population totale en Ph 3 à 5"]);
  });

  return {
    classification: severityToClassification(maxSeverity),
    pop:         Math.trunc(totalPop / 1000),
    ph2:         Math.trunc(totalPh2  / 1000),
    ph3:         Math.trunc(totalPh3  / 1000),
    aggregatedAtAdmin1:  usedLevel === 1
  };
};


const groupDataByRegion = (data, regionSelection) => {
  const { admin0, admin1, admin2 } = regionSelection;
  const groups = {};

  if (admin0 && !admin1) {
    data.forEach(f => {
      if (f.admin0Name === admin0) {
        const key = f.admin1Name || "Unknown Region";
        (groups[key] = groups[key] || []).push(f);
      }
    });
  } else if (admin0 && admin1 && !admin2) {
    data.forEach(f => {
      if (f.admin0Name === admin0 && f.admin1Name === admin1) {
        const key = f.admin2Name || "Unknown District";
        (groups[key] = groups[key] || []).push(f);
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
      (groups[key] = groups[key] || []).push(f);
    });
  }
  return groups;
};

const ComparisonTable = ({
  regionSelection = { admin0: "", admin1: "", admin2: "" },
  period1,
  period2
}) => {
  const { t } = useTranslationHook("analysis");
  const { t: tMisc } = useTranslationHook("misc");
  const [dataPeriod1, setDataPeriod1] = useState([]);
  const [dataPeriod2, setDataPeriod2] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: format number (drop decimals, add separators)
  const formatNumber = (num) => {
    let n = typeof num === 'number' ? num : parseNumber(num);
    if (isNaN(n)) return num;
    n = Math.trunc(n);
    return n.toLocaleString();
  };

  const translateClassification = (classification, t) => {
    switch (classification) {
      case "Non analysée":   return t("nonAnalyzed");
      case "Phase 1 : minimal":     return t("phase1");
      case "Phase 2 : sous pression": return t("phase2");
      case "Phase 3 : crises":       return t("phase3");
      case "Phase 4 : urgence":      return t("phase4");
      case "Phase 5 : famine":       return t("phase5");
      case "inaccessible":           return t("inaccessible");
      default:                     return classification || t("unknownClassification");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/data/combined.geojson`);
        const geojson = await res.json();
        const extractPeriod = (features, period) =>
          features.map(f => {
            const p = f.properties;
            return {
              admin0Name: p.admin0Name,
              admin1Name: p.admin1Name,
              admin2Name: p.admin2Name,
              matchLevel: p[`level_${period}`],
              classification:    p[`classification_${period}`],
              "Population totale":         p[`population_total_${period}`],
              "Population totale en Ph 2": p[`population_ph2_${period}`],
              "Population totale en Ph 3 à 5": p[`population_ph3_${period}`]
            };
          });
        setDataPeriod1(extractPeriod(geojson.features, period1));
        setDataPeriod2(extractPeriod(geojson.features, period2));
      } catch (err) {
        console.error('Error fetching combined.geojson:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period1, period2]);

  if (loading) return <div className="comparison-table-container">{t("loadingComparisonData")}</div>;

  const grouped1 = groupDataByRegion(dataPeriod1, regionSelection);
  const grouped2 = groupDataByRegion(dataPeriod2, regionSelection);

  const rows = Object.keys(grouped1).map(regionName => {
    const agg1 = aggregateFeatures(grouped1[regionName]);
    const agg2 = grouped2[regionName] ? aggregateFeatures(grouped2[regionName]) : null;

    const sev1 = classificationSeverity[agg1.classification] ?? 0;
    const sev2 = agg2 ? (classificationSeverity[agg2.classification] ?? 0) : -1;

    let change = t("noChange");
    if (!agg2)      change = t("nA");
    else if (sev2 > sev1)  change = t("worse");
    else if (sev2 < sev1)  change = t("better");

    return {
      region:           regionName,
      classification1:  agg1.classification,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,

      classification2:  agg2 ? agg2.classification : t("nA"),
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,

      aggregated:        agg1.aggregatedAtAdmin1 || (agg2?.aggregatedAtAdmin1 ?? false),

      classificationChange: change
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
                    <td>
                      {row.aggregated && (
                        <span
                          className="popup-aggregated"
                          data-tooltip={t("dataAggregated")}
                        >
                          ⚠️
                        </span>
                      )}
                      {' '}{row.region}
                    </td>
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
                {rows.map((row,i) => (
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
        {/* <div className="mask-overlay" style={{
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
        </div> */}
      </div>
    </div>
  );
};

export default ComparisonTable;
