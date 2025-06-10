// src/components/MapViewProjects.jsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslationHook } from "../i18n";
import '../styles/MapViewProjects.css'; // Changed CSS import

// Set your Mapbox access token.
mapboxgl.accessToken =
  'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

// --- Tileset configuration dictionary for existing layers --- // Removed
// const tilesetConfig = { ... };

// const EXPORT_VIEW = { ... }; // Removed
// const EXPORT_WIDTH = 1200, EXPORT_HEIGHT = 800; // Removed

// const INSETS = [ ... ]; // Removed

const MapViewProjects = () => { // Renamed component
  const { t } = useTranslationHook("analysis");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  // const insetMapsRef = useRef({}); // Removed

  // Ref to hold the latest selected date. // Removed
  // const currentDateRef = useRef(null);

  // Track whether the map has finished loading.
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // New state to track when all data and layers are loaded.
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper function to translate classification values. // Removed
  // const translateClassification = (classification, t) => { ... };

  // Available dates from your CSV files. // Removed
  // const dateOptions = [ ... ];
  // Default to the last possible date. // Removed
  // const [currentDateIndex, setCurrentDateIndex] = useState(dateOptions.length - 1);
  // const currentDate = dateOptions[currentDateIndex];

  // Update the currentDateRef whenever currentDate changes. // Removed
  // useEffect(() => {
  //   currentDateRef.current = currentDate;
  // }, [currentDate]);





  // State for the fill opacity (default 0.9) // Removed
  // const [fillOpacity, setFillOpacity] = useState(0.9);

  // Update the fill layer when currentDate changes. // Removed
  // useEffect(() => { ... }, [currentDate, isMapLoaded, fillOpacity]);

  // Update fill opacity when it changes. // Removed
  // useEffect(() => { ... }, [fillOpacity, isMapLoaded]);


  useEffect(() => {
    // Initialize the Mapbox map.
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788', // Kept existing style
      center: [3, 14], // Default center
      zoom: 4.45, // Default zoom
    });
    mapRef.current = map;

    // map.addControl(new mapboxgl.NavigationControl(), 'bottom-right'); // Removed navigation controls for now

    map.on('load', () => {
      setIsMapLoaded(true);

      // Add the combined GeoJSON source. // Removed 'admin-boundaries' source and layers
      // map.addSource('admin-boundaries', { ... });
      // map.addLayer({ id: 'admin-boundaries-fill', ... });
      // map.addLayer({ id: 'admin-boundaries-outline', ... });

      // Create a popup for hover interactions. // Removed complex hover/popup logic
      // const popup = new mapboxgl.Popup({ ... });
      // map.on('mouseenter', 'admin-boundaries-fill', () => { ... });
      // map.on('mouseleave', 'admin-boundaries-fill', () => { ... });
      // map.on('mousemove', 'admin-boundaries-fill', (e) => { ... });

      // When the map is idle (i.e. all layers are rendered), mark data as loaded.
      map.on('idle', () => {
        setIsDataLoaded(true);
      });

      // Add custom tileset layers on top. // Removed tilesetConfig.tiles.forEach(...)
      // tilesetConfig.tiles.forEach(tile => { ... });

      // create inset maps // Removed INSETS.forEach(...)
      // INSETS.forEach(({id,center,zoom})=>{ ... });

      // Bring the custom layers to the top. // Removed customLayers.forEach(...)
      // const customLayers = ["admin0-8pm03x", "admin1-8mekeg", "admin2-b942h4"];
      // customLayers.forEach(layerId => { ... });
    });

    return () => map.remove();
  }, []);

  // useEffect(() => { ... }, [currentDate, fillOpacity, isMapLoaded]); // Removed useEffect for fill color/opacity updates

  // const handleExportPNG = () => { ... }; // Removed handleExportPNG function

  return (
    <div className="map-view-container">
      {/* <button className="export-button" ... > ... </button> */} {/* Removed export button */}
      {/* Loading overlay */}
      {!isDataLoaded && (
        <div className="loading-overlay">
          <div className="spinner" />
          <h1>La carte est en cours de chargement, veuillez patienter...</h1>
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
      {/* Inset maps */} {/* Removed inset maps JSX */}
      {/* {INSETS.map(({ id, size: [w, h], style }) => ( ... ))} */}

      {/* Timebar / Date Slider and Opacity Slider */} {/* Removed timebar JSX */}
      {/* <div className="timebar"> ... </div> */}

      {/* Legend Overlay */} {/* Removed legend JSX */}
      {/* <div className="legend"> ... </div> */}
    </div>
  );
};

export default MapViewProjects; // Export MapViewProjects
