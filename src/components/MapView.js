// src/components/MapView.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '../styles/MapView.css'; // Import CSS for custom styling

// Set your Mapbox access token.
mapboxgl.accessToken =
  'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

// --- Tileset configuration dictionary for existing layers ---
const tilesetConfig = {
  tiles: [
    {
      id: "admin0",
      source: "admin0_source",         // Fill in your source name
      sourceLayer: "admin0-8pm03x",      // Fill in your source layer name
      type: "vector",
      layerType: "line",               // Using line layer for boundaries.
      url: "mapbox://mkmd.73x5k6gi",     // Fill in your tileset URL
      mouseEvent: false,
    },
    {
      id: "admin1",
      source: "admin1_source",
      sourceLayer: "admin1-8mekeg",
      type: "vector",
      layerType: "line",
      url: "mapbox://mkmd.35g07uqp",
      mouseEvent: false,
    },
    {
      id: "admin2",
      source: "admin2_source",
      sourceLayer: "admin2_b942h4",
      type: "vector",
      layerType: "line",
      url: "mapbox://mkmd.byn4n90u",
      mouseEvent: true,
    }
  ]
};

const MapView = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  // Track whether the map has finished loading.
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Update the available dates from your non-commented csv_files.
  const dateOptions = [
    "March-2014",
    "March-2015",
    "March-2016",
    "October-2016",
    "March-2017",
    "October-2017",
    "October-2018",
    "March-2019",
    "October-2019",
    "March-2020",
    "March-2021",
    "October-2021",
    "March-2022",
    "October-2022",
    "March-2024",
    "October-2024",
    "PJune-2025"
  ];
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const currentDate = dateOptions[currentDateIndex];

  // State for the fill opacity (default 0.9)
  const [fillOpacity, setFillOpacity] = useState(0.9);

  // When currentDate changes, animate a fade-out, update the data, then fade back in.
  useEffect(() => {
    if (!isMapLoaded) return;
    const map = mapRef.current;
    const layerId = 'admin-boundaries-fill';
    if (map && map.getLayer(layerId)) {
      // Fade out the fill layer.
      map.setPaintProperty(layerId, 'fill-opacity', 0);
      setTimeout(() => {
        const source = map.getSource('admin-boundaries');
        if (source) {
          source.setData(`/data/joined_admin2_${currentDate}.geojson`);
        }
        map.setPaintProperty(layerId, 'fill-opacity', fillOpacity);
      }, 500);
    }
  }, [currentDate, isMapLoaded, fillOpacity]);

  // When fillOpacity changes, update the fill layer.
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
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788', // Your published style
      center: [3, 14],
      zoom: 4.45,
    });
    mapRef.current = map;

    // Add navigation controls.
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setIsMapLoaded(true);

      // Add your GeoJSON source using the initial date.
      map.addSource('admin-boundaries', {
        type: 'geojson',
        data: `/data/joined_admin2_${currentDate}.geojson`,
      });

      // Determine the insertion point for your custom layers.
      // Here we try to use the custom admin0 layer.
      const customAdmin0LayerId = 'admin0-8pm03x';
      let insertionLayerId = customAdmin0LayerId;
      if (!map.getLayer(customAdmin0LayerId)) {
        const layers = map.getStyle().layers;
        insertionLayerId = layers.find(layer => layer.type === 'symbol')?.id;
      }

      // 1. Add the base fill layer.
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
              ['get', 'classification'],
              'Non analysée', '#ffffff',
              'Phase 1 : minimal', '#d3f3d4',
              'Phase 2 : sous pression', '#ffe252',
              'Phase 3 : crises', '#fa890f',
              'Phase 4 : urgence', '#eb3333',
              'inaccessible', '#cccccc',
              /* default */ '#ffffff'
            ],
            'fill-opacity': fillOpacity,
            'fill-opacity-transition': { duration: 500 }
          },
        },
        insertionLayerId
      );

      // 2. Add the outline layer with data-driven line width (for hover highlighting).
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
              3,    // Thicker line on hover.
              0.1  // Default line width.
            ]
          },
        },
        insertionLayerId
      );

      // 3. Create a popup for hover interactions.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'custom-popup',
      });

      // --- Hover highlighting ---
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

          const props = feature.properties;
          const popupContent = `<div>
            <strong>${props["admin2Name"] || 'N/A'} - ${props["admin0Name"] || 'N/A'}</strong><br/>
            <strong>Population:</strong> ${props["Population totale"] || 'N/A'}<br/>
            <strong>Population Ph 2:</strong> ${props["Population totale en Ph 2"] || 'N/A'}<br/>
            <strong>Population Ph 3+:</strong> ${props["Population totale en Ph 3 à 5"] || 'N/A'}
          </div>`;
          popup.setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        }
      });

      // --- Now, add our custom tileset layers on top ---
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
      <div ref={mapContainerRef} className="map-container" />
      
      {/* Timebar / Date Slider and Opacity Slider */}
      <div className="timebar">
        <div className="date-selector">
          <span className="active-date">Date: {currentDate}</span>
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
          <label htmlFor="opacityRange">Opacity:</label>
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
          <span>Non analysée</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#d3f3d4' }}></div>
          <span>Phase 1 : minimal</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#ffe252' }}></div>
          <span>Phase 2 : sous pression</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#fa890f' }}></div>
          <span>Phase 3 : crises</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#eb3333' }}></div>
          <span>Phase 4 : urgence</span>
        </div>
        <div className="legend-item">
          <div className="legend-color-box" style={{ backgroundColor: '#cccccc' }}></div>
          <span>Inaccessible</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
