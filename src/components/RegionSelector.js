// src/components/RegionSelector.js
import React, { useState, useEffect } from 'react';
import '../styles/RegionSelector.css';

const RegionSelector = ({ geojsonData, onSelect }) => {
  // If geojsonData is not provided or empty, log a warning.
  useEffect(() => {
    if (!geojsonData || geojsonData.length === 0) {
      console.warn("RegionSelector: geojsonData is empty or undefined.");
    }
  }, [geojsonData]);

  // Build a nested hierarchy from the geojson data.
  // Assumes that each feature's properties contain admin0Name, admin1Name, and admin2Name.
  const [hierarchy, setHierarchy] = useState({});
  const [admin0Options, setAdmin0Options] = useState([]);
  const [admin1Options, setAdmin1Options] = useState([]);
  const [admin2Options, setAdmin2Options] = useState([]);

  // Selections: admin0 is required; admin1 and admin2 are optional.
  const [selectedAdmin0, setSelectedAdmin0] = useState("");
  const [selectedAdmin1, setSelectedAdmin1] = useState("");
  const [selectedAdmin2, setSelectedAdmin2] = useState("");

  // Time selection: define available time periods.
  const timeOptions = ["March-2024", "October-2024", "PJune-2025"];
  const [selectedPeriod1, setSelectedPeriod1] = useState(timeOptions[0]);
  const [selectedPeriod2, setSelectedPeriod2] = useState(timeOptions[1]);

  // Build the hierarchy when geojsonData changes.
  useEffect(() => {
    if (!geojsonData || geojsonData.length === 0) return;
    const h = {};
    geojsonData.forEach(feature => {
      const props = feature.properties;
      const admin0 = props.admin0Name || "Unknown Country";
      const admin1 = props.admin1Name || "Unknown Region";
      const admin2 = props.admin2Name || "Unknown District";
      if (!h[admin0]) {
        h[admin0] = {};
      }
      if (!h[admin0][admin1]) {
        h[admin0][admin1] = new Set();
      }
      h[admin0][admin1].add(admin2);
    });
    // Convert sets to arrays and sort.
    Object.keys(h).forEach(admin0 => {
      Object.keys(h[admin0]).forEach(admin1 => {
        h[admin0][admin1] = Array.from(h[admin0][admin1]).sort();
      });
    });
    setHierarchy(h);
    setAdmin0Options(Object.keys(h).sort());
  }, [geojsonData]);

  // Update admin1 options when admin0 changes.
  useEffect(() => {
    if (selectedAdmin0 && hierarchy[selectedAdmin0]) {
      setAdmin1Options(["", ...Object.keys(hierarchy[selectedAdmin0]).sort()]);
      setSelectedAdmin1("");
      setAdmin2Options([]);
      setSelectedAdmin2("");
    } else {
      setAdmin1Options([]);
      setSelectedAdmin1("");
      setAdmin2Options([]);
      setSelectedAdmin2("");
    }
  }, [selectedAdmin0, hierarchy]);

  // Update admin2 options when admin1 changes.
  useEffect(() => {
    if (selectedAdmin0 && selectedAdmin1) {
      setAdmin2Options(["", ...hierarchy[selectedAdmin0][selectedAdmin1]]);
      setSelectedAdmin2("");
    } else if (selectedAdmin0) {
      // If admin1 is not selected, aggregate all admin2s under selected admin0.
      let allAdmin2 = [];
      Object.keys(hierarchy[selectedAdmin0]).forEach(region => {
        allAdmin2 = allAdmin2.concat(Array.from(hierarchy[selectedAdmin0][region]));
      });
      allAdmin2 = Array.from(new Set(allAdmin2)).sort();
      setAdmin2Options(["", ...allAdmin2]);
      setSelectedAdmin2("");
    } else {
      setAdmin2Options([]);
      setSelectedAdmin2("");
    }
  }, [selectedAdmin1, selectedAdmin0, hierarchy]);

  // Whenever any selection (region or time) changes, call onSelect.
  useEffect(() => {
    const selection = {
      region: {
        admin0: selectedAdmin0,
        admin1: selectedAdmin1,
        admin2: selectedAdmin2
      },
      period1: selectedPeriod1,
      period2: selectedPeriod2
    };
    console.log("RegionSelector onSelect:", selection);
    onSelect(selection);
  }, [selectedAdmin0, selectedAdmin1, selectedAdmin2, selectedPeriod1, selectedPeriod2, onSelect]);

  return (
    <div className="region-selector">
      <h3>Select Region & Time Periods</h3>
      <div className="region-selector-row">
        <div className="selector-group">
          <label>Country (admin0):</label>
          <select value={selectedAdmin0} onChange={(e) => setSelectedAdmin0(e.target.value)}>
            <option value="">Select Country</option>
            {admin0Options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>Region (admin1):</label>
          <select
            value={selectedAdmin1}
            onChange={(e) => setSelectedAdmin1(e.target.value)}
            disabled={!selectedAdmin0}
          >
            <option value="">All Regions</option>
            {admin1Options.filter(opt => opt !== "").map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>District (admin2):</label>
          <select
            value={selectedAdmin2}
            onChange={(e) => setSelectedAdmin2(e.target.value)}
            disabled={!selectedAdmin0}
          >
            <option value="">All Districts</option>
            {admin2Options.filter(opt => opt !== "").map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="region-selector-row time-row">
        <div className="selector-group">
          <label>Period 1:</label>
          <select value={selectedPeriod1} onChange={(e) => setSelectedPeriod1(e.target.value)}>
            {timeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>Period 2:</label>
          <select value={selectedPeriod2} onChange={(e) => setSelectedPeriod2(e.target.value)}>
            {timeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector;
