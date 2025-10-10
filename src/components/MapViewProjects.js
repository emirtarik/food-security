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

// Country name mapping: Mapbox English names -> Preferred display names
const COUNTRY_NAME_MAPPING = {
  'the gambia': 'Gambia',
  'cape verde': 'Cabo Verde',
  'ivory coast': 'Côte d\'Ivoire',
};

// Function to get the preferred country name
const getPreferredCountryName = (mapboxName) => {
  const lowerName = mapboxName?.toLowerCase();
  return COUNTRY_NAME_MAPPING[lowerName] || mapboxName;
};

const MapViewProjects = ({ projects }) => { // Added projects prop
  const { t } = useTranslationHook("analysis");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Kept for loading overlay

  // Calculate project counts by country
  const projectCountsByCountry = React.useMemo(() => {
    if (!projects || projects.length === 0) {
      return {};
    }
    return projects.reduce((acc, project) => {
      const recipient = project.recipient?.trim();
      if (!recipient) return acc;

      // Parse multiple countries from recipient field
      // Split by common delimiters: semicolon, plus sign, comma
      const countries = recipient
        .split(/[;+,]/) // Split by semicolon, plus, or comma
        .map(country => country.trim().toLowerCase()) // Trim whitespace and normalize to lowercase
        .filter(country => country.length > 0); // Remove empty strings

      // Count each country individually
      countries.forEach(country => {
        acc[country] = (acc[country] || 0) + 1;
      });

      return acc;
    }, {});
  }, [projects]);

  // Available dates from your CSV files. // Removed
  // const dateOptions = [ ... ]; // Kept for now, in case it's used elsewhere, but likely removable
  // Default to the last possible date. // Removed
  // const [currentDateIndex, setCurrentDateIndex] = useState(dateOptions.length - 1); // Kept for now
  const popupRef = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }));





  // State for the fill opacity (default 0.9) // Removed
  // const [fillOpacity, setFillOpacity] = useState(0.9);

  // Update the fill layer when currentDate changes. // Removed
  // useEffect(() => { ... }, [currentDate, isMapLoaded, fillOpacity]);

  // Update fill opacity when it changes. // Removed
  // useEffect(() => { ... }, [fillOpacity, isMapLoaded]);


  const countryBoundariesSourceId = 'country-boundaries-data';
  const choroplethLayerId = 'countries-project-counts-fill';
  const choroplethOutlineLayerId = 'countries-project-counts-outline';

  // Define color scale for the choropleth legend
  const legendColors = ['#FFFFE0', '#FFD700', '#FFA500', '#FF6347', '#FF0000', '#B22222', '#8B0000'];
  const legendStops = [0, 1, 5, 10, 20, 50, 100]; // Min projects for each color

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [3, 14], // Match MapView.js coordinates
      zoom: 4.45, // Match MapView.js zoom level
    });
    mapRef.current = map;

    map.on('load', () => {
      setIsMapLoaded(true);

      // Add country boundaries source from Mapbox
      // This source provides country polygons with properties like iso_3166_1_alpha_3 (ISO code) and name_en
      map.addSource(countryBoundariesSourceId, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

      // Add choropleth layer for project counts
      map.addLayer({
        id: choroplethLayerId,
        type: 'fill',
        source: countryBoundariesSourceId,
        'source-layer': 'country_boundaries', // Standard layer name in this tileset
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['feature-state', 'project_count'], 0], // Use feature-state, default to 0 if no state
            legendStops[0], legendColors[0], // 0 projects
            legendStops[1], legendColors[1], // 1-4 projects
            legendStops[2], legendColors[2], // 5-9 projects
            legendStops[3], legendColors[3], // 10-19 projects
            legendStops[4], legendColors[4], // 20-49 projects
            legendStops[5], legendColors[5], // 50-99 projects
            legendStops[6], legendColors[6]  // 100+ projects
          ],
          'fill-opacity': 0.7,
        },
      });

      // Add outline layer for country borders
      map.addLayer({
        id: choroplethOutlineLayerId,
        type: 'line',
        source: countryBoundariesSourceId,
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': '#666',
          'line-width': 0.5,
        },
      });

      map.on('idle', () => setIsDataLoaded(true));
    });

    return () => map.remove();
  }, []); // Empty dependency array to run only once on mount

  // Effect to set up interactivity handlers with current projectCountsByCountry
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const map = mapRef.current;

    const handleMouseMove = (e) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        const feature = e.features[0];
        const mapboxCountryName = feature.properties.name_en; // Original name from mapbox
        const preferredCountryName = getPreferredCountryName(mapboxCountryName);
        const projectCount = projectCountsByCountry[preferredCountryName?.toLowerCase()] || 0; // Lookup with normalized name

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${preferredCountryName}</strong><br />Projects: ${projectCount}`)
          .addTo(map);
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      popupRef.current.remove();
    };

    // Add event handlers
    map.on('mousemove', choroplethLayerId, handleMouseMove);
    map.on('mouseleave', choroplethLayerId, handleMouseLeave);

    // Cleanup: remove handlers when effect re-runs or component unmounts
    return () => {
      map.off('mousemove', choroplethLayerId, handleMouseMove);
      map.off('mouseleave', choroplethLayerId, handleMouseLeave);
    };
  }, [isMapLoaded, projectCountsByCountry]); // Re-run when projectCountsByCountry changes

  // Effect to update feature states when projectCountsByCountry changes
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    // Small timeout to ensure source is available after style load, especially for vector tiles
    const timeoutId = setTimeout(() => {
      const map = mapRef.current;
      // Query all features from the country boundaries source layer
      const features = map.querySourceFeatures(countryBoundariesSourceId, {
        sourceLayer: 'country_boundaries'
      });

      if (features && features.length > 0) {
        features.forEach(feature => {
          const mapboxCountryName = feature.properties.name_en;
          const preferredCountryName = getPreferredCountryName(mapboxCountryName);
          const normalizedCountryName = preferredCountryName?.toLowerCase();
          const featureId = feature.id;

          // Get the project count for this country (default to 0 if no projects)
          const projectCount = (normalizedCountryName && projectCountsByCountry[normalizedCountryName]) || 0;
          
          map.setFeatureState(
            { source: countryBoundariesSourceId, sourceLayer: 'country_boundaries', id: featureId },
            { project_count: projectCount }
          );
        });
      }
    }, 500); // Delay to allow map to settle and source to be queryable.

    return () => clearTimeout(timeoutId);
  }, [projectCountsByCountry, isMapLoaded]); // Re-run whenever project counts change


  return (
    <div className="map-view-container">
      {!isDataLoaded && (
        <div className="loading-overlay">
          <div className="spinner" />
          <h1>{t('mapLoadingMessage', { ns: 'global' }) || "The map is loading, please wait..."}</h1>
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
      <div className="legend-container mapboxgl-ctrl-bottom-left">
        <h4>Project count</h4>
        {legendStops.slice(1).map((stop, index) => {
          const actualIndex = index + 1; // Offset because we skipped the first item (0)
          return (
            <div key={actualIndex} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: legendColors[actualIndex] }} />
              <span className="legend-label">
                {actualIndex === legendStops.length - 1 ? `${stop}+` : `${stop} - ${legendStops[actualIndex+1]-1}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapViewProjects;
