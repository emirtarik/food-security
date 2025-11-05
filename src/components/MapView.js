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

/**
 * Function to get flag filename(s) for a country
 * Returns an object with primary and fallback filenames
 */
function getFlagFilename(countryName) {
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
  const filename = flagMap[countryName];
  if (!filename) return { primary: null, fallback: null };
  // If it's an array, return primary and fallback
  if (Array.isArray(filename)) {
    return { primary: filename[0], fallback: filename[1] || null };
  }
  return { primary: filename, fallback: null };
}

const MapView = ({ 
  currentDateIndex, 
  setCurrentDateIndex, 
  dateOptions
}) => {
  const { t, currentLanguage } = useTranslationHook("analysis");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const insetMapsRef = useRef({});
  
  // Ref to hold the latest selected date.
  const currentDateRef = useRef(null);
  // Track whether a date change was triggered programmatically (by animation)
  const isProgrammaticDateChangeRef = useRef(false);
  
  // Track whether the map has finished loading.
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // New state to track when all data and layers are loaded.
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Animation state management
  const [isAnimating, setIsAnimating] = useState(false);
  const animationIntervalRef = useRef(null);
  const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] = useState(false);

  // Exporting state
  const [isExporting, setIsExporting] = useState(false);

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

  // Helper function to get classification icon
  const getClassificationIcon = (classification) => {
    // Return empty string - no icons needed
    return "";
  };

  // Helper function to preserve original number formatting
  const formatNumber = (num) => {
    if (!num || num === 0) return null;
    // Return the number as-is to preserve existing comma formatting
    return num.toString();
  };

  // Animation control functions
  const startAnimation = () => {
    if (isAnimating || dateOptions.length <= 1) return;
    
    setIsAnimating(true);
    let currentIndex = 0;
    const animationSpeed = 1000; // Fixed speed of 1 second between frames
    
    animationIntervalRef.current = setInterval(() => {
      isProgrammaticDateChangeRef.current = true;
      setCurrentDateIndex(currentIndex);
      currentIndex++;
      
      if (currentIndex >= dateOptions.length) {
        stopAnimation();
      }
    }, animationSpeed);
  };

  const stopAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
  };
  
  // Get current date from props
  const currentDate = dateOptions[currentDateIndex] || '';
  
  // State for ACLED data - COMMENTED OUT FOR PRODUCTION
  // const [acledYears, setAcledYears] = useState([]);
  // const [currentAcledYear, setCurrentAcledYear] = useState(null);
  
  // Function to generate conflict dots within administrative regions - COMMENTED OUT FOR PRODUCTION
  /*
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
  }
  
  // Helper function to calculate centroid of a polygon
  const calculateCentroid = (polygon) => {
    let x = 0, y = 0;
    polygon.forEach(coord => {
      x += coord[0];
      y += coord[1];
    });
    return [x / polygon.length, y / polygon.length];
  };
  */
  
  // Update the currentDateRef whenever currentDate changes.
  useEffect(() => {
    currentDateRef.current = currentDate;
    console.log('Current date set to:', currentDate); // Debug log
  }, [currentDate]);

  // Stop animation when date is manually changed
  useEffect(() => {
    if (isProgrammaticDateChangeRef.current) {
      // Consume the flag and do not treat this as manual
      isProgrammaticDateChangeRef.current = false;
      return;
    }
    if (isAnimating) {
      stopAnimation();
    }
  }, [currentDateIndex]);

  // Update currentDateIndex when dateOptions change
  useEffect(() => {
    if (dateOptions.length > 0) {
      setCurrentDateIndex(dateOptions.length - 1);
      console.log('Current date options:', dateOptions); // Debug log
      console.log('Setting current date index to:', dateOptions.length - 1); // Debug log
    }
  }, [dateOptions]);

  // Auto-start animation on first load
  useEffect(() => {
    if (isDataLoaded && dateOptions.length > 1 && !hasPlayedInitialAnimation) {
      // Start from the beginning and animate through all periods
      isProgrammaticDateChangeRef.current = true;
      setCurrentDateIndex(0);
      setHasPlayedInitialAnimation(true);
      
      // Start animation after a short delay to ensure map is ready
      setTimeout(() => {
        // Only start if not already animating (prevents conflicts)
        if (!isAnimating) {
          startAnimation();
        }
      }, 1000);
    }
  }, [isDataLoaded, dateOptions.length, hasPlayedInitialAnimation, isAnimating]);

  // Cleanup animation interval on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);
  
  // Update ACLED year when food insecurity date changes - COMMENTED OUT FOR PRODUCTION
  /*
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
  */



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



  // Update ACLED layer when year changes - COMMENTED OUT FOR PRODUCTION
  /*
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
  */

  // Update critical overlap layer - COMMENTED OUT FOR PRODUCTION
  /*
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
          ['>=', ['get', 'density'], 0.01],
          ['>=', ['get', 'events'], 5]
        ],
        'rgba(128, 0, 128, 0.3)', // Light purple background for critical overlap
        'rgba(128, 0, 128, 0)' // Transparent if not all conditions met
      ]);
    }
  }, [currentAcledYear, currentDate, isMapLoaded]);
  */

  // Toggle ACLED layer visibility - COMMENTED OUT FOR PRODUCTION
  /*
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
      // const visibility = (showAcledLayer && hasAcledData && !is2025) ? 'visible' : 'none';
      // map.setLayoutProperty(layerId, 'visibility', visibility);
      // 
      // // Also update inset maps
      // Object.values(insetMapsRef.current).forEach(inset => {
      //   if (inset && inset.getLayer(layerId)) {
      //     inset.setLayoutProperty(layerId, 'visibility', visibility);
      //   }
      // });
      // }
      // }, [showAcledLayer, currentAcledYear, acledYears, currentDate, isMapLoaded]);
  */

  // Food insecurity layer is always visible - no toggle needed

  // Toggle critical overlap layer visibility - COMMENTED OUT FOR PRODUCTION
  /*
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
      // const visibility = (showCriticalOverlap && hasAcledData && !is2025) ? 'visible' : 'none';
      // map.setLayoutProperty(layerId, 'visibility', visibility);
      // 
      // // Also update inset maps
      // Object.values(insetMapsRef.current).forEach(inset => {
      //   if (inset && inset.getLayer(layerId)) {
      //     inset.setLayoutProperty(layerId, 'visibility', visibility);
      //   }
      // });
      // }
      // }, [showCriticalOverlap, currentAcledYear, acledYears, currentDate, isMapLoaded]);
  */
  

  useEffect(() => {
    // Initialize the Mapbox map.
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [2.5, 14],
      zoom: 4.2,
      preserveDrawingBuffer: true
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

      // Extract ACLED years from the GeoJSON data - COMMENTED OUT FOR PRODUCTION
      // fetch('/data/combined.geojson')
      //   .then(response => response.json())
      //   .then(data => {
      //     const acledYearSet = new Set();
      //     
      //     data.features.forEach(f => {
      //       // Extract ACLED years
      //       Object.keys(f.properties)
      //         .filter(key => key.startsWith("acled_evC"))
      //         .forEach(key => {
      //           const year = key.replace("acled_evC", "");
      //           if (/^\d{4}$/.test(year)) {
      //             acledYearSet.add(parseInt(year));
      //           }
      //         });
      //     });
      //     
      //     const acledYears = Array.from(acledYearSet).sort((a, b) => a - b);
      //     
      //     console.log('Extracted ACLED years:', acledYears); // Debug log
      //     
      //     setAcledYears(acledYears);
      //     
      //     // Set ACLED year to match the food insecurity year
      //     if (dateOptions.length > 0) {
      //       const lastPeriod = dateOptions[dateOptions.length - 1];
      //       const { year } = parsePeriodKey(lastPeriod);
      //       if (!isNaN(year) && acledYears.includes(year)) {
      //         setCurrentAcledYear(year);
      //       }
      //     }
      //     
      //     // Update the map with the first available date
      //     if (dateOptions.length > 0) {
      //       const firstDate = dateOptions[dateOptions.length - 1]; // Get the most recent date
      //       const classificationField = `classification_${firstDate}`;
      //       const fillColorExpression = [
      //         'match',
      //         ['get', classificationField],
      //         'Non analysée', '#ffffff',
      //         'Phase 1 : minimal', '#d3f3d4',
      //         'Phase 2 : sous pression', '#ffe252',
      //         'Phase 3 : crises', '#fa890f',
      //         'Phase 4 : urgence', '#eb3333',
      //         'Phase 5 : famine', '#60090b',
      //         'inaccessible', '#cccccc',
      //         /* default */ '#ffffff'
      //       ];
      //       map.setPaintProperty('admin-boundaries-fill', 'fill-color', fillColorExpression);
      //     }
      //   })
      //   .catch(error => {
      //     console.error('Error loading GeoJSON data:', error);
      //   });
      
      // Update the map with the first available date (simplified for production)
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
            'fill-opacity-transition': { duration: 500 },
            'fill-color-transition': { duration: 300 }
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

      // Add critical overlap layer - highlights high food insecurity + high conflict - COMMENTED OUT FOR PRODUCTION
      // map.addLayer(
      //   {
      //     id: 'critical-overlap-layer',
      //     type: 'fill',
      //     source: 'admin-boundaries',
      //     minzoom: 3,
      //     layout: {
      //       visibility: 'none' // Always hidden in production
      //     },
      //     paint: {
      //       'fill-color': 'rgba(139, 0, 139, 0)', // Will be updated based on overlap
      //       'fill-opacity': 1.0
      //     },
      //   },
      //   insertionLayerId
      // );

      // Add ACLED conflict layer as density dots - COMMENTED OUT FOR PRODUCTION
      // map.addSource('acled-dots-source', {
      //   type: 'geojson',
      //   data: {
      //     type: 'FeatureCollection',
      //     features: []
      //   }
      // });
      // 
      // map.addLayer(
      //   {
      //     id: 'acled-conflict-layer',
      //     type: 'circle',
      //     source: 'acled-dots-source',
      //     minzoom: 3,
      //     layout: {
      //       visibility: 'none' // Always hidden in production
      //     },
      //     paint: {
      //       'circle-radius': 2,
      //       'circle-color': '#4E7C8D',
      //       'circle-opacity': 0.7,
      //       'circle-stroke-width': 0.5,
      //       'circle-stroke-color': '#265E74'
      //     },
      //   },
      //   insertionLayerId
      // );

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

          // ACLED fields - COMMENTED OUT FOR PRODUCTION
          // const acledEventsField = currentAcledYear ? `acled_evC${currentAcledYear}` : null;
          // const acledDensityField = currentAcledYear ? `acled_Dns${currentAcledYear}` : null;
          // const acledFatalitiesField = currentAcledYear ? `acled_ftl${currentAcledYear}` : null;
          
  
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
  
          // Get flag filename using the shared function
          const countryName = props["admin0Name"] || "";
          const { primary: primaryFlag, fallback: fallbackFlag } = getFlagFilename(countryName);
          const flagURL = primaryFlag ? `/flags/${primaryFlag}` : '';
          const fallbackFlagURL = fallbackFlag ? `/flags/${fallbackFlag}` : '';
  
          const aggregatedNotice = (props[levelField] === 1 || props[levelField] === '1')
            ? ` <div class="popup-aggregated-box">
                  <div class="popup-aggregated">⚠️ ${t("dataAggregated")}</div>
                </div>
                `
            : '';

          // ACLED data section - COMMENTED OUT FOR PRODUCTION
          /*
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
          */
          const acledData = ''; // No ACLED data in production

          // Build popup content using CSS classes.
          const popupContent = `
            <div class="popup-content">
              ${aggregatedNotice}
              <div class="popup-header-section">
                <div class="popup-location-info">
                  <h3 class="popup-title">${props["admin2Name"] || t("unknownDistrict")}</h3>
                  <p class="popup-subtitle">${props["admin1Name"] || t("unknownRegion")}, ${countryName}</p>
                </div>
                <div class="popup-flag">
                  <img src="${flagURL}" alt="${t("flag")}" ${fallbackFlagURL ? `onerror="this.src='${fallbackFlagURL}'; this.onerror=null;"` : ''} />
                </div>
              </div>
              
              <div class="popup-classification-section">
                <div class="popup-classification-box" style="background-color: ${bgColor};">
                  <h4 class="popup-classification-text">${translateClassification(props[classificationField], t)}</h4>
                </div>
              </div>
              
              <div class="popup-stats-section">
                <div class="popup-stats-grid">
                  <div class="popup-stat-item">
                    <div class="popup-stat-content">
                      <div class="popup-stat-label">${t("populationTotal")}</div>
                      <div class="popup-stat-value">${formatNumber(props[populationTotalField]) || t("nA")}</div>
                    </div>
                  </div>
                  <div class="popup-stat-item">
                    <div class="popup-stat-content">
                      <div class="popup-stat-label">${t("populationPh2")}</div>
                      <div class="popup-stat-value">${formatNumber(props[populationPh2Field]) || t("nA")}</div>
                    </div>
                  </div>
                  <div class="popup-stat-item">
                    <div class="popup-stat-content">
                      <div class="popup-stat-label">${t("populationPh3")}</div>
                      <div class="popup-stat-value">${formatNumber(props[populationPh3Field]) || t("nA")}</div>
                    </div>
                  </div>
                </div>
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
        const inset = new mapboxgl.Map({ container:id, style:map.getStyle(), center, zoom, interactive:false, attributionControl:false, preserveDrawingBuffer:true });
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

  // Export map as PNG with watermark
  const exportMapAsPNG = async () => {
    if (!mapRef.current || isExporting) return;
    // Variables need to be available in finally
    let prevStyleWidth;
    let prevStyleHeight;
    try {
      setIsExporting(true);
      const map = mapRef.current;

      // Keep current view, but temporarily render at higher resolution
      const container = map.getContainer();
      const originalWidth = container.clientWidth;
      const originalHeight = container.clientHeight;

      const targetWidth = EXPORT_WIDTH || originalWidth;
      const targetHeight = EXPORT_HEIGHT || originalHeight;

      // Resize container to target size for higher-quality render
      prevStyleWidth = container.style.width;
      prevStyleHeight = container.style.height;
      container.style.width = `${targetWidth}px`;
      container.style.height = `${targetHeight}px`;
      map.resize();

      // Helper: wait until map is visually settled (or timeout)
      const waitForMapToSettle = (m, timeoutMs = 3000) => new Promise((resolve) => {
        const start = performance.now();
        const check = () => {
          try {
            if (!m || (!m.isMoving() && m.areTilesLoaded())) return resolve();
          } catch (_) {
            return resolve();
          }
          if (performance.now() - start > timeoutMs) return resolve();
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
      const insetMaps = Object.values(insetMapsRef.current).filter(Boolean);
      await Promise.all([waitForMapToSettle(map), ...insetMaps.map((m) => waitForMapToSettle(m))]);

      // Capture the map canvas
      const mapCanvas = map.getCanvas();

      // Draw to an offscreen canvas to add overlays and watermark
      const outCanvas = document.createElement('canvas');
      outCanvas.width = targetWidth;
      outCanvas.height = targetHeight;
      const ctx = outCanvas.getContext('2d');

      // Fill background transparent then draw map image
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(mapCanvas, 0, 0, targetWidth, targetHeight);

      // Draw title at the top center with current date
      try {
        const titleBase = t("foodInsecurityData") || 'Food Insecurity';
        const titleText = `${titleBase} – ${currentDate || ''}`;
        ctx.save();
        ctx.font = '700 20px sans-serif';
        ctx.textBaseline = 'top';
        const textMetrics = ctx.measureText(titleText);
        const paddingX = 16;
        const paddingY = 10;
        const panelW = Math.ceil(textMetrics.width + paddingX * 2);
        const panelH = 36;
        const panelX = Math.floor((targetWidth - panelW) / 2);
        const panelY = 16;
        // Background panel
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        // Text
        ctx.fillStyle = '#000';
        ctx.fillText(titleText, panelX + paddingX, panelY + paddingY);
        ctx.restore();
      } catch (e) {
        console.warn('Title draw skipped:', e);
      }

      // Draw inset maps at their configured positions/sizes
      try {
        INSETS.forEach(({ id, size: [w, h], style }) => {
          const insetMap = insetMapsRef.current[id];
          if (!insetMap) return;
          const insetCanvas = insetMap.getCanvas();
          // Compute x,y based on bottom/right offsets
          const right = parseInt((style && style.right) ? String(style.right).replace('px','') : '0', 10) || 0;
          const bottom = parseInt((style && style.bottom) ? String(style.bottom).replace('px','') : '0', 10) || 0;
          const border = 2; // matches CSS border
          const x = targetWidth - right - w - border * 2; // account for border
          const y = targetHeight - bottom - h - border * 2;
          // Draw the white background box + border similar to DOM
          ctx.save();
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#333';
          ctx.lineWidth = border;
          ctx.fillRect(x, y, w + border * 2, h + border * 2);
          ctx.strokeRect(x + border / 2, y + border / 2, w + border, h + border);
          // Draw inset canvas inside the border
          ctx.drawImage(insetCanvas, x + border, y + border, w, h);
          ctx.restore();
        });
      } catch (e) {
        // Non-fatal if inset draw fails
        console.warn('Inset maps draw skipped:', e);
      }

      // Draw a simple legend similar to the on-screen one (bottom-left)
      try {
        const legendX = 20;
        const legendY = targetHeight - 20; // start from bottom and move upwards
        const lineH = 20;
        const box = 14;
        const gap = 8;
        const items = [
          { color: '#ffffff', label: t("nonAnalyzed") },
          { color: '#d3f3d4', label: t("phase1") },
          { color: '#ffe252', label: t("phase2") },
          { color: '#fa890f', label: t("phase3") },
          { color: '#eb3333', label: t("phase4") },
          { color: '#60090b', label: t("phase5") },
          { color: '#cccccc', label: t("inaccessible") },
        ];
        ctx.save();
        ctx.font = '12px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        // Background panel
        const panelWidth = 260;
        const panelHeight = items.length * lineH + 16;
        const panelX = legendX - 10;
        const panelY = legendY - panelHeight;
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        // Items
        let curY = panelY + 8 + lineH / 2;
        items.forEach(({ color, label }) => {
          // color box
          ctx.fillStyle = color;
          ctx.fillRect(legendX, curY - box / 2, box, box);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(legendX, curY - box / 2, box, box);
          // text
          ctx.fillStyle = '#000';
          ctx.fillText(String(label || ''), legendX + box + gap, curY);
          curY += lineH;
        });
        ctx.restore();
      } catch (e) {
        console.warn('Legend draw skipped:', e);
      }

      // Load watermark image
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Draw watermark with fixed height of 100px, preserving aspect ratio
          const desiredHeight = 100;
          const scale = desiredHeight / img.height;
          const drawWidth = Math.round(img.width * scale);
          const drawHeight = Math.round(img.height * scale);
          const x = Math.floor((targetWidth - drawWidth) / 2);
          const y = Math.floor(targetHeight - drawHeight - 20); // 20px margin from bottom

          ctx.save();
          ctx.globalAlpha = 0.18; // low opacity
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
          ctx.restore();
          resolve();
        };
        img.onerror = reject;
        img.src = '/images/logo_rpca.svg';
      });

      // Trigger download
      const dataURL = outCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      link.download = `rpca-map-export-${dateStr}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Failed to export map image:', err);
    } finally {
      // Ensure we always restore size and state
      try {
        const map = mapRef.current;
        if (map) {
          const container = map.getContainer();
          if (container) {
            // Restore using stored values if available
            if (typeof prevStyleWidth !== 'undefined') container.style.width = prevStyleWidth;
            if (typeof prevStyleHeight !== 'undefined') container.style.height = prevStyleHeight;
            map.resize();
          }
        }
      } catch (_) {
        // ignore
      }
      setIsExporting(false);
    }
  };

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

  // Effect to update map language when currentLanguage changes
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    
    const updateMapLanguage = (map) => {
      // Check if map and style are ready
      if (!map || !map.isStyleLoaded()) {
        console.warn('Map style not loaded yet, skipping language update');
        return;
      }
      
      try {
        const style = map.getStyle();
        if (!style || !style.layers) {
          console.warn('Map style or layers not available');
          return;
        }
        
        // Determine the language code for Mapbox (supports 'en', 'fr', etc.)
        const languageCode = currentLanguage || 'fr';
        
        // Update all symbol layers to use the appropriate language field
        style.layers.forEach(layer => {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            // Check if the text-field uses a 'name' property
            const textField = layer.layout['text-field'];
            
            // Mapbox expressions can be complex, but typically country/place names use ['get', 'name_XX']
            // We'll update to use the language-specific field
            if (Array.isArray(textField) && textField[0] === 'get' && textField[1] && textField[1].startsWith('name')) {
              map.setLayoutProperty(layer.id, 'text-field', ['get', `name_${languageCode}`]);
            } else if (Array.isArray(textField) && textField[0] === 'coalesce') {
              // Handle coalesce expressions - update the first name field
              const newCoalesce = textField.map(item => {
                if (Array.isArray(item) && item[0] === 'get' && item[1] && item[1].startsWith('name')) {
                  return ['get', `name_${languageCode}`];
                }
                return item;
              });
              map.setLayoutProperty(layer.id, 'text-field', newCoalesce);
            }
          }
        });
      } catch (error) {
        console.warn('Error updating map language:', error);
      }
    };
    
    // Update main map
    updateMapLanguage(mapRef.current);
    
    // Update inset maps
    Object.values(insetMapsRef.current).forEach(insetMap => {
      if (insetMap) {
        updateMapLanguage(insetMap);
      }
    });
    
    console.log(`Map language updated to: ${currentLanguage || 'fr'}`);
  }, [currentLanguage, isMapLoaded]);
  
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

      {/* Export button */}
      <button
        onClick={exportMapAsPNG}
        disabled={isExporting || !isDataLoaded}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '8px 12px',
          background: '#1f7a54',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isExporting ? 'wait' : 'pointer',
          opacity: isExporting ? 0.7 : 1,
          zIndex: 2
        }}
        title={isExporting ? t("exporting") : t("exportPng")}
      >
        {isExporting ? t("exporting") : t("exportPng")}
      </button>
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
      <div className="legend" style={{ position: 'absolute', bottom: '20px', left: '20px', top: 'auto', fontSize: '11px' }}>
        {/* <h4 style={{ fontSize: '15px' }}>{t("legend") || "Legend"}</h4> */}
        
        {/* Food Insecurity Legend */}
        <div className="food-insecurity-legend">
          {/* <h5>{t("foodInsecurityData") || "Food Insecurity Data"}</h5> */}
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
        
        {/* ACLED Legend - COMMENTED OUT FOR PRODUCTION */}
        {/* {currentAcledYear && (
        //   <div className="acled-legend">
        //     <h5>{t("conflictDensityData") || "Conflict Density Data"} ({currentAcledYear})</h5>
        //     <div className="legend-item">
        //       <div className="legend-dot" style={{ 
        //         width: '8px', 
        //         height: '8px', 
        //         borderRadius: '50%', 
        //         backgroundColor: '#4E7C8D',
        //         border: '1px solid #265E74',
        //         display: 'inline-block',
        //         marginRight: '8px'
        //       }}></div>
        //       <span>{t("conflictDots") || "Conflict Events (Dots)"}</span>
        //     </div>
        //     <div className="legend-note">
        //       <em>{t("conflictDotsExplanation") || "Bigger dots = higher conflict density."}</em>
        //     </div>
        //   </div>
        // )} */}
      </div>

      {/* Critical Overlap Legend - Bottom Left Position - COMMENTED OUT FOR PRODUCTION */}
      {/* {(
      //   <div className="critical-overlap-legend-bottom-left">
      //     <h5>{t("criticalOverlapData") || "Critical Overlap Data"}</h5>
      //     <div className="legend-item">
      //       <div className="legend-pattern-box" style={{ 
      //         backgroundColor: 'rgba(128, 0, 128, 0.3)',
      //         width: '20px',
      //         height: '20px',
      //         border: '1px solid #333',
      //         display: 'inline-block',
      //         marginRight: '8px',
      //         position: 'relative',
      //         overflow: 'hidden'
      //       }}>
      //         <div style={{
      //           position: 'absolute',
      //           top: '-10px',
      //           left: '-10px',
      //           width: '40px',
      //           height: '40px',
      //           background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(128, 0, 128, 0.8) 4px, rgba(128, 0, 128, 0.8) 6px)',
      //           transform: 'rotate(45deg)'
      //         }}></div>
      //       </div>
      //       <span>{t("criticalOverlap") || "High Food Insecurity + High Conflict"}</span>
      //     </div>
      //     <div className="legend-note">
      //       <strong>{t("criticalOverlapCriteria") || "Criteria:"}</strong><br/>
      //       • {t("criticalOverlapFoodInsecurity") || "Food Insecurity: Phase 3 (Crisis), Phase 4 (Emergency), or Phase 5 (Famine)"}<br/>
      //       • {t("criticalOverlapConflict") || "Conflict: Density ≥ 0.01 AND Events ≥ 5"}<br/>
      //     </div>
      //   </div>
      // )} */}
    </div>
  );
};

export default MapView;
