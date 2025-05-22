// src/components/RegionSelector.js
import React, { useState, useEffect } from 'react';
import '../styles/RegionSelector.css';
import { useTranslationHook } from "../i18n";

// Manual month lookup to ensure consistent names across environments
const MONTH_NAMES = {
  en: [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ],
  fr: [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre"
  ]
};

/**
 * Parse a period key like "October-2024", "2024-10", or "PJune-2025".
 * Returns { year, monthIndex, isPrediction } where monthIndex is 0-based, or monthIndex=-1 if unparseable.
 */
function parsePeriodKey(period) {
  const [a, b] = period.split("-");
  let year, rawMonth;

  if (/^\d{4}$/.test(a)) {
    year = +a;
    rawMonth = b;
  } else if (/^\d{4}$/.test(b)) {
    year = +b;
    rawMonth = a;
  } else {
    return { year: NaN, monthIndex: -1, isPrediction: false };
  }

  let isPrediction = false;
  if (/^[Pp]/.test(rawMonth)) {
    isPrediction = true;
    rawMonth = rawMonth.slice(1);
  }

  if (/^\d{1,2}$/.test(rawMonth)) {
    const idx = Math.min(Math.max(+rawMonth - 1, 0), 11);
    return { year, monthIndex: idx, isPrediction };
  }

  // Text month via Date fallback
  const date = new Date(`${rawMonth} 1, ${year}`);
  const idx = date.getMonth();
  if (isNaN(idx)) {
    return { year: NaN, monthIndex: -1, isPrediction };
  }
  return { year, monthIndex: idx, isPrediction };
}

/**
 * Format a raw period key into "YYYY [P.]MonthName" in the given locale.
 * Uses manual MONTH_NAMES to guarantee French translations.
 */
function formatPeriod(period, locale) {
  const { year, monthIndex, isPrediction } = parsePeriodKey(period);
  if (isNaN(year) || monthIndex < 0) return period;

  const lang = locale.startsWith("fr") ? "fr" : "en";
  const monthName = MONTH_NAMES[lang][monthIndex];
  const prefix = isPrediction ? 'P.' : '';

  return `${year} ${prefix}${monthName}`;
}

const RegionSelector = ({ geojsonData, onSelect }) => {
  // Translation + locale setup
  const { t, i18n } = useTranslationHook("analysis") || {};
  const rawLocale =
    (i18n && i18n.language) ? i18n.language :
    (typeof navigator !== "undefined" && navigator.language) ? navigator.language :
    "en";
  const locale = rawLocale;

  // Region hierarchy state
  const [hierarchy, setHierarchy] = useState({});
  const [admin0Options, setAdmin0Options] = useState([]);
  const [admin1Options, setAdmin1Options] = useState([]);
  const [admin2Options, setAdmin2Options] = useState([]);

  // Selected region levels
  const [selectedAdmin0, setSelectedAdmin0] = useState("");
  const [selectedAdmin1, setSelectedAdmin1] = useState("");
  const [selectedAdmin2, setSelectedAdmin2] = useState("");

  // Time periods state
  const [timeOptions, setTimeOptions] = useState([]);
  const [selectedPeriod1, setSelectedPeriod1] = useState("");
  const [selectedPeriod2, setSelectedPeriod2] = useState("");

  // Build region hierarchy
  useEffect(() => {
    if (!geojsonData || geojsonData.length === 0) return;
    const h = {};
    geojsonData.forEach(feature => {
      const props = feature.properties;
      const admin0 = props.admin0Name || "Unknown Country";
      const admin1 = props.admin1Name || "Unknown Region";
      const admin2 = props.admin2Name || "Unknown District";
      if (!h[admin0]) h[admin0] = {};
      if (!h[admin0][admin1]) h[admin0][admin1] = new Set();
      h[admin0][admin1].add(admin2);
    });
    Object.keys(h).forEach(a0 => {
      Object.keys(h[a0]).forEach(a1 => {
        h[a0][a1] = Array.from(h[a0][a1]).sort();
      });
    });
    setHierarchy(h);
    setAdmin0Options(Object.keys(h).sort());
  }, [geojsonData]);

  // Extract and sort time periods chronologically
  useEffect(() => {
    if (!geojsonData || geojsonData.length === 0) return;
    const periodSet = new Set();
    geojsonData.forEach(f => {
      Object.keys(f.properties)
        .filter(key => key.startsWith("classification_"))
        .forEach(key => periodSet.add(key.replace("classification_", "")));
    });
    const periods = Array.from(periodSet);
    periods.sort((p1, p2) => {
      const { year: y1, monthIndex: m1 } = parsePeriodKey(p1);
      const { year: y2, monthIndex: m2 } = parsePeriodKey(p2);
      if (y1 !== y2) return y1 - y2;
      return m1 - m2;
    });
    setTimeOptions(periods);
    if (periods.length >= 2) {
      setSelectedPeriod1(periods[periods.length - 2]);
      setSelectedPeriod2(periods[periods.length - 1]);
    } else if (periods.length === 1) {
      setSelectedPeriod1(periods[0]);
      setSelectedPeriod2(periods[0]);
    }
  }, [geojsonData]);

  // Update admin1 when admin0 changes
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

  // Update admin2 when admin1 or admin0 changes
  useEffect(() => {
    if (selectedAdmin0 && selectedAdmin1 && hierarchy[selectedAdmin0]?.[selectedAdmin1]) {
      setAdmin2Options(["", ...hierarchy[selectedAdmin0][selectedAdmin1]]);
      setSelectedAdmin2("");
    } else if (selectedAdmin0) {
      let allAdmin2 = [];
      Object.keys(hierarchy[selectedAdmin0]).forEach(region => {
        allAdmin2 = allAdmin2.concat(hierarchy[selectedAdmin0][region]);
      });
      allAdmin2 = Array.from(new Set(allAdmin2)).sort();
      setAdmin2Options(["", ...allAdmin2]);
      setSelectedAdmin2("");
    } else {
      setAdmin2Options([]);
      setSelectedAdmin2("");
    }
  }, [selectedAdmin1, selectedAdmin0, hierarchy]);

  // Notify parent of any selection change
  useEffect(() => {
    onSelect({
      region: { admin0: selectedAdmin0, admin1: selectedAdmin1, admin2: selectedAdmin2 },
      period1: selectedPeriod1,
      period2: selectedPeriod2,
      timeOptions
    });
  }, [selectedAdmin0, selectedAdmin1, selectedAdmin2, selectedPeriod1, selectedPeriod2, onSelect, timeOptions]);

  return (
    <div className="region-selector">
      <h3>{t("selectRegionAndTimePeriods")}</h3>
      <div className="region-selector-row">
        <div className="selector-group">
          <label>{t("countryLabel")}</label>
          <select
            value={selectedAdmin0}
            onChange={e => {
              const c = e.target.value;
              setSelectedAdmin0(c);
              setSelectedAdmin1("");
              setSelectedAdmin2("");
            }}
          >
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
            onChange={e => setSelectedAdmin1(e.target.value)}
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
            onChange={e => setSelectedAdmin2(e.target.value)}
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
          <select value={selectedPeriod1} onChange={e => setSelectedPeriod1(e.target.value)}>
            {timeOptions.map(key => (
                <option key={key} value={key}>{formatPeriod(key, locale)}</option>
            ))}
          </select>
        </div>
        <div className="selector-group">
          <label>{t("period2Label")}</label>
          <select value={selectedPeriod2} onChange={e => setSelectedPeriod2(e.target.value)}>
            {timeOptions.map(key => (
                <option key={key} value={key}>{formatPeriod(key, locale)}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector;
