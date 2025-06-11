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
      // Normalize country names: trim and handle potential inconsistencies if necessary
      // Normalize country names: trim and convert to lowercase
      const country = project.recipient?.trim().toLowerCase();
      if (country) {
        acc[country] = (acc[country] || 0) + 1;
      }
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
  const legendColors = ['#FFFFE0', '#FFD700', '#FFA500', '#FF6347', '#FF0000', '#B22222'];
  const legendStops = [0, 1, 5, 10, 20, 50]; // Min projects for each color

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [20, 10], // Centered more globally
      zoom: 1.5, // Zoomed out to see the world
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
            legendStops[5], legendColors[5]  // 50+ projects
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

      // Interactivity: Popup on hover
      map.on('mousemove', choroplethLayerId, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          const feature = e.features[0];
          const countryName = feature.properties.name_en; // Original name from mapbox
          const projectCount = projectCountsByCountry[countryName?.toLowerCase()] || 0; // Lookup with lowercase

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${countryName}</strong><br />Projects: ${projectCount}`)
            .addTo(map);
        }
      });

      map.on('mouseleave', choroplethLayerId, () => {
        map.getCanvas().style.cursor = '';
        popupRef.current.remove();
      });

      map.on('idle', () => setIsDataLoaded(true));
    });

    return () => map.remove();
  }, []); // Empty dependency array to run only once on mount

  // Effect to update feature states when projectCountsByCountry changes
  useEffect(() => {
    if (isMapLoaded && mapRef.current && mapRef.current.isStyleLoaded() && projects.length > 0) {
      // Small timeout to ensure source is available after style load, especially for vector tiles
      const timeoutId = setTimeout(() => {
        const map = mapRef.current;
        // Query all features from the country boundaries source layer
        // This might be performance intensive if the layer has too many features not visible.
        // A better approach for global datasets is often to have a list of all country ISOs/names
        // and iterate through that, setting feature state by feature.id (which is usually the ISO code).
        // For Mapbox country-boundaries-v1, feature.id is often the ISO 3166-1 alpha-2 code.

        // Clear previous feature states first (optional, but good practice)
        // This requires knowing all possible feature IDs or iterating over previously set states.
        // For simplicity, we'll just update. If a country previously had projects and now has 0,
        // its state will be updated to 0 or removed (if we explicitly remove state for 0).

        const features = map.querySourceFeatures(countryBoundariesSourceId, {
          sourceLayer: 'country_boundaries'
        });

        // Create a map of country ISO codes to their vector tile feature IDs if needed
        // For mapbox.country-boundaries-v1, the 'id' field of the feature can often be used directly if it corresponds to a known ID scheme (like ISO a2).
        // The property 'iso_3166_1_alpha_3' is more standard for matching with our project data if recipient names are English.
        // We need to match `projectCountsByCountry` (keyed by lowercase country name) to the map features.

        if (features && features.length > 0) {
          const allProcessedFeatureIds = new Set();

          features.forEach(feature => {
            const countryNameFromMap = feature.properties.name_en?.toLowerCase();
            const featureId = feature.id;
            allProcessedFeatureIds.add(featureId);

            if (countryNameFromMap && projectCountsByCountry[countryNameFromMap] !== undefined) {
              map.setFeatureState(
                { source: countryBoundariesSourceId, sourceLayer: 'country_boundaries', id: featureId },
                { project_count: projectCountsByCountry[countryNameFromMap] }
              );
            } else {
              // Set count to 0 for countries from map not in our current filtered list or explicitly having 0
              map.setFeatureState(
                { source: countryBoundariesSourceId, sourceLayer: 'country_boundaries', id: featureId },
                { project_count: 0 }
              );
            }
          });
        }
      }, 500); // Delay to allow map to settle and source to be queryable.

      return () => clearTimeout(timeoutId);
    }
  }, [projectCountsByCountry, isMapLoaded, projects]); // projects dependency ensures re-run if initial projects load late.


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
        <h4>{t('projectCountLegendTitle', {ns: 'global'}) || "Projects per Country"}</h4>
        {legendStops.map((stop, index) => (
          <div key={index} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: legendColors[index] }} />
            <span className="legend-label">
              {index === legendStops.length - 1 ? `${stop}+` : `${stop}${legendStops[index+1] ? ` - ${legendStops[index+1]-1}` : '+'}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapViewProjects;
