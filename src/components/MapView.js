// src/components/MapView.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import html2canvas from 'html2canvas';
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

const EXPORT_VIEW = {
  center: [0.47, 14.38],   // [lon, lat]
  zoom: 3.9,        // between 0–22
};
// Optional: override export size if you need a different resolution than your on-screen map:
const EXPORT_WIDTH = 1200, EXPORT_HEIGHT = 800;

const INSETS = [
  {
    id:     'inset-cabo',
    center: [-24.0, 16.0],
    zoom:   5,
    size:   [180, 120],
    style:  { bottom: '30px', right: '16px' }
  },
  {
    id:     'inset-gambia',
    center: [-15.3, 13.4],
    zoom:   5.5,
    size:   [200,  60],
    style:  { bottom: '30px', right:'232px' }
  }
];

/**
 * Parse a period key like "October-2024", "2024-10", or "PJune-2025".
 * Returns { year, monthIndex, isPrediction } where monthIndex is 0-based, or monthIndex=-1 if unparseable.
 */
function parsePeriodKey(period) {
  if (!period) return { year: NaN, monthIndex: -1, isPrediction: false };
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

  const date = new Date(`${rawMonth} 1, ${year}`);
  const idx = date.getMonth();
  if (isNaN(idx)) {
    return { year: NaN, monthIndex: -1, isPrediction };
  }
  return { year, monthIndex: idx, isPrediction };
}

