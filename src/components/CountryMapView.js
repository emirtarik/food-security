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


const CountryMapView = ({ country, currentPeriod, otherPeriod, data }) => {
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

      map.addSource('country-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: featuresForCountry }
      });

      const classificationField = `classification_${currentPeriod}`;
      const fillColorExpression = [
        'match', ['get', classificationField],
        'Non analysée', '#ffffff', 'Phase 1 : minimal', '#d3f3d4',
        'Phase 2 : sous pression', '#ffe252', 'Phase 3 : crises', '#fa890f',
        'Phase 4 : urgence', '#eb3333', 'Phase 5 : famine', '#60090b',
        'inaccessible', '#cccccc', '#ffffff'
      ];

      map.addLayer({
        id: 'country-fill', type: 'fill', source: 'country-data', layout: {},
        paint: { 'fill-color': fillColorExpression, 'fill-opacity': 0.9 }
      });
      map.addLayer({
        id: 'country-outline', type: 'line', source: 'country-data', layout: {},
        paint: { 'line-color': '#555', 'line-width': 1 }
      });

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'custom-popup' });

      map.on('mouseenter', 'country-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'country-fill', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

      map.on('mousemove', 'country-fill', (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;

          // Current period data
          const currentClassificationField = `classification_${currentPeriod}`;
          const currentPopulationTotalField = `population_total_${currentPeriod}`;
          const currentPopulationPh2Field = `population_ph2_${currentPeriod}`;
          const currentPopulationPh3Field = `population_ph3_${currentPeriod}`;
          const currentLevelField = `level_${currentPeriod}`;
          const currentClassificationValue = props[currentClassificationField] || 'Non analysée';

          // Other period data
          const otherPopulationTotalField = `population_total_${otherPeriod}`;
          const otherPopulationPh2Field = `population_ph2_${otherPeriod}`;
          const otherPopulationPh3Field = `population_ph3_${otherPeriod}`;

          // Calculate differences (simple numeric subtraction, ensure values are numbers)
          const getNum = val => (typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))) || 0;

          const popTotalCurrent = getNum(props[currentPopulationTotalField]);
          const popTotalOther = getNum(props[otherPopulationTotalField]);
          const popTotalDiff = popTotalCurrent - popTotalOther;

          const popPh2Current = getNum(props[currentPopulationPh2Field]);
          const popPh2Other = getNum(props[otherPopulationPh2Field]);
          const popPh2Diff = popPh2Current - popPh2Other;

          const popPh3Current = getNum(props[currentPopulationPh3Field]);
          const popPh3Other = getNum(props[otherPopulationPh3Field]);
          const popPh3Diff = popPh3Current - popPh3Other;

          const formatDiff = (val) => (val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString());

          let bgColor = '#ffffff';
          if (currentClassificationValue === 'Non analysée') bgColor = '#ffffff';
          else if (currentClassificationValue === 'Phase 1 : minimal') bgColor = '#d3f3d4';
          else if (currentClassificationValue === 'Phase 2 : sous pression') bgColor = '#ffe252';
          else if (currentClassificationValue === 'Phase 3 : crises') bgColor = '#fa890f';
          else if (currentClassificationValue === 'Phase 4 : urgence') bgColor = '#eb3333';
          else if (currentClassificationValue === 'Phase 5 : famine') bgColor = '#60090b';
          else if (currentClassificationValue === 'inaccessible') bgColor = '#cccccc';

          const countryNameForFlag = props["admin0Name"] || "";
          const flagName = countryNameForFlag.toLowerCase().replace(/\s+/g, '-');
          const flagURL = `/flags/${flagName}.svg`;

          const aggregatedNotice = (props[currentLevelField] === 1 || props[currentLevelField] === '1' || props[currentLevelField] === "true" || props[currentLevelField] === true)
            ? `<div class="popup-aggregated-box"><div class="popup-aggregated">⚠️ ${t("dataAggregated")}</div></div>`
            : '';

          const popupContent = `
            <div class="popup-content">
              ${aggregatedNotice}
              <div class="popup-header-flag">
                <h3 class="popup-header">
                  ${props["admin2Name"] || t("unknownDistrict")} - ${props["admin1Name"] || t("unknownRegion")}
                </h3>
                <div class="popup-flag">
                  <img src="${flagURL}" alt="${t("flag")}" />
                </div>
              </div>
              <div class="popup-subheader-box" style="background-color: ${bgColor};">
                <h4 class="popup-subheader">${translateClassification(currentClassificationValue, t)}</h4>
              </div>
              <div class="popup-details">
                <table class="popup-table">
                  <thead>
                    <tr>
                      <th>${t("indicator")}</th>
                      <th>${formatPeriod(currentPeriod, currentLocale)}</th>
                      <th>${t("difference")} (${formatPeriod(otherPeriod, currentLocale)})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>${t("populationTotal")}:</strong></td>
                      <td>${popTotalCurrent.toLocaleString() || t("nA")}</td>
                      <td>${formatDiff(popTotalDiff)}</td>
                    </tr>
                    <tr>
                      <td><strong>${t("populationPh2")}:</strong></td>
                      <td>${popPh2Current.toLocaleString() || t("nA")}</td>
                      <td>${formatDiff(popPh2Diff)}</td>
                    </tr>
                    <tr>
                      <td><strong>${t("populationPh3")}:</strong></td>
                      <td>${popPh3Current.toLocaleString() || t("nA")}</td>
                      <td>${formatDiff(popPh3Diff)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
          popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
        }
      });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      setIsMapLoaded(false);
    };
  }, [country, currentPeriod, otherPeriod, data, t, currentLocale]); // Added currentLocale and otherPeriod

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
        map.getSource('country-data').setData({
            type: 'FeatureCollection', features: featuresForCountry
        });
    }
  }, [country, currentPeriod, data, isMapLoaded]); // Removed country from here as it's in main effect, re-filtering is complex if only country changes without full reload.

  if (!country || !currentPeriod) {
    return <div>{t("selectCountryAndPeriod")}</div>;
  }

  return (
    <div className="country-map-view">
      <div className="country-map-title">{`${country} - ${formatPeriod(currentPeriod, currentLocale)}`}</div>
      <div ref={mapContainerRef} className="country-map-container-inner" />
    </div>
  );
};

export default CountryMapView;
