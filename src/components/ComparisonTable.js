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
  // 1) Partition out true admin-2 vs. admin-1 fallback
  const atAdmin2 = features.filter(f => f.matchLevel === 2);
  const atAdmin1 = features.filter(f => f.matchLevel === 1);

  let toSum, usedLevel;
  if (atAdmin2.length > 0) {
    // if any admin-2, just sum those
    toSum = atAdmin2;
    usedLevel = 2;

  } else if (atAdmin1.length > 0) {
    // No admin-2 at all → we only have admin-1 rollups.
    // But: if features cover multiple admin-1 units (i.e. country-level grouping),
    // we want one record *per distinct* admin-1, not just the first.

    // Build a map keyed by admin1Name → single aggregate row
    const uniq = {};
    atAdmin1.forEach(f => {
      uniq[f.admin1Name] = f;
    });

    // toSum is either
    //  • [ that one row ]       — if you only had one admin1 in this group
    //  • [ row1, row2, row3… ]  — if you’re at country level and have many admin1s
    toSum      = Object.values(uniq);
    usedLevel  = 1;

  } else {
    // no data at all
    toSum      = [];
    usedLevel  = 0;
  }

  // 2) Sum + max‐severity
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

  // 3) Divide by 1000 for “thousands”, drop decimals, and return
  return {
    classification:     severityToClassification(maxSeverity),
    pop:                Math.trunc(totalPop / 1000),
    ph2:                Math.trunc(totalPh2  / 1000),
    ph3:                Math.trunc(totalPh3  / 1000),
    aggregatedAtAdmin1: usedLevel === 1
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

const getAdmin1DataForCountry = async (
  admin0Name,
  dataPeriod1,
  dataPeriod2,
  period1,
  period2,
  formatNumber,
  translateClassification,
  t
) => {
  const admin1DataP1 = dataPeriod1.filter(f => f.admin0Name === admin0Name);
  const admin1DataP2 = dataPeriod2.filter(f => f.admin0Name === admin0Name);

  const groupedP1Admin1s = {};
  admin1DataP1.forEach(f => {
    const key = f.admin1Name || "Unknown Region";
    (groupedP1Admin1s[key] = groupedP1Admin1s[key] || []).push(f);
  });

  const groupedP2Admin1s = {};
  admin1DataP2.forEach(f => {
    const key = f.admin1Name || "Unknown Region";
    (groupedP2Admin1s[key] = groupedP2Admin1s[key] || []).push(f);
  });

  const admin1Rows = Object.keys(groupedP1Admin1s).map(admin1Name => {
    const agg1 = aggregateFeatures(groupedP1Admin1s[admin1Name]);
    const agg2Features = groupedP2Admin1s[admin1Name] || [];
    const agg2 = agg2Features.length > 0 ? aggregateFeatures(agg2Features) : null;

    const sev1 = classificationSeverity[agg1.classification] ?? 0;
    const sev2 = agg2 ? (classificationSeverity[agg2.classification] ?? 0) : -1;

    let change = t("noChange");
    if (!agg2)      change = t("nA");
    else if (sev2 > sev1)  change = t("worse");
    else if (sev2 < sev1)  change = t("better");

    return {
      region:           admin1Name,
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
      classificationChange: change,
      isSubRow: true // Flag to identify these as admin1 sub-rows
    };
  });

  return admin1Rows;
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
  const [expandedAdmin0s, setExpandedAdmin0s] = useState({});
  const [admin1SubRowsData, setAdmin1SubRowsData] = useState({});

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

  const handleRegionClick = async (admin0Name, isSubRow) => {
    // If a specific country (admin0) is already selected in regionSelection,
    // or if the click is on an admin1/admin2 sub-row, do nothing.
    if (regionSelection.admin0 || isSubRow) {
      return;
    }

    // Proceed with toggling expansion for admin0 level in general view
    const isCurrentlyExpanded = expandedAdmin0s[admin0Name];
    setExpandedAdmin0s(prev => ({ ...prev, [admin0Name]: !prev[admin0Name] }));

    // If expanding and data not yet fetched
    if (!isCurrentlyExpanded && !admin1SubRowsData[admin0Name]) {
      try {
        const fetchedData = await getAdmin1DataForCountry(
          admin0Name,
          dataPeriod1,
          dataPeriod2,
          period1,
          period2,
          formatNumber,
          translateClassification,
          t
        );
        setAdmin1SubRowsData(prev => ({ ...prev, [admin0Name]: fetchedData }));
      } catch (error) {
        console.error("Error fetching admin1 data:", error);
        // Optionally reset expansion state or show error to user
        setExpandedAdmin0s(prev => ({ ...prev, [admin0Name]: false }));
      }
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

  const baseRows = Object.keys(grouped1).map(regionName => {
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
      classificationChange: change,
      level: 0, // Indicates an Admin0 row
      isSubRow: false
    };
  });

  const displayRows = [];
  baseRows.forEach(baseRow => {
    displayRows.push(baseRow);
    // If this admin0 row is expanded and we are in country-level view
    if (
      expandedAdmin0s[baseRow.region] &&
      !regionSelection.admin1 &&
      !regionSelection.admin2
    ) {
      const subRows = admin1SubRowsData[baseRow.region];
      if (subRows) {
        subRows.forEach(subRow => {
          displayRows.push({ ...subRow, level: 1, isSubRow: true });
        });
      } else {
        // Placeholder for when data is not yet loaded
        displayRows.push({
          region: t("loadingAdmin1Data"),
          classification1: "", population1: "", popPh2_1: "", popPh3_1: "",
          classification2: "", population2: "", popPh2_2: "", popPh3_2: "",
          classificationChange: "",
          level: 1,
          isSubRow: true,
          isPlaceholder: true // Added a flag for placeholder
        });
      }
    }
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
                {displayRows.map((row, i) => {
                  // A row can be expanded if it's an Admin0 row, not a placeholder, and no Admin0 is yet selected in regionSelection
                  const canExpandThisRow = !regionSelection.admin0 && !row.isSubRow && !row.isPlaceholder;

                  let rowClass = "";
                  if (row.isSubRow) {
                    rowClass = `admin1-row ${!row.isPlaceholder ? 'expanded' : ''}`;
                  } else {
                    rowClass = 'admin0-row';
                  }

                  // TD is clickable if the row can be expanded
                  const tdClass = canExpandThisRow ? 'clickable-row' : 'non-clickable-row';

                  return (
                    <tr key={i} className={rowClass}>
                      <td
                        className={tdClass}
                        onClick={() => handleRegionClick(row.region, row.isSubRow || row.isPlaceholder)}
                      >
                        <span className="indicator-span">
                          {canExpandThisRow
                            ? expandedAdmin0s[row.region] ? '- ' : '+ '
                            : "\u00A0"}
                        </span>
                        {row.aggregated && !row.isSubRow && (
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
                  );
                })}
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
                {displayRows.map((row,i) => (
                  <tr key={i}>
                    <td style={row.isPlaceholder ? {} : cellStyle(row.classification1)}>
                      {row.isPlaceholder ? "" : translateClassification(row.classification1, t)}
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
                {displayRows.map((row, i) => (
                  <tr key={i}>
                    <td style={row.isPlaceholder ? {} : cellStyle(row.classification2)}>
                      {row.isPlaceholder ? "" : translateClassification(row.classification2, t)}
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
