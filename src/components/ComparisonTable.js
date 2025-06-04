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

// Helper function to determine arrow direction and color for changes
const getChangeVisuals = (changeValue) => {
  if (changeValue > 0) {
    return { direction: 'up', color: 'green' };
  } else if (changeValue < 0) {
    return { direction: 'down', color: 'red' };
  }
  return { direction: 'neutral', color: 'default' };
};

const getArrowSymbol = (direction) => {
  if (direction === 'up') return '▲ ';
  if (direction === 'down') return '▼ ';
  if (direction === 'neutral') return '– ';
  return '';
};

const parseNumber = (value) => {
  const str = String(value).replace(/,/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const aggregateFeatures = (features) => {
  const atAdmin2 = features.filter(f => f.matchLevel === 2);
  const atAdmin1 = features.filter(f => f.matchLevel === 1); // These are Admin2 features with matchLevel 1

  let toSum; // For population and severity aggregation
  let usedLevel;
  let actualAdmin2sConsideredForCount; // For numberOfAnalyzedUnits

  if (atAdmin2.length > 0) {
    toSum = atAdmin2;
    usedLevel = 2;
    actualAdmin2sConsideredForCount = atAdmin2;
  } else if (atAdmin1.length > 0) {
    // Original logic for toSum for population aggregation if only matchLevel 1 admin2s are present
    const uniq = {};
    atAdmin1.forEach(f => {
      // This assumes f.admin1Name is present and correctly identifies the Admin1 unit
      // to which this Admin2-level data (with matchLevel 1) belongs.
      uniq[f.admin1Name] = f; // Takes the last admin2 feature as representative for that admin1Name's population
    });
    toSum = Object.values(uniq); // For populating sums based on representative Admin2s
    usedLevel = 1;
    actualAdmin2sConsideredForCount = atAdmin1; // For counting all Admin2s with matchLevel 1
  } else {
    toSum = [];
    usedLevel = 0;
    actualAdmin2sConsideredForCount = [];
  }

  let totalPop = 0;
  let totalPh2 = 0;
  let totalPh3 = 0;
  let maxSeverity = -1;

  toSum.forEach(f => {
    const sev = classificationSeverity[f.classification] ?? 0;
    if (sev > maxSeverity) maxSeverity = sev;
    totalPop += parseNumber(f["Population totale"]);
    totalPh2  += parseNumber(f["Population totale en Ph 2"]);
    totalPh3  += parseNumber(f["Population totale en Ph 3 à 5"]);
  });

  // If toSum was empty, or all classifications were invalid, ensure maxSeverity is at least 0 ("Non analysée")
  if (maxSeverity === -1 && toSum.length === 0) {
      maxSeverity = 0;
  }
  // If toSum was not empty but all classifications were invalid, maxSeverity would be 0 from the loop.
  // If toSum was not empty and there were valid classifications, maxSeverity would be > 0.

  return {
    classification:     severityToClassification(maxSeverity),
    pop:                Math.trunc(totalPop / 1000),
    ph2:                Math.trunc(totalPh2  / 1000),
    ph3:                Math.trunc(totalPh3  / 1000),
    aggregatedAtAdmin1: usedLevel === 1,
    numberOfAnalyzedUnits: actualAdmin2sConsideredForCount.length,
    rawPop:             totalPop
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

    const units1 = agg1.numberOfAnalyzedUnits;
    const rawPop1 = agg1.rawPop;
    const units2 = agg2 ? agg2.numberOfAnalyzedUnits : 0;
    const rawPop2 = agg2 ? agg2.rawPop : 0;

    const zoneChange = units2 - units1;
    const populationChange = rawPop2 - rawPop1; // Raw difference

    const populationChangeInThousands = Math.trunc(populationChange / 1000); // Value for display

    const zoneChangeVisuals = getChangeVisuals(zoneChange);
    const populationChangeVisuals = getChangeVisuals(populationChange); // Visuals based on raw change

    return {
      region:           admin1Name,
      classification1:  agg1.classification,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,
      rawPop1:          rawPop1,
      units1:           units1,

      classification2:  agg2 ? agg2.classification : t("nA"),
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,
      rawPop2:          rawPop2,
      units2:           units2,

      aggregated:        agg1.aggregatedAtAdmin1 || (agg2?.aggregatedAtAdmin1 ?? false),
      classificationChange: change,
      zoneChange:       zoneChange,
      populationChange: populationChange, // Keep raw value for visuals and logic
      populationChangeInThousands: populationChangeInThousands, // New field for display
      zoneChangeVisuals: zoneChangeVisuals,
      populationChangeVisuals: populationChangeVisuals,
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

    const units1 = agg1.numberOfAnalyzedUnits;
    const rawPop1 = agg1.rawPop;
    const units2 = agg2 ? agg2.numberOfAnalyzedUnits : 0;
    const rawPop2 = agg2 ? agg2.rawPop : 0;

    const zoneChange = units2 - units1;
    const populationChange = rawPop2 - rawPop1; // Raw difference

    const populationChangeInThousands = Math.trunc(populationChange / 1000); // Value for display

    const zoneChangeVisuals = getChangeVisuals(zoneChange);
    const populationChangeVisuals = getChangeVisuals(populationChange); // Visuals based on raw change

    return {
      region:           regionName,
      classification1:  agg1.classification,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,
      rawPop1:          rawPop1,
      units1:           units1,

      classification2:  agg2 ? agg2.classification : t("nA"),
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,
      rawPop2:          rawPop2,
      units2:           units2,

      aggregated:        agg1.aggregatedAtAdmin1 || (agg2?.aggregatedAtAdmin1 ?? false),
      classificationChange: change,
      zoneChange:       zoneChange,
      populationChange: populationChange, // Keep raw value for visuals and logic
      populationChangeInThousands: formatNumber(populationChangeInThousands), // New field for display
      zoneChangeVisuals: zoneChangeVisuals,
      populationChangeVisuals: populationChangeVisuals,
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
          // Ensure placeholders also have these fields to avoid rendering errors
          zoneChange: 0, populationChange: 0,
          zoneChangeVisuals: { direction: 'neutral', color: 'default'},
          populationChangeVisuals: { direction: 'neutral', color: 'default'},
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
            <table className="comparison-table data-table-4col triple-table">
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

          {/* Right Table: Period2 Data */}
          <div className="table-block">
            <h4>{t("dataFor")} {period2} {t("inThousands")}</h4>
            {/* Class adjusted from data-table-5col to data-table-4col */}
            <table className="comparison-table data-table-4col triple-table">
              <thead>
                <tr>
                  <th>{t("classification")}</th>
                  <th>{t("population")}</th>
                  <th>{t("populationPh2")}</th>
                  <th>{t("populationPh3")}</th>
                  {/* Removed <th>{t("change")}</th> */}
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
                    {/* Removed <td>{row.classificationChange}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Fourth Table Block: Analysis of Change */}
          <div className="table-block">
            <h4>{t("analysisOfChange")}</h4> {/* New translation key */}
            <table className="comparison-table data-table-2col triple-table"> {/* Adjust class if needed */}
              <thead>
                <tr>
                  <th>{t("zoneChangeHeader")}</th> {/* New translation key */}
                  <th>{t("populationChangeHeader")}</th> {/* New translation key */}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => {
                  // Ensure row.zoneChangeVisuals and row.populationChangeVisuals exist to prevent errors
                  // Also check for row.isPlaceholder to avoid trying to access properties on placeholder text
                  const zoneVisuals = !row.isPlaceholder && row.zoneChangeVisuals ? row.zoneChangeVisuals : { direction: 'neutral', color: 'default' };
                  const popVisuals = !row.isPlaceholder && row.populationChangeVisuals ? row.populationChangeVisuals : { direction: 'neutral', color: 'default' };
                  const zoneArrow = getArrowSymbol(zoneVisuals.direction);
                  const popArrow = getArrowSymbol(popVisuals.direction);

                  const zoneChangeText = row.isPlaceholder ? "" : row.zoneChange;
                  // Use populationChangeInThousands for display
                  const populationChangeText = row.isPlaceholder ? "" : row.populationChangeInThousands;

                  return (
                    <tr key={i}>
                      <td style={{ color: zoneVisuals.color === 'default' ? 'inherit' : zoneVisuals.color }}>
                        {zoneArrow}{zoneChangeText}
                      </td>
                      <td style={{ color: popVisuals.color === 'default' ? 'inherit' : popVisuals.color }}>
                        {popArrow}{populationChangeText}
                      </td>
                    </tr>
                  );
                })}
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
