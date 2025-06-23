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

  // Determine language from locale (simplified)
  const lang = typeof locale === 'string' && locale.startsWith("fr") ? "fr" : "en";
  const monthName = MONTH_NAMES[lang][monthIndex];
  const prefix = isPrediction ? 'P.' : '';

  return `${year} ${prefix}${monthName}`;
}


const CountryMapView = ({ country, period, data }) => {
  // Provide default for i18n and then safely access language
  const { t, i18n = {} } = useTranslationHook("analysis") || {};
  const currentLocale = i18n.language || (typeof navigator !== "undefined" && navigator.language) || "en";

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Helper function to translate classification values (can be moved to a shared util if needed)
  const translateClassification = (classification, t) => {
    // This function would be identical to the one in MapView.js
    // For brevity, I'm omitting the full switch statement here.
    // It should be copied from MapView.js or refactored.
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
    if (!mapContainerRef.current || !country || !period || !data) return;

    const countryISO3 = countryNameToISO3[country];
    const bbox = countryISO3 ? countryBoundingBoxes[countryISO3] : null;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788', // Same style as MapView
      // Center and zoom will be set by fitBounds if bbox is available, otherwise defaults.
      center: [20, 5], // Default center (e.g., Africa) if no bbox
      zoom: 2,          // Default zoom if no bbox
    });
    mapRef.current = map;

    map.on('load', () => {
      setIsMapLoaded(true);

      if (bbox) {
        map.fitBounds(bbox, { padding: 20, duration: 0 }); // duration 0 for immediate fit
      } else {
        // Fallback: if no bbox, try the old centering logic (or remove if not desired)
        console.warn(`No bounding box found for country: ${country} (ISO3: ${countryISO3}). Using default view or old logic.`);
        // Find the country feature to determine its bounding box or center
        const countryFeature = data.find(
          (f) => f.properties.admin0Name === country
        );
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
            } catch (e) {
                console.error("Error processing country geometry for fallback map center:", e);
            }
          }
        }
      }

      // Data source setup: Try filtering by ISO3 if available, otherwise fallback to admin0Name.
      let featuresForCountry;
      if (countryISO3 && data.length > 0 && data[0].properties.iso_a3) {
        // If countryISO3 is known and features have an 'iso_a3' property
        featuresForCountry = data.filter(f => f.properties.iso_a3 === countryISO3);
        if (featuresForCountry.length === 0) {
          // Fallback if no features match by ISO (e.g. data uses different ISO property or name mismatch)
          console.warn(`No features found for ISO3 ${countryISO3}. Falling back to filtering by admin0Name for ${country}.`);
          featuresForCountry = data.filter(f => f.properties.admin0Name === country);
        }
      } else {
        // Fallback if countryISO3 is not known or features don't have 'iso_a3'
        featuresForCountry = data.filter(f => f.properties.admin0Name === country);
      }

      map.addSource('country-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: featuresForCountry
        }
      });

      const classificationField = `classification_${period}`;
      const fillColorExpression = [
        'match',
        ['get', classificationField],
        'Non analysée', '#ffffff',
        'Phase 1 : minimal', '#d3f3d4',
        'Phase 2 : sous pression', '#ffe252',
        'Phase 3 : crises', '#fa890f',
        'Phase 4 : urgence', '#eb3333',
        'Phase 5 : famine', '#60090b',
        'inaccessible', '#cccccc',
        /* default */ '#ffffff'
      ];

      map.addLayer({
        id: 'country-fill',
        type: 'fill',
        source: 'country-data',
        layout: {},
        paint: {
          'fill-color': fillColorExpression,
          'fill-opacity': 0.9
        }
      });

      map.addLayer({
        id: 'country-outline',
        type: 'line',
        source: 'country-data',
        layout: {},
        paint: {
          'line-color': '#555',
          'line-width': 1
        }
      });

      // Optional: Add popup for details on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'custom-popup',
      });

      map.on('mouseenter', 'country-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'country-fill', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
      map.on('mousemove', 'country-fill', (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          const classification = props[classificationField] || 'Non analysée';
          let bgColor = '#ffffff'; // Determine based on classification as in MapView
          // ... (bgColor logic from MapView)

          const popupContent = `
            <div class="popup-content">
              <div class="popup-header-flag">
                <h3 class="popup-header">
                  ${props["admin2Name"] || t("unknownDistrict")} - ${props["admin1Name"] || t("unknownRegion")}
                </h3>
              </div>
              <div class="popup-subheader-box" style="background-color: ${bgColor};">
                <h4 class="popup-subheader">${translateClassification(classification, t)}</h4>
              </div>
              <div class="popup-details">
                <p><strong>${t("populationTotal")}:</strong> ${props[`population_total_${period}`] || t("nA")}</p>
                {/* Add more details as needed */}
              </div>
            </div>
          `;
          popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapLoaded(false);
    };
  }, [country, period, data, t]); // Add t to dependency array

  // Effect to update map when period or data changes, if map is already loaded
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !period) return;

    const map = mapRef.current;
    const layerId = 'country-fill';

    if (map.getLayer(layerId)) {
      const classificationField = `classification_${period}`;
      const fillColorExpression = [
        'match',
        ['get', classificationField],
        'Non analysée', '#ffffff',
        'Phase 1 : minimal', '#d3f3d4',
        'Phase 2 : sous pression', '#ffe252',
        'Phase 3 : crises', '#fa890f',
        'Phase 4 : urgence', '#eb3333',
        'Phase 5 : famine', '#60090b',
        'inaccessible', '#cccccc',
        /* default */ '#ffffff'
      ];
      map.setPaintProperty(layerId, 'fill-color', fillColorExpression);
    }

    // If data source also needs updating (e.g. if `data` prop changes structure for the period)
    if (map.getSource('country-data') && data) {
        map.getSource('country-data').setData({
            type: 'FeatureCollection',
            features: data.filter(f => f.properties.admin0Name === country)
        });
    }

  }, [period, data, isMapLoaded, country]); // Add country here as well for data filtering consistency


  if (!country || !period) {
    return <div>{t("selectCountryAndPeriod")}</div>;
  }

  return (
    <div className="country-map-view">
      <div className="country-map-title">{`${country} - ${formatPeriod(period, currentLocale)}`}</div>
      <div ref={mapContainerRef} className="country-map-container-inner" />
      {/* Optionally, add a small legend or title here */}
    </div>
  );
};

export default CountryMapView;
