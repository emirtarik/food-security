// src/components/CountryMapView.js
import React, { useRef, useEffect, useState, useMemo } from 'react'; // Added useMemo
import mapboxgl from 'mapbox-gl';
import '../styles/MapView.css';
import '../styles/CountryMapView.css';
import { useTranslationHook } from "../i18n";
import { countryNameToISO3, countryBoundingBoxes } from '../utils/mapCoordinates';

mapboxgl.accessToken = 'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

const MONTH_NAMES = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  fr: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
};

function parsePeriodKey(periodKey) {
  if (!periodKey) return { year: NaN, monthIndex: -1, isPrediction: false };
  const [a, b] = periodKey.split("-");
  let year, rawMonth;
  if (/^\d{4}$/.test(a)) { year = +a; rawMonth = b; }
  else if (/^\d{4}$/.test(b)) { year = +b; rawMonth = a; }
  else { return { year: NaN, monthIndex: -1, isPrediction: false }; }
  let isPrediction = false;
  if (/^[Pp]/.test(rawMonth)) { isPrediction = true; rawMonth = rawMonth.slice(1); }
  if (/^\d{1,2}$/.test(rawMonth)) { const idx = Math.min(Math.max(+rawMonth - 1, 0), 11); return { year, monthIndex: idx, isPrediction }; }
  const date = new Date(`${rawMonth} 1, ${year}`);
  const idx = date.getMonth();
  if (isNaN(idx)) { return { year: NaN, monthIndex: -1, isPrediction }; }
  return { year, monthIndex: idx, isPrediction };
}

function formatPeriod(periodKey, locale) {
  const { year, monthIndex, isPrediction } = parsePeriodKey(periodKey);
  if (isNaN(year) || monthIndex < 0) return periodKey;
  const lang = typeof locale === 'string' && locale.startsWith("fr") ? "fr" : "en";
  const monthName = MONTH_NAMES[lang][monthIndex];
  const prefix = isPrediction ? 'P.' : '';
  return `${year} ${prefix}${monthName}`;
}

function getPhaseNumber(classificationString) {
  if (!classificationString) return -1;
  const lowerCased = classificationString.toLowerCase();
  if (lowerCased.includes("phase 1")) return 1;
  if (lowerCased.includes("phase 2")) return 2;
  if (lowerCased.includes("phase 3")) return 3;
  if (lowerCased.includes("phase 4")) return 4;
  if (lowerCased.includes("phase 5")) return 5;
  if (lowerCased.includes("inaccessible")) return 6;
  if (lowerCased.includes("non analysée")) return 0;
  return -1;
}

