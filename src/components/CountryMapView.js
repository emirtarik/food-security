// src/components/CountryMapView.js
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '../styles/MapView.css'; // Keep for potential shared popup styles
import '../styles/CountryMapView.css'; // Import new dedicated styles
import { useTranslationHook } from "../i18n";
import { countryNameToISO3, countryBoundingBoxes } from '../utils/mapCoordinates';

// Set your Mapbox access token.
mapboxgl.accessToken =
  'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

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

// Classification severity mapping for change detection
const classificationSeverity = {
  "Non analysée": 0,
  "Phase 1 : minimal": 1,
  "Phase 2 : sous pression": 2,
  "Phase 3 : crises": 3,
  "Phase 4 : urgence": 4,
  "Phase 5 : famine": 5,
  "inaccessible": 6
};

// Helper functions from ComparisonTable for consistent calculations
const parseNumber = (value) => {
  const str = String(value).replace(/,/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatNumber = (num) => {
  let n = typeof num === 'number' ? num : parseNumber(num);
  if (isNaN(n)) return num;
  n = Math.trunc(n);
  return n.toLocaleString();
};

const formatPercentage = (value, decimalPlaces = 1) => {
  if (value === null || value === undefined) return "—";
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return "N/A";
  return value.toFixed(decimalPlaces) + "%";
};

/**
 * Parse a period key like "October-2024", "2024-10", or "PJune-2025".
 * Returns { year, monthIndex, isPrediction } where monthIndex is 0-based, or monthIndex=-1 if unparseable.
 */
function parsePeriodKey(periodKey) { // Renamed param for clarity
  if (!periodKey) return { year: NaN, monthIndex: -1, isPrediction: false };
  const [a, b] = periodKey.split("-");
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

  const date = new Date(`${rawMonth} 1, ${year}`);
  const idx = date.getMonth();
  if (isNaN(idx)) {
    return { year: NaN, monthIndex: -1, isPrediction };
  }
  return { year, monthIndex: idx, isPrediction };
}

/**
 * Format a raw period key into "YYYY [P.]MonthName" in the given locale.
 */
function formatPeriod(periodKey, locale) { // Renamed param for clarity
  const { year, monthIndex, isPrediction } = parsePeriodKey(periodKey);
  if (isNaN(year) || monthIndex < 0) return periodKey;

  const lang = typeof locale === 'string' && locale.startsWith("fr") ? "fr" : "en";
  const monthName = MONTH_NAMES[lang][monthIndex];
  const prefix = isPrediction ? 'P.' : '';

  return `${year} ${prefix}${monthName}`;
}

/**
 * Determine if situation is improving or deteriorating based on classification severity
 * Returns color with intensity based on severity of change
 */
function getSituationChange(currentClassification, otherClassification) {
  const currentSeverity = classificationSeverity[currentClassification] || 0;
  const otherSeverity = classificationSeverity[otherClassification] || 0;
  
  // If either period is "Non analysée", return white
  if (currentClassification === "Non analysée" || otherClassification === "Non analysée") {
    return { 
      status: 'unanalyzed', 
      color: '#ffffff', 
      severity: 0,
      opacity: 0
    };
  }
  
  if (currentSeverity > otherSeverity) {
    // Deteriorating - use darker red based on severity
    const severity = currentSeverity - otherSeverity;
    const intensity = Math.min(0.3 + (severity * 0.15), 0.9); // 0.3 to 0.9 opacity
    const redValue = Math.floor(255 * (0.6 + (severity * 0.1))); // 153 to 255 red
    const greenValue = Math.floor(255 * (0.1 + (severity * 0.05))); // 26 to 51 green
    const blueValue = Math.floor(255 * (0.1 + (severity * 0.05))); // 26 to 51 blue
    
    return { 
      status: 'deteriorating', 
      color: `rgb(${redValue}, ${greenValue}, ${blueValue})`, 
      severity: severity,
      opacity: intensity
    };
  } else if (currentSeverity < otherSeverity) {
    // Improving - use darker green based on severity
    const severity = otherSeverity - currentSeverity;
    const intensity = Math.min(0.3 + (severity * 0.15), 0.9); // 0.3 to 0.9 opacity
    const redValue = Math.floor(255 * (0.1 + (severity * 0.05))); // 26 to 51 red
    const greenValue = Math.floor(255 * (0.6 + (severity * 0.1))); // 153 to 255 green
    const blueValue = Math.floor(255 * (0.1 + (severity * 0.05))); // 26 to 51 blue
    
    return { 
      status: 'improving', 
      color: `rgb(${redValue}, ${greenValue}, ${blueValue})`, 
      severity: severity,
      opacity: intensity
    };
  } else {
    // No change - use consistent gray (fully opaque to cover base colors)
    return { 
      status: 'stable', 
      color: '#cccccc', 
      severity: 0,
      opacity: 1.0  // Fully opaque to ensure consistent gray regardless of base phase
    };
  }
}

const CountryMapView = ({ country, currentPeriod, otherPeriod, data, showChangeOverlay = true }) => {
  const { t, i18n = {} } = useTranslationHook("analysis") || {};
  const currentLocale = i18n.language || (typeof navigator !== "undefined" && navigator.language) || "en";

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const translateClassification = (classification, t) => {
    switch (classification) {
      case "Non analysée": return t("nonAnalyzed");
      case "Phase 1 : minimal": return t("phase1");
      case "Phase 2 : sous pression": return t("phase2");
      case "Phase 3 : crises": return t("phase3");
      case "Phase 4 : urgence": return t("phase4");
      case "Phase 5 : famine": return t("phase5");
      case "inaccessible": return t("inaccessible");
      default: return classification || t("unknownClassification");
    }
  };

  useEffect(() => {
    // Ensure currentPeriod is defined before proceeding
    if (!mapContainerRef.current || !country || !currentPeriod || !data) return;

    const countryISO3 = countryNameToISO3[country];
    const bbox = countryISO3 ? countryBoundingBoxes[countryISO3] : null;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [20, 5],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => {
      setIsMapLoaded(true);

      if (bbox) {
        const fitBoundsOptions = { padding: 30, duration: 0 };
        if (countryISO3 === 'GNB') { fitBoundsOptions.maxZoom = 6.5; }
        else if (countryISO3 === 'CIV') { fitBoundsOptions.maxZoom = 6.5; }
        map.fitBounds(bbox, fitBoundsOptions);
      } else {
        console.warn(`No bounding box for ${country} (ISO3: ${countryISO3}). Using fallback.`);
        const countryFeature = data.find((f) => f.properties.admin0Name === country);
        if (countryFeature && countryFeature.geometry) {
          if (countryFeature.geometry.type === 'Point') {
            map.setCenter(countryFeature.geometry.coordinates);
            map.setZoom(6);
          } else if (countryFeature.geometry.type === 'Polygon' || countryFeature.geometry.type === 'MultiPolygon') {
            try {
              let minLng, maxLng, minLat, maxLat;
              const allCoords = countryFeature.geometry.type === 'Polygon'
                  ? countryFeature.geometry.coordinates.flat(1)
                  : countryFeature.geometry.coordinates.flat(2);
              allCoords.forEach(coord => {
                  if (minLng === undefined || coord[0] < minLng) minLng = coord[0];
                  if (maxLng === undefined || coord[0] > maxLng) maxLng = coord[0];
                  if (minLat === undefined || coord[1] < minLat) minLat = coord[1];
                  if (maxLat === undefined || coord[1] > maxLat) maxLat = coord[1];
              });
              if (minLng !== undefined) {
                map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 0 });
              }
            } catch (e) { console.error("Fallback center error:", e); }
          }
        }
      }

      let featuresForCountry;
      if (countryISO3 && data.length > 0 && data[0].properties.iso_a3) {
        featuresForCountry = data.filter(f => f.properties.iso_a3 === countryISO3);
        if (featuresForCountry.length === 0) {
          console.warn(`No features for ISO3 ${countryISO3}. Falling back to admin0Name for ${country}.`);
          featuresForCountry = data.filter(f => f.properties.admin0Name === country);
        }
      } else {
        featuresForCountry = data.filter(f => f.properties.admin0Name === country);
      }

      // Add situation change data to features
      const featuresWithChange = featuresForCountry.map(feature => {
        const props = feature.properties;
        const currentClassificationField = `classification_${currentPeriod}`;
        const otherClassificationField = `classification_${otherPeriod}`;
        
        const currentClassification = props[currentClassificationField] || 'Non analysée';
        const otherClassification = props[otherClassificationField] || 'Non analysée';
        
        const change = getSituationChange(currentClassification, otherClassification);
        
        return {
          ...feature,
          properties: {
            ...props,
            situationChange: change.status,
            changeColor: change.color,
            changeSeverity: change.severity,
            changeOpacity: change.opacity,
            currentClassification,
            otherClassification
          }
        };
      });

      map.addSource('country-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: featuresWithChange }
      });

      // Base classification layer
      const classificationField = `classification_${currentPeriod}`;
      const fillColorExpression = [
        'match', ['get', classificationField],
        'Non analysée', '#ffffff', 'Phase 1 : minimal', '#d3f3d4',
        'Phase 2 : sous pression', '#ffe252', 'Phase 3 : crises', '#fa890f',
        'Phase 4 : urgence', '#eb3333', 'Phase 5 : famine', '#60090b',
        'inaccessible', '#cccccc', '#ffffff'
      ];

      map.addLayer({
        id: 'country-fill', 
        type: 'fill', 
        source: 'country-data', 
        layout: {},
        paint: { 'fill-color': fillColorExpression, 'fill-opacity': 0.9 }
      });

      // Situation change overlay layer
      if (showChangeOverlay && otherPeriod) {
        map.addLayer({
          id: 'situation-change-overlay',
          type: 'fill',
          source: 'country-data',
          layout: {},
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'situationChange'], 'deteriorating'], ['get', 'changeColor'],
              ['==', ['get', 'situationChange'], 'improving'], ['get', 'changeColor'],
              ['==', ['get', 'situationChange'], 'stable'], ['get', 'changeColor'],
              ['==', ['get', 'situationChange'], 'unanalyzed'], ['get', 'changeColor'],
              'rgba(255, 255, 255, 0)'
            ],
            'fill-opacity': [
              'case',
              ['==', ['get', 'situationChange'], 'deteriorating'], ['get', 'changeOpacity'],
              ['==', ['get', 'situationChange'], 'improving'], ['get', 'changeOpacity'],
              ['==', ['get', 'situationChange'], 'stable'], ['get', 'changeOpacity'],
              ['==', ['get', 'situationChange'], 'unanalyzed'], ['get', 'changeOpacity'],
              0
            ]
          }
        });
      }

      map.addLayer({
        id: 'country-outline', 
        type: 'line', 
        source: 'country-data', 
        layout: {},
        paint: { 'line-color': '#555', 'line-width': 1 }
      });

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'custom-popup' });

      // Build list of interactive layers dynamically
      const getInteractiveLayers = () => {
        const layers = ['country-fill'];
        if (showChangeOverlay && otherPeriod && map.getLayer('situation-change-overlay')) {
          layers.unshift('situation-change-overlay');
        }
        return layers;
      };

      // Set up cursor on hover
      ['country-fill', 'situation-change-overlay'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
        }
      });

      // Use map-level mousemove with queryRenderedFeatures to avoid double tooltips
      let hoveredFeatureId = null;
      map.on('mousemove', (e) => {
        const interactiveLayers = getInteractiveLayers().filter(id => map.getLayer(id));
        const feats = map.queryRenderedFeatures(e.point, { layers: interactiveLayers });
        
        if (!feats || feats.length === 0) {
          popup.remove();
          hoveredFeatureId = null;
          return;
        }
        
        const feature = feats[0];
        const props = feature.properties;

          // Current period data
          const currentClassificationField = `classification_${currentPeriod}`;
          const currentPopulationTotalField = `population_total_${currentPeriod}`;
          const currentPopulationPh2Field = `population_ph2_${currentPeriod}`;
          const currentPopulationPh3Field = `population_ph3_${currentPeriod}`;
          const currentLevelField = `level_${currentPeriod}`;
          const currentClassificationValue = props[currentClassificationField] || 'Non analysée';

          // Other period data
          const otherClassificationField = `classification_${otherPeriod}`;
          const otherPopulationTotalField = `population_total_${otherPeriod}`;
          const otherPopulationPh2Field = `population_ph2_${otherPeriod}`;
          const otherPopulationPh3Field = `population_ph3_${otherPeriod}`;
          const otherClassificationValue = props[otherClassificationField] || 'Non analysée';

          // Calculate differences using same logic as ComparisonTable
          const popTotalCurrent = parseNumber(props[currentPopulationTotalField]);
          const popTotalOther = parseNumber(props[otherPopulationTotalField]);
          const popTotalDiff = popTotalCurrent - popTotalOther;
          const popTotalDiffInThousands = Math.trunc(popTotalDiff / 1000);
          const popTotalPct = popTotalOther > 0 ? (popTotalDiff / popTotalOther) * 100 : null;

          const popPh3Current = parseNumber(props[currentPopulationPh3Field]);
          const popPh3Other = parseNumber(props[otherPopulationPh3Field]);
          const popPh3Diff = popPh3Current - popPh3Other;
          const popPh3DiffInThousands = Math.trunc(popPh3Diff / 1000);
          
          let popPh3PopulationPercentChange = 0;
          if (popPh3Other !== 0) {
            popPh3PopulationPercentChange = (popPh3Diff / popPh3Other) * 100;
          } else if (popPh3Diff !== 0) {
            popPh3PopulationPercentChange = null;
          }

          const formatDiff = (val) => (val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString());
          const formatPct = (val) => (val === null ? '—' : `${(val >= 0 ? '+' : '')}${Math.abs(val).toFixed(1)}%`);

          // Situation change indicator
          const situationChange = props.situationChange || 'stable';
          const changeIndicator = situationChange === 'deteriorating' ? '🔴' : 
                                 situationChange === 'improving' ? '🟢' : '⚪';

          let bgColor = '#ffffff';
          if (currentClassificationValue === 'Non analysée') bgColor = '#ffffff';
          else if (currentClassificationValue === 'Phase 1 : minimal') bgColor = '#d3f3d4';
          else if (currentClassificationValue === 'Phase 2 : sous pression') bgColor = '#ffe252';
          else if (currentClassificationValue === 'Phase 3 : crises') bgColor = '#fa890f';
          else if (currentClassificationValue === 'Phase 4 : urgence') bgColor = '#eb3333';
          else if (currentClassificationValue === 'Phase 5 : famine') bgColor = '#60090b';
          else if (currentClassificationValue === 'inaccessible') bgColor = '#cccccc';

          // Get flag filename using the shared function from MapView.js
          const countryNameForFlag = props["admin0Name"] || "";
          const flagMap = {
            'Nigeria': 'nigeria.svg',
            'Senegal': 'senegal.svg',
            'Burkina Faso': 'burkina-faso.svg',
            'Côte d\'Ivoire': ['côte-d\'ivoire.svg', 'ivory-coast.svg'],
            'Mali': 'mali.svg',
            'Niger': 'niger.svg',
            'Chad': 'chad.svg',
            'Ghana': 'ghana.svg',
            'Guinea': 'guinea.svg',
            'Guinea-Bissau': 'guinea-bissau.svg',
            'Liberia': 'liberia.svg',
            'Sierra Leone': 'sierra-leone.svg',
            'Togo': 'togo.svg',
            'Benin': 'benin.svg',
            'Gambia': 'gambia.svg',
            'Cabo Verde': 'cabo-verde.svg',
            'Mauritania': 'mauritania.svg'
          };
          const filename = flagMap[countryNameForFlag];
          let primaryFlag = null, fallbackFlag = null;
          if (filename) {
            if (Array.isArray(filename)) {
              primaryFlag = filename[0];
              fallbackFlag = filename[1] || null;
            } else {
              primaryFlag = filename;
            }
          }
          const flagURL = primaryFlag ? `/flags/${primaryFlag}` : '';
          const fallbackFlagURL = fallbackFlag ? `/flags/${fallbackFlag}` : '';

          const aggregatedNotice = (props[currentLevelField] === 1 || props[currentLevelField] === '1' || props[currentLevelField] === "true" || props[currentLevelField] === true)
            ? `<div class="popup-aggregated-box"><div class="popup-aggregated">⚠️ ${t("dataAggregated")}</div></div>`
            : '';

          // Updated popup content matching MapView.js style
          const popupContent = `
            <div class="popup-content">
              ${aggregatedNotice}
              <div class="popup-header-section">
                <div class="popup-location-info">
                  <h3 class="popup-title">${props["admin2Name"] || t("unknownDistrict")}</h3>
                  <p class="popup-subtitle">${props["admin1Name"] || t("unknownRegion")}, ${countryNameForFlag}</p>
                </div>
                <div class="popup-flag">
                  <img src="${flagURL}" alt="${t("flag")}" ${fallbackFlagURL ? `onerror="this.src='${fallbackFlagURL}'; this.onerror=null;"` : ''} />
                </div>
              </div>
              
              <div class="popup-classification-section">
                <div class="popup-classification-box" style="background-color: ${bgColor};">
                  <h4 class="popup-classification-text">
                    ${translateClassification(otherClassificationValue, t)} → ${translateClassification(currentClassificationValue, t)} ${changeIndicator}
                  </h4>
                </div>
              </div>
              
              <div class="popup-stats-section">
                <div class="popup-stats-grid">
                  <div class="popup-stat-item">
                    <div class="popup-stat-content">
                      <div class="popup-stat-label">${t("populationTotal")}</div>
                      <div class="popup-stat-value">${formatNumber(popTotalDiffInThousands)} (${formatPct(popTotalPct)})</div>
                    </div>
                  </div>
                  <div class="popup-stat-item">
                    <div class="popup-stat-content">
                      <div class="popup-stat-label">${t("populationPh3")}</div>
                      <div class="popup-stat-value">${formatNumber(popPh3DiffInThousands)} (${formatPercentage(popPh3PopulationPercentChange, 1)})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      });

      map.on('mouseleave', 'country-fill', () => {
        popup.remove();
        hoveredFeatureId = null;
      });
      
      if (showChangeOverlay && otherPeriod && map.getLayer('situation-change-overlay')) {
        map.on('mouseleave', 'situation-change-overlay', () => {
          popup.remove();
          hoveredFeatureId = null;
        });
      }
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      setIsMapLoaded(false);
    };
  }, [country, currentPeriod, otherPeriod, data, t, currentLocale, showChangeOverlay]); // Added showChangeOverlay

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !currentPeriod) return;
    const map = mapRef.current;
    const layerId = 'country-fill';
    if (map.getLayer(layerId)) {
      const classificationField = `classification_${currentPeriod}`;
      const fillColorExpression = [
        'match', ['get', classificationField],
        'Non analysée', '#ffffff', 'Phase 1 : minimal', '#d3f3d4',
        'Phase 2 : sous pression', '#ffe252', 'Phase 3 : crises', '#fa890f',
        'Phase 4 : urgence', '#eb3333', 'Phase 5 : famine', '#60090b',
        'inaccessible', '#cccccc', '#ffffff'
      ];
      map.setPaintProperty(layerId, 'fill-color', fillColorExpression);
    }
    if (map.getSource('country-data') && data) {
        // Re-filter data if country or relevant properties change, though main filtering is on load.
        // This ensures data source is updated if 'data' prop itself changes structure/content for the country.
        const countryISO3 = countryNameToISO3[country];
        let featuresForCountry;
        if (countryISO3 && data.length > 0 && data[0].properties.iso_a3) {
            featuresForCountry = data.filter(f => f.properties.iso_a3 === countryISO3);
            if (featuresForCountry.length === 0) {
                featuresForCountry = data.filter(f => f.properties.admin0Name === country);
            }
        } else {
            featuresForCountry = data.filter(f => f.properties.admin0Name === country);
        }

        // Update features with change data
        const featuresWithChange = featuresForCountry.map(feature => {
          const props = feature.properties;
          const currentClassificationField = `classification_${currentPeriod}`;
          const otherClassificationField = `classification_${otherPeriod}`;
          
          const currentClassification = props[currentClassificationField] || 'Non analysée';
          const otherClassification = props[otherClassificationField] || 'Non analysée';
          
          const change = getSituationChange(currentClassification, otherClassification);
          
          return {
            ...feature,
            properties: {
              ...props,
              situationChange: change.status,
              changeColor: change.color,
              changeSeverity: change.severity,
              changeOpacity: change.opacity,
              currentClassification,
              otherClassification
            }
          };
        });

        map.getSource('country-data').setData({
            type: 'FeatureCollection', features: featuresWithChange
        });
    }
  }, [country, currentPeriod, otherPeriod, data, isMapLoaded, showChangeOverlay]); // Added showChangeOverlay

  if (!country || !currentPeriod) {
    return <div>{t("selectCountryAndPeriod")}</div>;
  }

  return (
    <div className="country-map-view">
      <div className="country-map-title">
        {`${country} - ${formatPeriod(currentPeriod, currentLocale)} vs ${formatPeriod(otherPeriod, currentLocale)}`}
      </div>
      <div ref={mapContainerRef} className="country-map-container-inner">
        {showChangeOverlay && otherPeriod && (
          <div className="change-legend map-legend">
            <div className="legend-section">
              <span className="legend-label">{t("improving")}:</span>
              <div className="legend-shades">
                <span className="legend-shade-item" title="1 phase improvement">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(38, 178, 38, 0.45)' }}></span>
                </span>
                <span className="legend-shade-item" title="2 phase improvement">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(51, 204, 51, 0.6)' }}></span>
                </span>
                <span className="legend-shade-item" title="3 phase improvement">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(63, 229, 63, 0.75)' }}></span>
                </span>
                <span className="legend-shade-item" title="4+ phase improvement">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(76, 255, 76, 0.9)' }}></span>
                </span>
              </div>
            </div>
            <div className="legend-section">
              <span className="legend-label">{t("deteriorating")}:</span>
              <div className="legend-shades">
                <span className="legend-shade-item" title="1 phase deterioration">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(178, 38, 38, 0.45)' }}></span>
                </span>
                <span className="legend-shade-item" title="2 phase deterioration">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(204, 51, 51, 0.6)' }}></span>
                </span>
                <span className="legend-shade-item" title="3 phase deterioration">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(229, 63, 63, 0.75)' }}></span>
                </span>
                <span className="legend-shade-item" title="4+ phase deterioration">
                  <span className="legend-shade" style={{ backgroundColor: 'rgba(255, 76, 76, 0.9)' }}></span>
                </span>
              </div>
            </div>
            <div className="legend-section">
              <span className="legend-item">
                <span className="legend-color stable"></span> {t("noChange")}
              </span>
            </div>
            <div className="legend-section">
              <span className="legend-item">
                <span className="legend-color unanalyzed"></span> {t("nonAnalyzed")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryMapView;
