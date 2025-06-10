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

const getChangeVisuals = (changeValue) => {
  if (changeValue > 0) {
    return { direction: 'up', color: 'red' };
  } else if (changeValue < 0) {
    return { direction: 'down', color: 'green' };
  }
  return { direction: 'neutral', color: 'default' };
};

const getArrowSymbol = (direction) => {
  if (direction === 'up') return '▲ ';
  if (direction === 'down') return '▼ ';
  if (direction === 'neutral') return ' ';
  return '';
};

const formatPercentage = (value, decimalPlaces = 1) => {
  if (value === null || value === undefined) return "—";
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return "N/A";
  return value.toFixed(decimalPlaces) + "%";
};

const parseNumber = (value) => {
  const str = String(value).replace(/,/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const aggregateFeatures = (features) => {
  const atAdmin2 = features.filter(f => f.matchLevel === 2);
  const atAdmin1 = features.filter(f => f.matchLevel === 1);

  let populatingFeatures;
  let usedLevel;
  let actualAdmin2sConsideredForCount;

  if (atAdmin2.length > 0) {
    populatingFeatures = atAdmin2;
    usedLevel = 2;
    actualAdmin2sConsideredForCount = atAdmin2;
  } else if (atAdmin1.length > 0) {
    const uniq = {};
    atAdmin1.forEach(f => {
      uniq[f.admin1Name] = f;
    });
    populatingFeatures = Object.values(uniq);
    usedLevel = 1;
    actualAdmin2sConsideredForCount = atAdmin1;
  } else {
    populatingFeatures = [];
    usedLevel = 0;
    actualAdmin2sConsideredForCount = [];
  }

  let totalPop = 0;
  let totalPh2 = 0;
  let totalPh3 = 0;
  let maxSeverity = -1;
  let numberOfZonesInPh3Plus = 0;

  populatingFeatures.forEach(f => {
    const severityValue = classificationSeverity[f.classification];
    if (severityValue !== undefined) {
      if (severityValue > maxSeverity) {
        maxSeverity = severityValue;
      }
      if (severityValue >= 3 && severityValue <= 5) {
        numberOfZonesInPh3Plus++;
      }
    }

    totalPop += parseNumber(f["Population totale"]);
    totalPh2  += parseNumber(f["Population totale en Ph 2"]);
    totalPh3  += parseNumber(f["Population totale en Ph 3 à 5"]);
  });

  if (maxSeverity === -1 && populatingFeatures.length === 0) {
      maxSeverity = 0;
  } else if (maxSeverity === -1 && populatingFeatures.length > 0) {
      maxSeverity = 0;
  }

  return {
    classification:     severityToClassification(maxSeverity),
    pop:                Math.trunc(totalPop / 1000),
    ph2:                Math.trunc(totalPh2  / 1000),
    ph3:                Math.trunc(totalPh3  / 1000),
    aggregatedAtAdmin1: usedLevel === 1,
    rawTotalPop: totalPop,
    rawPh3Pop: totalPh3,
    numberOfAnalyzedUnits: actualAdmin2sConsideredForCount.length,
    numberOfZonesInPh3Plus: numberOfZonesInPh3Plus,
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

    const classificationP1 = agg1.classification;
    const classificationP2 = agg2 ? agg2.classification : null;
    const isNonAnalyseeInAnyPeriod = classificationP1 === "Non analysée" || classificationP2 === "Non analysée";

    const sev1 = classificationSeverity[classificationP1] ?? 0;
    const sev2 = classificationP2 ? (classificationSeverity[classificationP2] ?? 0) : -1;

    let change = t("noChange");
    if (!agg2)      change = t("nA");
    else if (sev2 > sev1)  change = t("worse");
    else if (sev2 < sev1)  change = t("better");

    const populationChange = (agg2 ? agg2.rawPh3Pop : 0) - agg1.rawPh3Pop;
    const populationChangeInThousands = Math.trunc(populationChange / 1000);
    const zoneChange = (agg2 ? agg2.numberOfZonesInPh3Plus : 0) - agg1.numberOfZonesInPh3Plus;

    const zoneChangeVisuals = getChangeVisuals(zoneChange);
    const populationChangeVisuals = getChangeVisuals(populationChange);

    const ph3OfTotalPercent1 = agg1.rawTotalPop > 0 ? (agg1.rawPh3Pop / agg1.rawTotalPop) * 100 : 0;
    const ph3OfTotalPercent2 = (agg2 && agg2.rawTotalPop > 0) ? (agg2.rawPh3Pop / agg2.rawTotalPop) * 100 : 0;

    let ph3PopulationPercentChange = 0;
    if (agg1.rawPh3Pop !== 0) {
      ph3PopulationPercentChange = (populationChange / agg1.rawPh3Pop) * 100;
    } else if (populationChange !== 0) {
      ph3PopulationPercentChange = null;
    }

    return {
      region:           admin1Name,
      classification1:  classificationP1,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,
      rawPop1:          agg1.rawTotalPop,
      units1:           agg1.numberOfAnalyzedUnits,
      rawPh3Pop1:       agg1.rawPh3Pop,
      zonesInPh3Plus1:  agg1.numberOfZonesInPh3Plus,
      ph3OfTotalPercent1: ph3OfTotalPercent1,
      admin0NameParent: admin0Name,

      classification2:  classificationP2,
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,
      rawPop2:          agg2 ? agg2.rawTotalPop : 0,
      units2:           agg2 ? agg2.numberOfAnalyzedUnits : 0,
      rawPh3Pop2:       agg2 ? agg2.rawPh3Pop : 0,
      zonesInPh3Plus2:  agg2 ? agg2.numberOfZonesInPh3Plus : 0,
      ph3OfTotalPercent2: ph3OfTotalPercent2,

      isNonAnalyseeInAnyPeriod: isNonAnalyseeInAnyPeriod,
      aggregated:        agg1.aggregatedAtAdmin1 || (agg2?.aggregatedAtAdmin1 ?? false),
      classificationChange: change,
      zoneChange:       zoneChange,
      populationChange: populationChange,
      populationChangeInThousands: formatNumber(populationChangeInThousands),
      ph3PopulationPercentChange: ph3PopulationPercentChange,
      zoneChangeVisuals: zoneChangeVisuals,
      populationChangeVisuals: populationChangeVisuals,
      isSubRow: true
    };
  });

  return admin1Rows;
};

const getAdmin2DataForAdmin1 = async (
  admin0Name,
  admin1Name,
  dataPeriod1,
  dataPeriod2,
  period1,
  period2,
  formatNumber,
  translateClassification,
  t
) => {
  const admin2DataP1 = dataPeriod1.filter(f => f.admin0Name === admin0Name && f.admin1Name === admin1Name);
  const admin2DataP2 = dataPeriod2.filter(f => f.admin0Name === admin0Name && f.admin1Name === admin1Name);

  const groupedP1Admin2s = {};
  admin2DataP1.forEach(f => {
    const key = f.admin2Name || "Unknown District";
    (groupedP1Admin2s[key] = groupedP1Admin2s[key] || []).push(f);
  });

  const groupedP2Admin2s = {};
  admin2DataP2.forEach(f => {
    const key = f.admin2Name || "Unknown District";
    (groupedP2Admin2s[key] = groupedP2Admin2s[key] || []).push(f);
  });

  const allAdmin2Keys = new Set([...Object.keys(groupedP1Admin2s), ...Object.keys(groupedP2Admin2s)]);

  const admin2Rows = Array.from(allAdmin2Keys).map(admin2Name => {
    const featuresP1 = groupedP1Admin2s[admin2Name] || [];
    const featuresP2 = groupedP2Admin2s[admin2Name] || [];

    const agg1 = aggregateFeatures(featuresP1);
    const agg2 = featuresP2.length > 0 ? aggregateFeatures(featuresP2) : null;

    const classificationP1 = agg1.classification;
    const classificationP2 = agg2 ? agg2.classification : null;
    const isNonAnalyseeInAnyPeriod = classificationP1 === "Non analysée" || classificationP2 === "Non analysée";

    const sev1 = classificationSeverity[classificationP1] ?? 0;
    const sev2 = classificationP2 ? (classificationSeverity[classificationP2] ?? 0) : -1;

    let change = t("noChange");
    if (!agg2)      change = t("nA");
    else if (sev2 > sev1)  change = t("worse");
    else if (sev2 < sev1)  change = t("better");

    const populationChange = (agg2 ? agg2.rawPh3Pop : 0) - agg1.rawPh3Pop;
    const populationChangeInThousands = Math.trunc(populationChange / 1000);
    const zoneChange = (agg2 ? agg2.numberOfZonesInPh3Plus : 0) - agg1.numberOfZonesInPh3Plus;

    const zoneChangeVisuals = getChangeVisuals(zoneChange);
    const populationChangeVisuals = getChangeVisuals(populationChange);

    const ph3OfTotalPercent1 = agg1.rawTotalPop > 0 ? (agg1.rawPh3Pop / agg1.rawTotalPop) * 100 : 0;
    const ph3OfTotalPercent2 = (agg2 && agg2.rawTotalPop > 0) ? (agg2.rawPh3Pop / agg2.rawTotalPop) * 100 : 0;

    let ph3PopulationPercentChange = 0;
    if (agg1.rawPh3Pop !== 0) {
      ph3PopulationPercentChange = (populationChange / agg1.rawPh3Pop) * 100;
    } else if (populationChange !== 0) {
      ph3PopulationPercentChange = null;
    }

    return {
      region:           admin2Name,
      classification1:  classificationP1,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,
      rawPop1:          agg1.rawTotalPop,
      units1:           agg1.numberOfAnalyzedUnits,
      rawPh3Pop1:       agg1.rawPh3Pop,
      zonesInPh3Plus1:  agg1.numberOfZonesInPh3Plus,
      ph3OfTotalPercent1: ph3OfTotalPercent1,
      admin0NameParent: admin0Name,
      admin1NameParent: admin1Name,

      classification2:  classificationP2,
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,
      rawPop2:          agg2 ? agg2.rawTotalPop : 0,
      units2:           agg2 ? agg2.numberOfAnalyzedUnits : 0,
      rawPh3Pop2:       agg2 ? agg2.rawPh3Pop : 0,
      zonesInPh3Plus2:  agg2 ? agg2.numberOfZonesInPh3Plus : 0,
      ph3OfTotalPercent2: ph3OfTotalPercent2,

      isNonAnalyseeInAnyPeriod: isNonAnalyseeInAnyPeriod,
      classificationChange: change,
      zoneChange:       zoneChange,
      populationChange: populationChange,
      populationChangeInThousands: formatNumber(populationChangeInThousands),
      ph3PopulationPercentChange: ph3PopulationPercentChange,
      zoneChangeVisuals: zoneChangeVisuals,
      populationChangeVisuals: populationChangeVisuals,
      level: 2,
      isSubRow: true
    };
  });
  return admin2Rows;
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
  const [expandedAdmin1s, setExpandedAdmin1s] = useState({});
  const [admin2SubRowsData, setAdmin2SubRowsData] = useState({});
  const [loadingAdmin2Key, setLoadingAdmin2Key] = useState(null);


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

  const handleAdmin0RowClick = async (admin0Name) => {
    if (regionSelection.admin0) return;

    const isCurrentlyExpanded = expandedAdmin0s[admin0Name];
    setExpandedAdmin0s(prev => ({ ...prev, [admin0Name]: !prev[admin0Name] }));

    if (!isCurrentlyExpanded && !admin1SubRowsData[admin0Name]) {
      try {
        const fetchedData = await getAdmin1DataForCountry(
          admin0Name, dataPeriod1, dataPeriod2, period1, period2,
          formatNumber, translateClassification, t
        );
        setAdmin1SubRowsData(prev => ({ ...prev, [admin0Name]: fetchedData }));
      } catch (error) {
        console.error("Error fetching admin1 data:", error);
        setExpandedAdmin0s(prev => ({ ...prev, [admin0Name]: false }));
      }
    }
  };

  const handleAdmin1RowClick = async (admin0NameParent, admin1Name) => {
    const admin1RowData = (admin1SubRowsData[admin0NameParent] || []).find(r => r.region === admin1Name);
    const isExpandableAdmin1 = admin1RowData && !admin1RowData.aggregated1;

    if (regionSelection.admin1 || !isExpandableAdmin1) {
        return;
    }

    const key = `${admin0NameParent}_${admin1Name}`;
    const isCurrentlyExpanded = expandedAdmin1s[key];
    setExpandedAdmin1s(prev => ({ ...prev, [key]: !prev[key] }));

    if (!isCurrentlyExpanded && !admin2SubRowsData[key]) {
      setLoadingAdmin2Key(key);
      try {
        const fetchedData = await getAdmin2DataForAdmin1(
          admin0NameParent, admin1Name, dataPeriod1, dataPeriod2, period1, period2,
          formatNumber, translateClassification, t
        );
        setAdmin2SubRowsData(prev => ({ ...prev, [key]: fetchedData }));
      } catch (error) {
        console.error(`Error fetching admin2 data for ${key}:`, error);
        setExpandedAdmin1s(prev => ({ ...prev, [key]: false }));
      } finally {
        setLoadingAdmin2Key(null);
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

    const classificationP1 = agg1.classification;
    const classificationP2 = agg2 ? agg2.classification : null;
    const isNonAnalyseeInAnyPeriod = classificationP1 === "Non analysée" || classificationP2 === "Non analysée";

    const sev1 = classificationSeverity[classificationP1] ?? 0;
    const sev2 = classificationP2 ? (classificationSeverity[classificationP2] ?? 0) : -1;

    let change = t("noChange");
    if (!agg2)      change = t("nA");
    else if (sev2 > sev1)  change = t("worse");
    else if (sev2 < sev1)  change = t("better");

    const populationChange = (agg2 ? agg2.rawPh3Pop : 0) - agg1.rawPh3Pop;
    const populationChangeInThousands = Math.trunc(populationChange / 1000);
    const zoneChange = (agg2 ? agg2.numberOfZonesInPh3Plus : 0) - agg1.numberOfZonesInPh3Plus;

    const zoneChangeVisuals = getChangeVisuals(zoneChange);
    const populationChangeVisuals = getChangeVisuals(populationChange);

    const ph3OfTotalPercent1 = agg1.rawTotalPop > 0 ? (agg1.rawPh3Pop / agg1.rawTotalPop) * 100 : 0;
    const ph3OfTotalPercent2 = (agg2 && agg2.rawTotalPop > 0) ? (agg2.rawPh3Pop / agg2.rawTotalPop) * 100 : 0;

    let ph3PopulationPercentChange = 0;
    if (agg1.rawPh3Pop !== 0) {
      ph3PopulationPercentChange = (populationChange / agg1.rawPh3Pop) * 100;
    } else if (populationChange !== 0) {
      ph3PopulationPercentChange = null;
    }

    return {
      region:           regionName,
      classification1:  classificationP1,
      population1:      formatNumber(agg1.pop),
      popPh2_1:         formatNumber(agg1.ph2),
      popPh3_1:         formatNumber(agg1.ph3),
      aggregated1:      agg1.aggregatedAtAdmin1,
      rawPop1:          agg1.rawTotalPop,
      units1:           agg1.numberOfAnalyzedUnits,
      rawPh3Pop1:       agg1.rawPh3Pop,
      zonesInPh3Plus1:  agg1.numberOfZonesInPh3Plus,
      ph3OfTotalPercent1: ph3OfTotalPercent1,

      classification2:  classificationP2,
      population2:      agg2 ? formatNumber(agg2.pop) : "0",
      popPh2_2:         agg2 ? formatNumber(agg2.ph2) : "0",
      popPh3_2:         agg2 ? formatNumber(agg2.ph3) : "0",
      aggregated2:      agg2 ? agg2.aggregatedAtAdmin1 : false,
      rawPop2:          agg2 ? agg2.rawTotalPop : 0,
      units2:           agg2 ? agg2.numberOfAnalyzedUnits : 0,
      rawPh3Pop2:       agg2 ? agg2.rawPh3Pop : 0,
      zonesInPh3Plus2:  agg2 ? agg2.numberOfZonesInPh3Plus : 0,
      ph3OfTotalPercent2: ph3OfTotalPercent2,

      isNonAnalyseeInAnyPeriod: isNonAnalyseeInAnyPeriod,
      aggregated:        agg1.aggregatedAtAdmin1 || (agg2?.aggregatedAtAdmin1 ?? false),
      classificationChange: change,
      zoneChange:       zoneChange,
      populationChange: populationChange,
      populationChangeInThousands: formatNumber(populationChangeInThousands),
      ph3PopulationPercentChange: ph3PopulationPercentChange,
      zoneChangeVisuals: zoneChangeVisuals,
      populationChangeVisuals: populationChangeVisuals,
      level: 0,
      isSubRow: false
    };
  });

  const displayRows = [];
  baseRows.forEach(baseRow => {
    displayRows.push(baseRow);
    const admin0Key = baseRow.region;

    if (expandedAdmin0s[admin0Key] && !regionSelection.admin1 && !regionSelection.admin2) {
      const admin1Rows = admin1SubRowsData[admin0Key];
      if (admin1Rows) {
        admin1Rows.forEach(admin1Row => {
          displayRows.push({ ...admin1Row, level: 1, isSubRow: true });
          const admin1Key = `${admin1Row.admin0NameParent}_${admin1Row.region}`;
          const isExpandableAdmin1 = !admin1Row.aggregated1;

          if (isExpandableAdmin1 && expandedAdmin1s[admin1Key]) {
            const admin2Rows = admin2SubRowsData[admin1Key];
            if (admin2Rows) {
              admin2Rows.forEach(admin2Row => {
                displayRows.push({ ...admin2Row, level: 2, isSubRow: true });
              });
            } else if (loadingAdmin2Key === admin1Key) {
              displayRows.push({
                region: t("loadingAdmin2Data"),
                classification1: "", population1: "", popPh2_1: "", popPh3_1: "",
                classification2: "", population2: "", popPh2_2: "", popPh3_2: "",
                classificationChange: "",
                zoneChange: 0, populationChange: 0, populationChangeInThousands: 0, ph3PopulationPercentChange: 0,
                rawPop1: 0, units1: 0, rawPh3Pop1: 0, zonesInPh3Plus1: 0, ph3OfTotalPercent1: 0,
                rawPop2: 0, units2: 0, rawPh3Pop2: 0, zonesInPh3Plus2: 0, ph3OfTotalPercent2: 0,
                isNonAnalyseeInAnyPeriod: false,
                zoneChangeVisuals: { direction: 'neutral', color: 'default'},
                populationChangeVisuals: { direction: 'neutral', color: 'default'},
                level: 2, isSubRow: true, isPlaceholder: true,
                admin0NameParent: admin1Row.admin0NameParent,
                admin1NameParent: admin1Row.region
              });
            }
          }
        });
      } else {
        displayRows.push({
          region: t("loadingAdmin1Data"),
          classification1: "", population1: "", popPh2_1: "", popPh3_1: "",
          classification2: "", population2: "", popPh2_2: "", popPh3_2: "",
          classificationChange: "",
          zoneChange: 0, populationChange: 0, populationChangeInThousands: 0, ph3PopulationPercentChange: 0,
          rawPop1: 0, units1: 0, rawPh3Pop1: 0, zonesInPh3Plus1: 0, ph3OfTotalPercent1: 0,
          rawPop2: 0, units2: 0, rawPh3Pop2: 0, zonesInPh3Plus2: 0, ph3OfTotalPercent2: 0,
          isNonAnalyseeInAnyPeriod: false,
          zoneChangeVisuals: { direction: 'neutral', color: 'default'},
          populationChangeVisuals: { direction: 'neutral', color: 'default'},
          level: 1, isSubRow: true, isPlaceholder: true
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
                  let isExpandable = false;
                  let isExpanded = false;
                  let clickHandler = () => {};

                  if (!row.isPlaceholder) {
                    if (row.level === 0 && !regionSelection.admin0) {
                      isExpandable = true;
                      isExpanded = expandedAdmin0s[row.region];
                      clickHandler = () => handleAdmin0RowClick(row.region);
                    } else if (row.level === 1 && !regionSelection.admin1 && !regionSelection.admin2 && !row.aggregated1) {
                      isExpandable = true;
                      const admin1Key = `${row.admin0NameParent}_${row.region}`;
                      isExpanded = expandedAdmin1s[admin1Key];
                      clickHandler = () => handleAdmin1RowClick(row.admin0NameParent, row.region);
                    }
                  }
                  const tdClass = isExpandable ? 'clickable-row' : 'non-clickable-row';


                  let rowClass = "";
                  if (row.level === 2) { rowClass = 'admin2-row'; }
                  else if (row.level === 1) { rowClass = `admin1-row ${isExpanded && !row.isPlaceholder ? 'expanded' : ''}`; }
                  else { rowClass = `admin0-row ${isExpanded && !row.isPlaceholder ? 'expanded' : ''}`; }
                  if (row.isPlaceholder) rowClass += ' placeholder-row';

                  let indicator = "\u00A0";
                  if (isExpandable) {
                    indicator = isExpanded ? '- ' : '+ ';
                  }

                  return (
                    <tr key={i} className={rowClass}>
                      <td
                        className={tdClass}
                        onClick={clickHandler}
                      >
                        <span className="indicator-span">
                          {indicator}
                        </span>
                        {row.aggregated && !row.isSubRow && row.level === 0 && (
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
                {displayRows.map((row,i) => {
                    return (
                        <tr key={i}>
                        {(() => {
                            if (row.isPlaceholder) {
                                return <td></td>;
                            }

                            let showActualClassification = false;
                            if (row.level === 2) {
                                showActualClassification = true;
                            } else if (row.level === 1) {
                                const p1IsNA = row.classification1 === t("nA") || row.classification1 === t("noData");
                                const isAggregatedEndpointAdmin1 = row.aggregated1 || (p1IsNA && row.aggregated2);
                                showActualClassification = isAggregatedEndpointAdmin1;
                            }

                            if (showActualClassification) {
                                return (
                                <td style={cellStyle(row.classification1)}>
                                    {translateClassification(row.classification1, t)}
                                </td>
                                );
                            } else {
                                let showExpandCue = false;
                                if (row.level === 0) {
                                    const isAdmin0Expandable = !regionSelection.admin0 && !row.isSubRow;
                                    if (isAdmin0Expandable) {
                                        showExpandCue = true;
                                    }
                                } else if (row.level === 1) {
                                    const isExpandableToAdmin2 = !row.aggregated1;
                                    if (isExpandableToAdmin2) {
                                        showExpandCue = true;
                                    }
                                }
                                if (showExpandCue) {
                                    return (
                                        <td>
                                        <span className="expand-cue">{t("expandToSeeMoreClassification")}</span>
                                        </td>
                                    );
                                } else {
                                    return <td></td>;
                                }
                            }
                        })()}
                        <td>{row.population1}</td>
                        <td>{row.popPh2_1}</td>
                        <td>{row.isPlaceholder ? row.popPh3_1 : `${row.popPh3_1} (${formatPercentage(row.ph3OfTotalPercent1, 1)})`}</td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Table: Period2 Data */}
          <div className="table-block">
            <h4>{t("dataFor")} {period2} {t("inThousands")}</h4>
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
                {displayRows.map((row, i) => {
                    return (
                        <tr key={i}>
                        {(() => {
                            if (row.isPlaceholder) {
                                return <td></td>;
                            }
                            let showActualClassification = false;
                            if (row.level === 2) {
                                showActualClassification = true;
                            } else if (row.level === 1) {
                                const p2IsNA = row.classification2 === t("nA") || row.classification2 === t("noData");
                                const isAggregatedEndpointAdmin1ForP2 = row.aggregated2 || (p2IsNA && row.aggregated1);
                                showActualClassification = isAggregatedEndpointAdmin1ForP2;
                            }

                            if (showActualClassification) {
                                return (
                                <td style={cellStyle(row.classification2)}>
                                    {translateClassification(row.classification2, t)}
                                </td>
                                );
                            } else {
                                let showExpandCue = false;
                                if (row.level === 0) {
                                    const isAdmin0Expandable = !regionSelection.admin0 && !row.isSubRow;
                                    if (isAdmin0Expandable) {
                                        showExpandCue = true;
                                    }
                                } else if (row.level === 1) {
                                    const isExpandableToAdmin2 = !row.aggregated1;
                                    if (isExpandableToAdmin2) {
                                        showExpandCue = true;
                                    }
                                }
                                if (showExpandCue) {
                                    return (
                                        <td>
                                        <span className="expand-cue">{t("expandToSeeMoreClassification")}</span>
                                        </td>
                                    );
                                } else {
                                    return <td></td>;
                                }
                            }
                        })()}
                        <td>{row.population2}</td>
                        <td>{row.popPh2_2}</td>
                        <td>{row.isPlaceholder ? row.popPh3_2 : `${row.popPh3_2} (${formatPercentage(row.ph3OfTotalPercent2, 1)})`}</td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>

          {/* New Fourth Table Block: Analysis of Change */}
          <div className="table-block">
            <h4>{t("analysisOfChange")}</h4>
            <table className="comparison-table data-table-2col triple-table">
              <thead>
                <tr>
                  <th>{t("zoneChangeHeader")}</th>
                  <th>{t("populationChangeHeader")}</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => {
                  const zoneVisuals = !row.isPlaceholder && row.zoneChangeVisuals ? row.zoneChangeVisuals : { direction: 'neutral', color: 'default' };
                  const popVisuals = !row.isPlaceholder && row.populationChangeVisuals ? row.populationChangeVisuals : { direction: 'neutral', color: 'default' };
                  const zoneArrow = getArrowSymbol(zoneVisuals.direction);
                  const popArrow = getArrowSymbol(popVisuals.direction);

                  const zoneChangeText = row.isPlaceholder ? "" : row.zoneChange;
                  const populationChangeInThousandsText = row.isPlaceholder ? "" : row.populationChangeInThousands;
                  const ph3PopulationPercentChangeText = row.isPlaceholder ? "" : formatPercentage(row.ph3PopulationPercentChange, 1);

                  return (
                    <tr key={i}>
                      {row.isNonAnalyseeInAnyPeriod && !row.isPlaceholder ? (
                        <>
                          <td>N/A</td>
                          <td>N/A</td>
                        </>
                      ) : (
                        <>
                          <td style={{ color: zoneVisuals.color === 'default' ? 'inherit' : zoneVisuals.color }}>
                            {zoneArrow}{zoneChangeText}
                          </td>
                          <td style={{ color: popVisuals.color === 'default' ? 'inherit' : popVisuals.color }}>
                            {popArrow}{`${populationChangeInThousandsText} (${ph3PopulationPercentChangeText})`}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* <div className="mask-overlay" style={{ ... }}> ... </div> */}
      </div>
    </div>
  );
};

export default ComparisonTable;

[end of src/components/ComparisonTable.js]
