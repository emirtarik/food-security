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

const MapView = ({ 
  currentDateIndex, 
  setCurrentDateIndex, 
  dateOptions, 
  showFoodInsecurityLayer,
  setShowFoodInsecurityLayer,
  showAcledLayer,
  setShowAcledLayer,
  showCriticalOverlap,
  setShowCriticalOverlap
}) => {
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
  
  // Get current date from props
  const currentDate = dateOptions[currentDateIndex] || '';
  
  // State for ACLED data
  const [acledYears, setAcledYears] = useState([]);
  const [currentAcledYear, setCurrentAcledYear] = useState(null);
  
  // Function to generate conflict dots within administrative regions
  const generateConflictDots = (geojsonData, acledYear) => {
    const dots = [];
    const densityField = `acled_Dns${acledYear}`;
    const eventsField = `acled_evC${acledYear}`;
    
    geojsonData.features.forEach(feature => {
      const density = feature.properties[densityField];
      const events = feature.properties[eventsField];
      
      // Skip if no conflict data
      if (!density || density === 0 || !events || events === 0) return;
      
      // Calculate number of dots based on density and events
      const numDots = Math.min(Math.max(Math.floor(density * 1000), 1), 20); // Between 1 and 20 dots
      
      // Get the geometry of the administrative region
      const geometry = feature.geometry;
      if (geometry.type === 'Polygon') {
        // Generate random points within the polygon
        for (let i = 0; i < numDots; i++) {
          const point = generateRandomPointInPolygon(geometry.coordinates[0]);
          dots.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point
            },
            properties: {
              ...feature.properties,
              density: density,
              events: events,
              dotIndex: i
            }
          });
        }
      }
    });
    
    return {
      type: 'FeatureCollection',
      features: dots
    };
  };
  
  // Helper function to generate a random point within a polygon
  const generateRandomPointInPolygon = (polygon) => {
    // Simple bounding box approach - generate points within the bounding box
    // and check if they're inside the polygon
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    polygon.forEach(coord => {
      minX = Math.min(minX, coord[0]);
      maxX = Math.max(maxX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    });
    
    // Try up to 100 times to find a point inside the polygon
    for (let i = 0; i < 100; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      
      if (pointInPolygon([x, y], polygon)) {
        return [x, y];
      }
    }
    
    // If we can't find a point inside, return the centroid
    const centroid = calculateCentroid(polygon);
    return centroid;
  };
  
  // Helper function to check if a point is inside a polygon
  const pointInPolygon = (point, polygon) => {
    const x = point[0], y = point[1];
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };
  
  // Helper function to calculate centroid of a polygon
  const calculateCentroid = (polygon) => {
    let x = 0, y = 0;
    polygon.forEach(coord => {
      x += coord[0];
      y += coord[1];
    });
    return [x / polygon.length, y / polygon.length];
  };
  
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
  
  // Update ACLED year when food insecurity date changes
  useEffect(() => {
    if (currentDate) {
      const { year } = parsePeriodKey(currentDate);
      if (!isNaN(year) && acledYears.includes(year)) {
        setCurrentAcledYear(year);
      } else {
        // Clear ACLED year if no data available for this year
        setCurrentAcledYear(null);
      }
    }
  }, [currentDate, acledYears]);



  // Update the fill layer when currentDate changes.
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'admin-boundaries-fill';
    if (map && map.getLayer(layerId)) {
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
    }
  }, [currentDate, isMapLoaded]);



  // Update ACLED layer when year changes
  useEffect(() => {
    if (!isMapLoaded || !currentAcledYear) return;
    const map = mapRef.current;
    const layerId = 'acled-conflict-layer';
    if (map && map.getLayer(layerId)) {
      // Fetch the original GeoJSON data to generate dots
      fetch('/data/combined.geojson')
        .then(response => response.json())
        .then(geojsonData => {
          // Generate conflict dots based on the current ACLED year
          const dotsData = generateConflictDots(geojsonData, currentAcledYear);
          
          // Update the dots source
          const source = map.getSource('acled-dots-source');
          if (source) {
            source.setData(dotsData);
          }
          
          // Update circle radius and opacity based on density
          map.setPaintProperty(layerId, 'circle-radius', [
            'case',
            ['==', ['get', 'density'], null], 0,
            ['==', ['get', 'density'], 0], 0,
            ['<', ['get', 'density'], 0.001], 1,
            ['<', ['get', 'density'], 0.01], 2,
            ['<', ['get', 'density'], 0.1], 3,
            ['<', ['get', 'density'], 1], 4,
            5
          ]);
          
          // Update circle opacity based on density
          map.setPaintProperty(layerId, 'circle-opacity', [
            'case',
            ['==', ['get', 'density'], null], 0,
            ['==', ['get', 'density'], 0], 0,
            ['<', ['get', 'density'], 0.001], 0.1,
            ['<', ['get', 'density'], 0.01], 0.2,
            ['<', ['get', 'density'], 0.1], 0.3,
            ['<', ['get', 'density'], 1], 0.4,
            0.9
          ]);
        })
        .catch(error => {
          console.error('Error loading GeoJSON data for ACLED dots:', error);
        });
    }
  }, [currentAcledYear, isMapLoaded]);

  // Update critical overlap layer
  useEffect(() => {
    if (!isMapLoaded || !currentAcledYear) return;
    const map = mapRef.current;
    const layerId = 'critical-overlap-layer';
    if (map && map.getLayer(layerId)) {
      const densityField = `acled_Dns${currentAcledYear}`;
      const eventsField = `acled_evC${currentAcledYear}`;
      const classificationField = `classification_${currentDateRef.current}`;
      
      // Debug: Log the field names we're checking
      console.log('Critical overlap check:', {
        densityField,
        eventsField,
        classificationField,
        currentAcledYear,
        currentDate: currentDateRef.current
      });

      // Add click event for critical overlap debugging (only add once)
      if (!map._criticalOverlapDebugAdded) {
        map.on('click', 'critical-overlap-layer', (e) => {
          if (e.features.length > 0) {
            console.log('Critical overlap clicked - features:', e.features.length);
            e.features.forEach((feature, index) => {
              console.log(`Feature ${index + 1}:`, {
                admin2Name: feature.properties.admin2Name,
                classification: feature.properties[classificationField],
                density: feature.properties[densityField],
                events: feature.properties[eventsField]
              });
            });
          }
        });
        map._criticalOverlapDebugAdded = true;
      }
      
      // Show critical overlap where high food insecurity (Phase 3+, 4, 5) meets high conflict density
      // ALL conditions must be met: Phase 3+ AND density >= 0.01 AND events >= 5
      map.setPaintProperty(layerId, 'fill-pattern', [
        'case',
        // Check for high food insecurity (Phase 3, 4, 5) AND high conflict density AND high events
        ['all',
          ['any',
            ['==', ['get', classificationField], 'Phase 3 : crises'],
            ['==', ['get', classificationField], 'Phase 4 : urgence'],
            ['==', ['get', classificationField], 'Phase 5 : famine']
          ],
          ['>=', ['get', densityField], 0.01],
          ['>=', ['get', eventsField], 5]
        ],
        'sparse-stripe-pattern', // Less dense diagonal bars pattern for critical overlap
        '' // No pattern if not all conditions met
      ]);
      
      // Set the fill color to be transparent so only the pattern shows
      map.setPaintProperty(layerId, 'fill-color', [
        'case',
        // Check for high food insecurity (Phase 3, 4, 5) AND high conflict density AND high events
        ['all',
          ['any',
            ['==', ['get', classificationField], 'Phase 3 : crises'],
            ['==', ['get', classificationField], 'Phase 4 : urgence'],
            ['==', ['get', classificationField], 'Phase 5 : famine']
          ],
          ['>=', ['get', densityField], 0.01],
          ['>=', ['get', eventsField], 5]
        ],
        'rgba(128, 0, 128, 0.3)', // Light purple background for critical overlap
        'rgba(128, 0, 128, 0)' // Transparent if not all conditions met
      ]);
    }
  }, [currentAcledYear, currentDate, isMapLoaded]);

  // Toggle ACLED layer visibility
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'acled-conflict-layer';
    if (map && map.getLayer(layerId)) {
      // Check if ACLED data exists for the current year
      const hasAcledData = currentAcledYear && acledYears.includes(currentAcledYear);
      
      // Manual override: No conflict data for 2025. DO NOT REMOVE THIS COMMENT.
      const is2025 = currentDate && currentDate.includes('2025');
      
      // Only show the layer if user wants to show it AND ACLED data exists AND not 2025
      const visibility = (showAcledLayer && hasAcledData && !is2025) ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', visibility);
      
      // Also update inset maps
      Object.values(insetMapsRef.current).forEach(inset => {
        if (inset && inset.getLayer(layerId)) {
          inset.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    }
  }, [showAcledLayer, currentAcledYear, acledYears, currentDate, isMapLoaded]);

  // Toggle food insecurity layer visibility
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'admin-boundaries-fill';
    if (map && map.getLayer(layerId)) {
      const visibility = showFoodInsecurityLayer ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', visibility);
      
      // Also update inset maps
      Object.values(insetMapsRef.current).forEach(inset => {
        if (inset && inset.getLayer(layerId)) {
          inset.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    }
  }, [showFoodInsecurityLayer, isMapLoaded]);

  // Toggle critical overlap layer visibility
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'critical-overlap-layer';
    if (map && map.getLayer(layerId)) {
      // Check if ACLED data exists for the current year (critical overlap needs both food insecurity and conflict data)
      const hasAcledData = currentAcledYear && acledYears.includes(currentAcledYear);
      
      // Manual override: No critical overlap for 2025 (no conflict data)
      const is2025 = currentDate && currentDate.includes('2025');
      
      // Only show the layer if user wants to show it AND ACLED data exists AND not 2025
      const visibility = (showCriticalOverlap && hasAcledData && !is2025) ? 'visible' : 'none';
      map.setLayoutProperty(layerId, 'visibility', visibility);
      
      // Also update inset maps
      Object.values(insetMapsRef.current).forEach(inset => {
        if (inset && inset.getLayer(layerId)) {
          inset.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    }
  }, [showCriticalOverlap, currentAcledYear, acledYears, currentDate, isMapLoaded]);
  

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

      // Load the stripe pattern image for critical overlap
      map.loadImage('/images/stripe-pattern.svg', (error, image) => {
        if (error) {
          console.error('Error loading stripe pattern:', error);
        } else {
          map.addImage('stripe-pattern', image);
        }
      });
      
      // Create a less dense pattern by creating a custom SVG
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, 32, 32);
      
      // Draw diagonal lines with more spacing
      ctx.strokeStyle = 'rgba(128, 0, 128, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Draw diagonal lines with more spacing
      for (let i = -32; i < 64; i += 8) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 32, 32);
      }
      
      ctx.stroke();
      
      // Convert canvas to image data
      const imageData = canvas.toDataURL();
      
      // Create an image element and load it
      const img = new Image();
      img.onload = () => {
        map.addImage('sparse-stripe-pattern', img);
      };
      img.src = imageData;

      // Add the combined GeoJSON source.
      map.addSource('admin-boundaries', {
        type: 'geojson',
        data: `/data/combined.geojson`,
      });

      // Extract ACLED years from the GeoJSON data
      fetch('/data/combined.geojson')
        .then(response => response.json())
        .then(data => {
          const acledYearSet = new Set();
          
          data.features.forEach(f => {
            // Extract ACLED years
            Object.keys(f.properties)
              .filter(key => key.startsWith("acled_evC"))
              .forEach(key => {
                const year = key.replace("acled_evC", "");
                if (/^\d{4}$/.test(year)) {
                  acledYearSet.add(parseInt(year));
                }
              });
          });
          
          const acledYears = Array.from(acledYearSet).sort((a, b) => a - b);
          
          console.log('Extracted ACLED years:', acledYears); // Debug log
          
          setAcledYears(acledYears);
          
          // Set ACLED year to match the food insecurity year
          if (dateOptions.length > 0) {
            const lastPeriod = dateOptions[dateOptions.length - 1];
            const { year } = parsePeriodKey(lastPeriod);
            if (!isNaN(year) && acledYears.includes(year)) {
              setCurrentAcledYear(year);
            }
          }
          
          // Update the map with the first available date
          if (dateOptions.length > 0) {
            const firstDate = dateOptions[dateOptions.length - 1]; // Get the most recent date
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
            'fill-opacity': 0.9,
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

      // Add critical overlap layer - highlights high food insecurity + high conflict
      map.addLayer(
        {
          id: 'critical-overlap-layer',
          type: 'fill',
          source: 'admin-boundaries',
          minzoom: 3,
          layout: {
            visibility: showCriticalOverlap ? 'visible' : 'none'
          },
          paint: {
            'fill-color': 'rgba(139, 0, 139, 0)', // Will be updated based on overlap
            'fill-opacity': 1.0
          },
        },
        insertionLayerId
      );

      // Add ACLED conflict layer as density dots
      map.addSource('acled-dots-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      map.addLayer(
        {
          id: 'acled-conflict-layer',
          type: 'circle',
          source: 'acled-dots-source',
          minzoom: 3,
          layout: {
            visibility: showAcledLayer ? 'visible' : 'none'
          },
          paint: {
            'circle-radius': 2,
            'circle-color': '#4E7C8D',
            'circle-opacity': 0.7,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': '#265E74'
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

          // ACLED fields
          const acledEventsField = currentAcledYear ? `acled_evC${currentAcledYear}` : null;
          const acledDensityField = currentAcledYear ? `acled_Dns${currentAcledYear}` : null;
          const acledFatalitiesField = currentAcledYear ? `acled_ftl${currentAcledYear}` : null;
          
  
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

          // ACLED data section
          const acledData = currentAcledYear && acledEventsField ? `
            <div class="popup-acled-section">
              <h5>${t("conflictData") || "Conflict Data"} (${currentAcledYear})</h5>
              <table class="popup-table">
                <tr>
                  <td><strong>${t("acledEvents") || "Events"}:</strong></td>
                  <td>${props[acledEventsField] || 0}</td>
                </tr>
                <tr>
                  <td><strong>${t("acledFatalities") || "Fatalities"}:</strong></td>
                  <td>${props[acledFatalitiesField] || 0}</td>
                </tr>
                <tr>
                  <td><strong>${t("acledDensity") || "Density"}:</strong></td>
                  <td>${props[acledDensityField] ? props[acledDensityField].toFixed(6) : 'N/A'}</td>
                </tr>
              </table>
            </div>
          ` : '';

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
              ${acledData}
            </div>
          `;
          popup.setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        }
      });
  
      // Add click event for debugging
      map.on('click', 'admin-boundaries-fill', (e) => {
        if (e.features.length > 0) {
          console.log('Clicked features:', e.features);
          console.log('Selected feature properties:', e.features[0].properties);
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
        inset.on('load',()=> {
          map.getStyle().layers.forEach(l => {
            // Copy the layer
            inset.addLayer(l, l.id);
            
            // For critical overlap layer in inset maps, remove the pattern
            if (l.id === 'critical-overlap-layer') {
              inset.setPaintProperty('critical-overlap-layer', 'fill-pattern', '');
            }
          });
        });
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
  
      // update color
      m.setPaintProperty('admin-boundaries-fill', 'fill-color', fillColorExpression);
    });
  }, [currentDate, isMapLoaded]);
  
  const handleExportPNG = () => {
    const map = mapRef.current;
    if (!map || !isDataLoaded) return;

    // Track the export button click with Google Analytics
    if (window.gtag) {
      window.gtag('event', 'export_map_png', {
        event_category: 'map_interaction',
        event_label: 'export_button_click',
        value: 1,
        custom_parameters: {
          current_date: currentDate,
          current_zoom: map.getZoom(),
          current_center: `${map.getCenter().lat.toFixed(4)},${map.getCenter().lng.toFixed(4)}`
        }
      });
    }

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
      

      
      {/* Legend Overlay */}
      <div className="legend">
        <h4>{t("legend") || "Legend"}</h4>
        
        {/* Food Insecurity Legend */}
        {showFoodInsecurityLayer && (
          <div className="food-insecurity-legend">
            <h5>{t("foodInsecurityData") || "Food Insecurity Data"}</h5>
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
        )}
        
        {/* ACLED Legend */}
        {showAcledLayer && currentAcledYear && (
          <div className="acled-legend">
            <h5>{t("conflictDensityData") || "Conflict Density Data"} ({currentAcledYear})</h5>
            <div className="legend-item">
              <div className="legend-dot" style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#4E7C8D',
                border: '1px solid #265E74',
                display: 'inline-block',
                marginRight: '8px'
              }}></div>
              <span>{t("conflictDots") || "Conflict Events (Dots)"}</span>
            </div>
            <div className="legend-note">
              <em>{t("conflictDotsExplanation") || "Bigger dots = higher conflict density."}</em>
            </div>
          </div>
        )}
      </div>

      {/* Critical Overlap Legend - Bottom Left Position */}
      {showCriticalOverlap && (
        <div className="critical-overlap-legend-bottom-left">
          <h5>{t("criticalOverlapData") || "Critical Overlap Data"}</h5>
          <div className="legend-item">
            <div className="legend-pattern-box" style={{ 
              backgroundColor: 'rgba(128, 0, 128, 0.3)',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              display: 'inline-block',
              marginRight: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                width: '40px',
                height: '40px',
                background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(128, 0, 128, 0.8) 4px, rgba(128, 0, 128, 0.8) 6px)',
                transform: 'rotate(45deg)'
              }}></div>
            </div>
            <span>{t("criticalOverlap") || "High Food Insecurity + High Conflict"}</span>
          </div>
          <div className="legend-note">
            <strong>{t("criticalOverlapCriteria") || "Criteria:"}</strong><br/>
            • {t("criticalOverlapFoodInsecurity") || "Food Insecurity: Phase 3 (Crisis), Phase 4 (Emergency), or Phase 5 (Famine)"}<br/>
            • {t("criticalOverlapConflict") || "Conflict: Density ≥ 0.01 AND Events ≥ 5"}<br/>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