const CountryMapView = ({ country, currentPeriod, otherPeriod, data }) => {
  const { t, i18n = {} } = useTranslationHook("analysis") || {};
  const currentLocale = i18n.language || (typeof navigator !== "undefined" && navigator.language) || "en";

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // Stores the map instance
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const countryISO3 = useMemo(() => countryNameToISO3[country], [country]);
  const bbox = useMemo(() => countryISO3 ? countryBoundingBoxes[countryISO3] : null, [countryISO3]);

  const translateClassification = (classification, t) => {
    switch (classification) {
      case "Non analysée": return t("nonAnalyzed", "Non analysée");
      case "Phase 1 : minimal": return t("phase1", "Phase 1 : minimal");
      case "Phase 2 : sous pression": return t("phase2", "Phase 2 : sous pression");
      case "Phase 3 : crises": return t("phase3", "Phase 3 : crises");
      case "Phase 4 : urgence": return t("phase4", "Phase 4 : urgence");
      case "Phase 5 : famine": return t("phase5", "Phase 5 : famine");
      case "inaccessible": return t("inaccessible", "Inaccessible");
      default: return classification || t("unknownClassification", "Unknown");
    }
  };

  // Effect for initializing the map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!country || !currentPeriod || !otherPeriod || !data ) {
        // If essential data is missing, and a map exists, remove it.
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            setIsMapLoaded(false);
        }
        return;
    }

    // If a map instance doesn't exist, create one.
    // This check prevents re-initializing if only other props change.
    if (!mapRef.current) {
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
            center: [20, 5],
            zoom: 2,
        });
        mapRef.current = map;

        map.on('load', () => {
            setIsMapLoaded(true); // Set loaded state - other effects depend on this
        });
    }

    // Cleanup function to remove map when component unmounts or core deps change forcing re-init
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapLoaded(false);
      }
    };
  // This effect should run if the container is ready and essential props like country are there.
  // Data, t, i18n, currentLocale, otherPeriod are used by popups or dynamic layers/sources, handled by other effects.
  // Reducing this to bare minimum for map instance creation.
  }, [country, currentPeriod, otherPeriod, data]); // Key dependencies that necessitate full map re-initialization

  // Effect for fitting bounds
  useEffect(() => {
    if (isMapLoaded && mapRef.current && bbox) {
      const fitBoundsOptions = { padding: 30, duration: 0 };
      if (countryISO3 === 'GNB') { fitBoundsOptions.maxZoom = 6.5; }
      else if (countryISO3 === 'CIV') { fitBoundsOptions.maxZoom = 6.5; }
      mapRef.current.fitBounds(bbox, fitBoundsOptions);
    } else if (isMapLoaded && mapRef.current && !bbox) {
      // Fallback centering logic if no predefined bbox
      console.warn(`No bounding box for ${country} (ISO3: ${countryISO3}). Using fallback geo-center.`);
      const countryFeature = data.find((f) => f.properties.admin0Name === country);
      if (countryFeature && countryFeature.geometry) {
        if (countryFeature.geometry.type === 'Point') {
          mapRef.current.setCenter(countryFeature.geometry.coordinates);
          mapRef.current.setZoom(6);
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
              mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 20, duration: 0 });
            }
          } catch (e) { console.error("Fallback center error:", e); }
        }
      } else {
        // If no bbox and no feature, set a default view (e.g. wider Africa)
        mapRef.current.setCenter([20,5]);
        mapRef.current.setZoom(2);
      }
    }
  }, [isMapLoaded, bbox, country, data, countryISO3]); // Re-run if map loads, bbox changes, or fallback data changes

  // Effect for sources, layers, and popups
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !currentPeriod || !otherPeriod || !data || data.length === 0) return;
    const map = mapRef.current;

    // Manage source
    let featuresForCountry;
    if (countryISO3 && data.length > 0 && data[0].properties.iso_a3) {
        featuresForCountry = data.filter(f => f.properties.iso_a3 === countryISO3);
        if (featuresForCountry.length === 0) {
            featuresForCountry = data.filter(f => f.properties.admin0Name === country);
        }
    } else {
        featuresForCountry = data.filter(f => f.properties.admin0Name === country);
    }

    const sourceId = 'country-data';
    const source = map.getSource(sourceId);
    if (source) {
      source.setData({ type: 'FeatureCollection', features: featuresForCountry });
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: featuresForCountry }
      });
    }

    // Manage layers (fill and outline)
    const classificationField = `classification_${currentPeriod}`;
    const fillColorExpression = [
      'match', ['get', classificationField],
      'Non analysée', '#ffffff', 'Phase 1 : minimal', '#d3f3d4',
      'Phase 2 : sous pression', '#ffe252', 'Phase 3 : crises', '#fa890f',
      'Phase 4 : urgence', '#eb3333', 'Phase 5 : famine', '#60090b',
      'inaccessible', '#cccccc', '#ffffff'
    ];

    const fillLayerId = 'country-fill';
    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, 'fill-color', fillColorExpression);
    } else {
      map.addLayer({
        id: fillLayerId, type: 'fill', source: sourceId, layout: {},
        paint: { 'fill-color': fillColorExpression, 'fill-opacity': 0.9 }
      }, 'country-outline'); // Add before outline if outline exists, or just add
    }

    const outlineLayerId = 'country-outline';
    if (!map.getLayer(outlineLayerId)) {
        map.addLayer({
            id: outlineLayerId, type: 'line', source: sourceId, layout: {},
            paint: { 'line-color': '#555', 'line-width': 1 }
        });
    }


    // Popups
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'custom-popup' });

    const mouseMoveHandler = (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;

        const currentClassificationField = `classification_${currentPeriod}`;
        const currentPopulationTotalField = `population_total_${currentPeriod}`;
        const currentPopulationPh2Field = `population_ph2_${currentPeriod}`;
        const currentPopulationPh3Field = `population_ph3_${currentPeriod}`;
        const currentLevelField = `level_${currentPeriod}`;
        const currentClassificationValue = props[currentClassificationField] || t('nonAnalyzed', 'Non analysée');

        const otherClassificationField = `classification_${otherPeriod}`;
        const otherClassificationValue = props[otherClassificationField] || t('nonAnalyzed', 'Non analysée');

        let classificationChangeHTML = '';
        const currentPhaseNum = getPhaseNumber(currentClassificationValue);
        const otherPhaseNum = getPhaseNumber(otherClassificationValue);

        if (currentPhaseNum > 0 && otherPhaseNum > 0) {
          if (currentPhaseNum < otherPhaseNum) {
            classificationChangeHTML = `<span style="color: green; margin-left: 5px;">(${t("better", "Better")})</span>`;
          } else if (currentPhaseNum > otherPhaseNum) {
            classificationChangeHTML = `<span style="color: red; margin-left: 5px;">(${t("worse", "Worse")})</span>`;
          }
        } else if (currentPhaseNum > 0 && otherPhaseNum === 0) {
           classificationChangeHTML = `<span style="color: orange; margin-left: 5px;">(${t("nowAnalyzed", "Now Analyzed")})</span>`;
        } else if (currentPhaseNum === 0 && otherPhaseNum > 0) {
           classificationChangeHTML = `<span style="color: gray; margin-left: 5px;">(${t("previouslyAnalyzed", "Previously Analyzed")})</span>`;
        }

        const otherPopulationTotalField = `population_total_${otherPeriod}`;
        const otherPopulationPh2Field = `population_ph2_${otherPeriod}`;
        const otherPopulationPh3Field = `population_ph3_${otherPeriod}`;

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
        if (currentClassificationValue === t('nonAnalyzed', 'Non analysée')) bgColor = '#ffffff';
        else if (currentClassificationValue === t('phase1', 'Phase 1 : minimal')) bgColor = '#d3f3d4';
        else if (currentClassificationValue === t('phase2', 'Phase 2 : sous pression')) bgColor = '#ffe252';
        else if (currentClassificationValue === t('phase3', 'Phase 3 : crises')) bgColor = '#fa890f';
        else if (currentClassificationValue === t('phase4', 'Phase 4 : urgence')) bgColor = '#eb3333';
        else if (currentClassificationValue === t('phase5', 'Phase 5 : famine')) bgColor = '#60090b';
        else if (currentClassificationValue === t('inaccessible', 'Inaccessible')) bgColor = '#cccccc';

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
                ${props["admin2Name"] || t("unknownDistrict", "Unknown District")} - ${props["admin1Name"] || t("unknownRegion", "Unknown Region")}
              </h3>
              <div class="popup-flag">
                <img src="${flagURL}" alt="${t("flag", "Flag")}" />
              </div>
            </div>
            <div class="popup-subheader-box" style="background-color: ${bgColor};">
              <h4 class="popup-subheader">${translateClassification(currentClassificationValue, t)} ${classificationChangeHTML}</h4>
            </div>
            <div class="popup-details">
              <table class="popup-table">
                <tbody>
                  <tr>
                    <td><strong>${t("populationTotal", "Total Pop.")}:</strong></td>
                    <td>${popTotalCurrent.toLocaleString() || t("nA", "N/A")}</td>
                    <td>${formatDiff(popTotalDiff)}</td>
                  </tr>
                  <tr>
                    <td><strong>${t("populationPh2", "Pop. Phase 2+")}:</strong></td>
                    <td>${popPh2Current.toLocaleString() || t("nA", "N/A")}</td>
                    <td style="color: ${popPh2Diff > 0 ? 'red' : (popPh2Diff < 0 ? 'green' : 'black')};">${formatDiff(popPh2Diff)}</td>
                  </tr>
                  <tr>
                    <td><strong>${t("populationPh3", "Pop. Phase 3+")}:</strong></td>
                    <td>${popPh3Current.toLocaleString() || t("nA", "N/A")}</td>
                    <td style="color: ${popPh3Diff > 0 ? 'red' : (popPh3Diff < 0 ? 'green' : 'black')};">${formatDiff(popPh3Diff)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
      }
    };

    map.on('mouseenter', fillLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', fillLayerId, () => { map.getCanvas().style.cursor = ''; popup.remove(); });
    map.on('mousemove', fillLayerId, mouseMoveHandler);

    // Cleanup for popup listeners
    return () => {
        // Check if map and layer exist before trying to remove listeners
        if (map.getLayer(fillLayerId)) {
            map.off('mousemove', fillLayerId, mouseMoveHandler);
            map.off('mouseenter', fillLayerId);
            map.off('mouseleave', fillLayerId);
        }
        if (popup.isOpen()) {
            popup.remove();
        }
    };
// This effect handles dynamic content (layers, sources, popups) based on changing periods or data.
// `t` and `i18n` are included because popup content depends on translations.
}, [isMapLoaded, country, currentPeriod, otherPeriod, data, t, i18n, countryISO3]);


  if (!country || !currentPeriod || !otherPeriod) {
    return <div>{t("selectCountryAndPeriod", "Please select a country and both time periods.")}</div>;
  }

  return (
    <div className="country-map-view">
      <div className="country-map-title">{`${country} - ${formatPeriod(currentPeriod, currentLocale)}`}</div>
      <div ref={mapContainerRef} className="country-map-container-inner" />
    </div>
  );
};

export default CountryMapView;
