// src/components/MapView.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslationHook } from "../i18n";
import '../styles/MapView.css';

// Set your Mapbox access token.
mapboxgl.accessToken =
  'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

// --- Tileset configuration dictionary for existing layers ---
const tilesetConfig = {
  tiles: [
    // {
    //   id: "admin0",
    //   source: "admin0_source",
    //   sourceLayer: "admin0-8pm03x",
    //   type: "vector",
    //   layerType: "line",
    //   url: "mapbox://mkmd.73x5k6gi",
    //   mouseEvent: false,
    // },
    // {
    //   id: "admin1",
    //   source: "admin1_source",
    //   sourceLayer: "admin1-8mekeg",
    //   type: "vector",
    //   layerType: "line",
    //   url: "mapbox://mkmd.35g07uqp",
    //   mouseEvent: false,
    // }
  ]
};

const MapView = () => {
  const { t } = useTranslationHook("analysis");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  // Ref to hold the latest selected date.
  const currentDateRef = useRef(null);
  
  // Track whether the map has finished loading.
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // New state to track when all data and layers are loaded.
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper function to translate classification values.
  const translateClassification = (classification, t) => {
    switch (classification) {
      case "Non analysée":
        return t("nonAnalyzed");
      case "Phase 1 : minimal":
        return t("phase1");
      case "Phase 2 : sous pression":
        return t("phase2");
      case "Phase 3 : crises":
        return t("phase3");
      case "Phase 4 : urgence":
        return t("phase4");
      case "Phase 5 : famine":
        return t("phase5");
      case "inaccessible":
        return t("inaccessible");
      default:
        return classification || t("unknownClassification");
    }
  };
  
  // Available dates from your CSV files.
  const dateOptions = [
    "March-2014",
    "October-2014",
    "March-2015",
    "October-2015",
    "March-2016",
    "October-2016",
    "March-2017",
    "October-2017",
    "March-2018",
    "October-2018",
    "March-2019",
    "October-2019",
    "March-2020",
    "October-2020",
    "March-2021",
    "October-2021",
    "March-2022",
    "October-2022",
    "March-2023",
    "October-2023",
    "March-2024",
    "October-2024",
    "March-2025",
    "PJune-2025"
  ];
  // Default to the last possible date.
  const [currentDateIndex, setCurrentDateIndex] = useState(dateOptions.length - 1);
  const currentDate = dateOptions[currentDateIndex];
  
  // Update the currentDateRef whenever currentDate changes.
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);
  
  // State for the fill opacity (default 0.9)
  const [fillOpacity, setFillOpacity] = useState(0.9);

  // Update the fill layer when currentDate changes.
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'admin-boundaries-fill';
    if (map && map.getLayer(layerId)) {
      // Fade out the fill layer.
      map.setPaintProperty(layerId, 'fill-opacity', 0);
      setTimeout(() => {
        // Build a new fill-color expression using the dynamic field.
        const classificationField = `classification_${currentDateRef.current}`;
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
        // Fade back in.
        map.setPaintProperty(layerId, 'fill-opacity', fillOpacity);
      }, 500);
    }
  }, [currentDate, isMapLoaded, fillOpacity]);

  // Update fill opacity when it changes.
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'admin-boundaries-fill';
    if (map && map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'fill-opacity', fillOpacity);
    }
  }, [fillOpacity, isMapLoaded]);

  useEffect(() => {
    // Initialize the Mapbox map.
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [3, 14],
      zoom: 4.45,
    });
    mapRef.current = map;

    // Add navigation controls.
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setIsMapLoaded(true);

      // Add the combined GeoJSON source.
      map.addSource('admin-boundaries', {
        type: 'geojson',
        data: `/data/combined.geojson`,
      });

      // Determine the insertion point for custom layers.
      const customAdmin0LayerId = 'admin0-8pm03x';
      let insertionLayerId = customAdmin0LayerId;
      if (!map.getLayer(customAdmin0LayerId)) {
        const layers = map.getStyle().layers;
        insertionLayerId = layers.find(layer => layer.type === 'symbol')?.id;
      }

      // Add the base fill layer.
      const initialField = `classification_${currentDate}`;
      map.addLayer(
        {
          id: 'admin-boundaries-fill',
          type: 'fill',
          source: 'admin-boundaries',
          minzoom: 3,
          layout: {},
          paint: {
            'fill-color': [
              'match',
              ['get', initialField],
              'Non analysée', '#ffffff',
              'Phase 1 : minimal', '#d3f3d4',
              'Phase 2 : sous pression', '#ffe252',
              'Phase 3 : crises', '#fa890f',
              'Phase 4 : urgence', '#eb3333',
              'Phase 5 : famine', '#60090b',
              'inaccessible', '#cccccc',
              /* default */ '#ffffff'
            ],
            'fill-opacity': fillOpacity,
            'fill-opacity-transition': { duration: 500 }
          },
        },
        insertionLayerId
      );

      // Add the outline layer.
      map.addLayer(
        {
          id: 'admin-boundaries-outline',
          type: 'line',
          source: 'admin-boundaries',
          minzoom: 3,
          layout: {},
          paint: {
            'line-color': [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              "hsl(0, 0%, 77%)",
              7,
              "hsl(0, 0%, 62%)"
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              3,
              0.1
            ]
          },
        },
        insertionLayerId
      );

      // Create a popup for hover interactions.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'custom-popup',
      });

      // --- Hover highlighting and tooltip ---
      let hoveredFeatureId = null;
      map.on('mouseenter', 'admin-boundaries-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'admin-boundaries-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredFeatureId !== null) {
          map.setFeatureState({ source: 'admin-boundaries', id: hoveredFeatureId }, { hover: false });
        }
        hoveredFeatureId = null;
        popup.remove();
      });
      map.on('mousemove', 'admin-boundaries-fill', (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          if (hoveredFeatureId !== null && hoveredFeatureId !== feature.id) {
            map.setFeatureState({ source: 'admin-boundaries', id: hoveredFeatureId }, { hover: false });
          }
          hoveredFeatureId = feature.id;
          map.setFeatureState({ source: 'admin-boundaries', id: hoveredFeatureId }, { hover: true });
  
          const current = currentDateRef.current;
          const classificationField = `classification_${current}`;
          const populationTotalField = `population_total_${current}`;
          const populationPh2Field = `population_ph2_${current}`;
          const populationPh3Field = `population_ph3_${current}`;
          const levelField = `level_${current}`;

          
  
          const props = feature.properties;


          // Determine background color based on classification.
          const classification = props[classificationField] || 'Non analysée';
          let bgColor = '#ffffff';
          if (classification === 'Non analysée') {
            bgColor = '#ffffff';
          } else if (classification === 'Phase 1 : minimal') {
            bgColor = '#d3f3d4';
          } else if (classification === 'Phase 2 : sous pression') {
            bgColor = '#ffe252';
          } else if (classification === 'Phase 3 : crises') {
            bgColor = '#fa890f';
          } else if (classification === 'Phase 4 : urgence') {
            bgColor = '#eb3333';
          } else if (classification === 'Phase 5 : famine') {
            bgColor = '#60090b';
          } else if (classification === 'inaccessible') {
            bgColor = '#cccccc';
          }
  
          // Compute the flag image URL based on the country name.
          const countryName = props["admin0Name"] || "";
          const flagName = countryName.toLowerCase().replace(/\s+/g, '-');
          const flagURL = `/flags/${flagName}.svg`;
  
          const aggregatedNotice = (props[levelField] === 1 || props[levelField] === '1')
            ? ` <div class="popup-aggregated-box">
                  <div class="popup-aggregated">⚠️ ${t("dataAggregated")}</div>
                </div>
                `
            : '';

          // Build popup content using CSS classes.
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
                <h4 class="popup-subheader">${translateClassification(props[classificationField], t)}</h4>
              </div>
              <div class="popup-details">
                <table class="popup-table">
                  <tr>
                    <td><strong>${t("populationTotal")}:</strong></td>
                    <td>${props[populationTotalField] || t("nA")}</td>
                  </tr>
                  <tr>
                    <td><strong>${t("populationPh2")}:</strong></td>
                    <td>${props[populationPh2Field] || t("nA")}</td>
                  </tr>
                  <tr>
                    <td><strong>${t("populationPh3")}:</strong></td>
                    <td>${props[populationPh3Field] || t("nA")}</td>
                  </tr>
                </table>
              </div>
            </div>
          `;
          popup.setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        }
      });
  
      // When the map is idle (i.e. all layers are rendered), mark data as loaded.
      map.on('idle', () => {
        setIsDataLoaded(true);
      });
  
      // Add custom tileset layers on top.
      tilesetConfig.tiles.forEach(tile => {
        map.addSource(tile.id, {
          type: tile.type,
          url: tile.url,
        });
        map.addLayer({
          id: `${tile.id}-layer`,
          type: tile.layerType,
          source: tile.id,
          "source-layer": tile.sourceLayer,
          layout: { visibility: "visible" },
          paint: tile.feature && tile.feature.paint ? tile.feature.paint : {},
        });
      });
  
      // Bring the custom layers to the top.
      const customLayers = ["admin0-8pm03x", "admin1-8mekeg", "admin2-b942h4"];
      customLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.moveLayer(layerId);
        }
      });
    });
  
    return () => map.remove();
  }, []);

  return (
    <div className="map-view-container">
      {/* Loading overlay */}
      {!isDataLoaded && (
        <div className="loading-overlay">
          <div className="spinner" />
          <h1>La carte est en cours de chargement, veuillez patienter...</h1>
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
      
      {/* Timebar / Date Slider and Opacity Slider */}
      <div className="timebar">
        <div className="date-selector">
          <span className="active-date">{t("date")}: {currentDate}</span>
          <input
            type="range"
            min="0"
            max={dateOptions.length - 1}
            step="1"
            value={currentDateIndex}
            onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
          />
        </div>
        <div className="opacity-control">
          <label htmlFor="opacityRange">{t("opacity")}:</label>
          <input
            type="range"
            id="opacityRange"
            min="0"
            max="1"
            step="0.05"
            value={fillOpacity}
            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
          />
          <span className="opacity-value">{fillOpacity}</span>
        </div>
      </div>
      
      {/* Legend Overlay */}
      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#ffffff' }}></div>
          <span>{t("nonAnalyzed")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#d3f3d4' }}></div>
          <span>{t("phase1")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#ffe252' }}></div>
          <span>{t("phase2")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#fa890f' }}></div>
          <span>{t("phase3")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#eb3333' }}></div>
          <span>{t("phase4")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#60090b' }}></div>
          <span>{t("phase5")}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#cccccc' }}></div>
          <span>{t("inaccessible")}</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
