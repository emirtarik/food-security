// src/components/ComparisonTable.js
import React, { useEffect, useState } from 'react';
import '../styles/ComparisonTable.css';

// Define a severity mapping for classification.
const classificationSeverity = {
  "Non analysée": 0,
  "Phase 1 : minimal": 1,
  "Phase 2 : sous pression": 2,
  "Phase 3 : crises": 3,
  "Phase 4 : urgence": 4,
  "inaccessible": 5
};

const severityToClassification = (sev) => {
  for (let key in classificationSeverity) {
    if (classificationSeverity[key] === sev) return key;
  }
  return "Unknown";
};

// Aggregates an array of feature properties.
const aggregateFeatures = (features) => {
  let totalPop = 0;
  let totalPh2 = 0;
  let totalPh3 = 0;
  let maxSeverity = -1;

  features.forEach(f => {
    const cl = f["classification"];
    const sev = classificationSeverity[cl] !== undefined ? classificationSeverity[cl] : 0;
    if (sev > maxSeverity) maxSeverity = sev;

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

// Groups data based on region selection.
// regionSelection is an object { admin0, admin1, admin2 } where empty strings mean "all".
const groupDataByRegion = (data, regionSelection) => {
  const { admin0, admin1, admin2 } = regionSelection;
  const groups = {};

  if (admin0 && !admin1) {
    // Only admin0 selected: group by admin1.
    data.forEach(f => {
      if (f.admin0Name === admin0) {
        const key = f.admin1Name || "Unknown Region";
        groups[key] = groups[key] || [];
        groups[key].push(f);
      }
    });
  } else if (admin0 && admin1 && !admin2) {
    // admin0 and admin1 selected: group by admin2.
    data.forEach(f => {
      if (f.admin0Name === admin0 && f.admin1Name === admin1) {
        const key = f.admin2Name || "Unknown District";
        groups[key] = groups[key] || [];
        groups[key].push(f);
      }
    });
  } else if (admin0 && admin1 && admin2) {
    // All three selected: single group.
    const filtered = data.filter(f =>
      f.admin0Name === admin0 &&
      f.admin1Name === admin1 &&
      f.admin2Name === admin2
    );
    if (filtered.length > 0) {
      groups[admin2] = filtered;
    }
  } else {
    // If no region is selected, group by admin0.
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
  period1,
  period2
}) => {
  const [dataPeriod1, setDataPeriod1] = useState([]);
  const [dataPeriod2, setDataPeriod2] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data for both periods.
  useEffect(() => {
    const fetchData = async (period) => {
      try {
        const res = await fetch(`/data/joined_admin2_${period}.geojson`);
        const geojson = await res.json();
        return geojson.features.map(f => f.properties);
      } catch (error) {
        console.error(`Error fetching data for ${period}:`, error);
        return [];
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      const d1 = await fetchData(period1);
      const d2 = await fetchData(period2);
      setDataPeriod1(d1);
      setDataPeriod2(d2);
      setLoading(false);
    };
    loadAllData();
  }, [period1, period2]);

  if (loading) {
    return <div className="comparison-table-container">Loading comparison data...</div>;
  }

  // Group data based on region selection.
  const grouped1 = groupDataByRegion(dataPeriod1, regionSelection);
  const grouped2 = groupDataByRegion(dataPeriod2, regionSelection);

  // Build a rows array. Each row is one region.
  const rowKeys = Object.keys(grouped1);
  const rows = rowKeys.map(regionName => {
    const agg1 = aggregateFeatures(grouped1[regionName]);
    const agg2 = grouped2[regionName] ? aggregateFeatures(grouped2[regionName]) : null;
    
    // Classification change logic.
    const sev1 = classificationSeverity[agg1.classification] ?? 0;
    const sev2 = agg2 ? (classificationSeverity[agg2.classification] ?? 0) : -1;
    let classificationChange = "No change";
    if (!agg2) {
      classificationChange = "N/A";
    } else if (sev2 > sev1) {
      classificationChange = "Worse";
    } else if (sev2 < sev1) {
      classificationChange = "Better";
    }

    return {
      region: regionName,
      classification1: agg1.classification,
      population1: agg1.pop,
      popPh2_1: agg1.ph2,
      popPh3_1: agg1.ph3,
      classification2: agg2 ? agg2.classification : "N/A",
      population2: agg2 ? agg2.pop : 0,
      popPh2_2: agg2 ? agg2.ph2 : 0,
      popPh3_2: agg2 ? agg2.ph3 : 0,
      classificationChange
    };
  });

  return (
    <div className="comparison-table-container">
      <h3>Comparison Table</h3>
      <p>Comparing data for periods: {period1} vs {period2}</p>

      <div className="triple-table-wrapper">
        {/* Left Table: Regions */}
        <div className="table-block region-table">
          <h4>Regions</h4>
          <table className="comparison-table triple-table">
            <thead>
              <tr>
                <th>Region</th>
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
          <h4>Data for {period1}</h4>
          <table className="comparison-table triple-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Population</th>
                <th>Pop Ph 2</th>
                <th>Pop Ph 3-5</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.classification1}</td>
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
          <h4>Data for {period2}</h4>
          <table className="comparison-table triple-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Population</th>
                <th>Pop Ph 2</th>
                <th>Pop Ph 3-5</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.classification2}</td>
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
    </div>
  );
};

export default ComparisonTable;
