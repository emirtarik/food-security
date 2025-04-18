// src/components/RegionSelector.js
import React, { useState, useEffect } from 'react';
import '../styles/RegionSelector.css';
import { useTranslationHook } from "../i18n";

const RegionSelector = ({ geojsonData, onSelect }) => {
  const { t } = useTranslationHook("analysis");

  // Log geojsonData to ensure it's arriving.
  useEffect(() => {
    console.log("RegionSelector: Received geojsonData:", geojsonData);
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

  // Time selection: derive available time periods from geojsonData.
  const [timeOptions, setTimeOptions] = useState([]);
  const [selectedPeriod1, setSelectedPeriod1] = useState("");
  const [selectedPeriod2, setSelectedPeriod2] = useState("");

  // Build the region hierarchy when geojsonData changes.
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
    // Convert sets to arrays and sort them.
    Object.keys(h).forEach(admin0 => {
      Object.keys(h[admin0]).forEach(admin1 => {
        h[admin0][admin1] = Array.from(h[admin0][admin1]).sort();
      });
    });
    console.log("Region hierarchy:", h);
    setHierarchy(h);
    setAdmin0Options(Object.keys(h).sort());
  }, [geojsonData]);

  // Dynamically extract time options from geojsonData.
  useEffect(() => {
    if (geojsonData && geojsonData.length > 0) {
      console.log("First feature properties:", geojsonData[0].properties);
      const periodSet = new Set();
      geojsonData.forEach(feature => {
        Object.keys(feature.properties)
          .filter(key => key.startsWith("classification_"))
          .forEach(key => {
            periodSet.add(key.replace("classification_", ""));
          });
      });
      const periods = Array.from(periodSet).sort();
      console.log("Extracted time periods:", periods);
      setTimeOptions(periods);
      if (periods.length >= 2) {
        setSelectedPeriod1(periods[periods.length - 2]);
        setSelectedPeriod2(periods[periods.length - 1]);
      } else if (periods.length === 1) {
        setSelectedPeriod1(periods[0]);
        setSelectedPeriod2(periods[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojsonData]);

  // Update admin1 options when admin0 selection changes.
  useEffect(() => {
    if (selectedAdmin0 && hierarchy[selectedAdmin0]) {
      const opts = Object.keys(hierarchy[selectedAdmin0]).sort();
      setAdmin1Options(["", ...opts]);
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

  // Update admin2 options when admin1 selection changes.
  useEffect(() => {
    if (selectedAdmin0 && selectedAdmin1 && hierarchy[selectedAdmin0]) {
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
      period2: selectedPeriod2,
      timeOptions
    };
    console.log("RegionSelector onSelect:", selection);
    onSelect(selection);
  }, [selectedAdmin0, selectedAdmin1, selectedAdmin2, selectedPeriod1, selectedPeriod2, onSelect, timeOptions]);

  return (
    <div className="region-selector">
      <h3>{t("selectRegionAndTimePeriods")}</h3>
      <div className="region-selector-row">
        <div className="selector-group">
          <label>{t("countryLabel")}</label>
          <select value={selectedAdmin0} onChange={(e) => setSelectedAdmin0(e.target.value)}>
            <option value="">{t("selectCountry")}</option>
            {admin0Options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>{t("regionAdmin1Label")}</label>
          <select
            value={selectedAdmin1}
            onChange={(e) => setSelectedAdmin1(e.target.value)}
            disabled={!selectedAdmin0}
          >
            <option value="">{t("allRegions")}</option>
            {admin1Options.filter(opt => opt !== "").map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>{t("districtLabel")}</label>
          <select
            value={selectedAdmin2}
            onChange={(e) => setSelectedAdmin2(e.target.value)}
            disabled={!selectedAdmin0}
          >
            <option value="">{t("allDistricts")}</option>
            {admin2Options.filter(opt => opt !== "").map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="region-selector-row time-row">
        <div className="selector-group">
          <label>{t("period1Label")}</label>
          <select value={selectedPeriod1} onChange={(e) => setSelectedPeriod1(e.target.value)}>
            {timeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>{t("period2Label")}</label>
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