const MapView = () => {
  const { t } = useTranslationHook("analysis");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const insetMapsRef = useRef({});
  
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
  
  // State for dynamically extracted date options
  const [dateOptions, setDateOptions] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const currentDate = dateOptions[currentDateIndex] || '';
  
  // Update the currentDateRef whenever currentDate changes.
  useEffect(() => {
    currentDateRef.current = currentDate;
    console.log('Current date set to:', currentDate); // Debug log
  }, [currentDate]);

  // Update currentDateIndex when dateOptions change
  useEffect(() => {
    if (dateOptions.length > 0) {
      setCurrentDateIndex(dateOptions.length - 1);
      console.log('Current date options:', dateOptions); // Debug log
      console.log('Setting current date index to:', dateOptions.length - 1); // Debug log
    }
  }, [dateOptions]);
  
  

  

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
    // map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      setIsMapLoaded(true);

      // Add the combined GeoJSON source.
      map.addSource('admin-boundaries', {
        type: 'geojson',
        data: `/data/combined.geojson`,
      });

      // Extract date options from the GeoJSON data
      fetch('/data/combined.geojson')
        .then(response => response.json())
        .then(data => {
          const periodSet = new Set();
          data.features.forEach(f => {
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
          console.log('Extracted date options:', periods); // Debug log
          setDateOptions(periods);
          // Set to the last available date
          setCurrentDateIndex(periods.length - 1);
          
          // Update the map with the first available date
          if (periods.length > 0) {
            const firstDate = periods[periods.length - 1]; // Get the most recent date
            const classificationField = `classification_${firstDate}`;
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
            map.setPaintProperty('admin-boundaries-fill', 'fill-color', fillColorExpression);
          }
        })
        .catch(error => {
          console.error('Error loading GeoJSON data:', error);
          // Fallback to hardcoded dates if fetch fails
          const fallbackDates = [
            "March-2014", "November-2014", "March-2015", "November-2015",
            "March-2016", "November-2016", "March-2017", "November-2017",
            "March-2018", "November-2018", "March-2019", "November-2019",
            "March-2020", "November-2020", "March-2021", "November-2021",
            "March-2022", "November-2022", "March-2023", "November-2023",
            "March-2024", "November-2024", "March-2025", "PJune-2025"
          ];
          setDateOptions(fallbackDates);
          setCurrentDateIndex(fallbackDates.length - 1);
        });

      // Determine the insertion point for custom layers.
      const customAdmin0LayerId = 'admin0-8pm03x';
      let insertionLayerId = customAdmin0LayerId;
      if (!map.getLayer(customAdmin0LayerId)) {
        const layers = map.getStyle().layers;
        insertionLayerId = layers.find(layer => layer.type === 'symbol')?.id;
      }

      // Add the base fill layer - will be updated when data is loaded
      map.addLayer(
        {
          id: 'admin-boundaries-fill',
          type: 'fill',
          source: 'admin-boundaries',
          minzoom: 3,
          layout: {},
          paint: {
            'fill-color': '#ffffff', // Default color until data is loaded
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

      // create inset maps
      INSETS.forEach(({id,center,zoom})=>{
        const inset = new mapboxgl.Map({ container:id, style:map.getStyle(), center, zoom, interactive:false, attributionControl:false });
        inset.on('load',()=> map.getStyle().layers.forEach(l=>inset.addLayer(l,l.id)) );
        insetMapsRef.current[id] = inset;
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

  useEffect(() => {
    if (!isMapLoaded) return;
  
    // Build the same expression you use on the main map:
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
  
    // Gather main map + all inset maps
    const maps = [
      mapRef.current,
      ...Object.values(insetMapsRef.current)
    ];
  
    maps.forEach((m) => {
      // only update if that map has your fill layer
      if (!m || !m.getLayer('admin-boundaries-fill')) return;
  
      // update color + opacity in one shot
      m.setPaintProperty('admin-boundaries-fill', 'fill-color', fillColorExpression);
      m.setPaintProperty('admin-boundaries-fill', 'fill-opacity', fillOpacity);
    });
  }, [currentDate, fillOpacity, isMapLoaded]);
  
  const handleExportPNG = () => {
    const map = mapRef.current;
    if (!map || !isDataLoaded) return;

    // 1) Save current camera
    const prevCenter = map.getCenter();
    const prevZoom   = map.getZoom();

    // 2) Resize map container
    const container = map.getContainer();
    const origStyle = {
      width:  container.style.width,
      height: container.style.height
    };
    container.style.width  = `${EXPORT_WIDTH}px`;
    container.style.height = `${EXPORT_HEIGHT}px`;
    map.resize();

    map.once('idle', () => {
      // 3) Jump to fixed view
      map.jumpTo({ center: EXPORT_VIEW.center, zoom: EXPORT_VIEW.zoom, essential: true });

      map.once('idle', async () => {
        const ratio = window.devicePixelRatio;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width  = EXPORT_WIDTH * ratio;
        exportCanvas.height = EXPORT_HEIGHT * ratio;
        const ctx = exportCanvas.getContext('2d');
        ctx.scale(ratio, ratio);

        // 4) Draw main map
        ctx.drawImage(map.getCanvas(), 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

        // 5) Draw insets
        INSETS.forEach(({ id, size: [w, h], style }) => {
          const insetCanvas = insetMapsRef.current[id].getCanvas();
          const rect = mapContainerRef.current.getBoundingClientRect();
          const x = style.left
            ? parseInt(style.left)
            : rect.width - w - parseInt(style.right);
          const y = style.top
            ? parseInt(style.top)
            : rect.height - h - parseInt(style.bottom);
          ctx.drawImage(insetCanvas, x, y, w, h);
        });

        // 6) Draw legend overlay
        const legendEl = mapContainerRef.current.querySelector('.legend');
        if (legendEl) {
          // Rasterize legend DIV
          const legendCanvas = await html2canvas(legendEl, {
            backgroundColor: null,
            scale: ratio
          });
          // Figure out its position relative to map container
          const legendRect = legendEl.getBoundingClientRect();
          const containerRect = mapContainerRef.current.getBoundingClientRect();
          const lx = legendRect.left - containerRect.left;
          const ly = legendRect.top  - containerRect.top;
          // Draw it onto our export canvas
          ctx.drawImage(
            legendCanvas,
            lx * ratio,
            ly * ratio,
            legendRect.width * ratio,
            legendRect.height * ratio
          );
        }

        // 7) Download PNG
        exportCanvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href    = url;
          a.download = `food-crisis-map_${currentDate}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // 8) Restore original size & view
          container.style.width  = origStyle.width;
          container.style.height = origStyle.height;
          map.resize();
          map.jumpTo({
            center: [prevCenter.lng, prevCenter.lat],
            zoom:   prevZoom,
            essential: true
          });
        }, 'image/png');
      });
    });
  };

  return (
    <div className="map-view-container">

      <button
        className="export-button"
        onClick={handleExportPNG}
        disabled={!isDataLoaded}
      >
        {isDataLoaded ? 'Download PNG' : 'Loading…'}
      </button>
      {/* Loading overlay */}
      {!isDataLoaded && (
        <div className="loading-overlay">
          <div className="spinner" />
          <h1>La carte est en cours de chargement, veuillez patienter...</h1>
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
      {/* Inset maps */}
      {INSETS.map(({ id, size: [w, h], style }) => (
        <div
          key={id}
          id={id}
          style={{
            position: 'absolute',
            width:  `${w}px`,
            height: `${h}px`,
            background: '#fff',
            border: '2px solid #333',
            ...style
          }}
        />
      ))}
      
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
