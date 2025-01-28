// import React, { useRef, useEffect, useState } from "react";
// // eslint-disable-next-line import/no-webpack-loader-syntax
// import mapboxgl from "!mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import { mapStyle } from "./mapStyle";
// import "@watergis/mapbox-gl-export/css/styles.css";
// import Legend from "./Legend";
// import "../styles/MapView.css";
// import { countryCoordinates } from "./Coordinates";
// import { getMapboxExpression, getStripesExpression } from "./MapViewM";

// mapboxgl.accessToken =
//   "pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA";

// function MapView({
//   selectedYear,
//   selectedMonth,
//   onChangeRegion,
//   countryProjectArray,
//   countryData,
//   protocoleData,
// }) {
//   {/*console.log(countryData, "mapview comp");*/}
//   const mapContainer = useRef(null);
//   const map = useRef(null);
//   const [lng, setLng] = useState(-1);
//   const [lat, setLat] = useState(18);
//   const [zoom, setZoom] = useState(7);
//   const [hoveredRegion, setHoveredRegion] = useState(null);
//   const features = countryProjectArray.map((project) => {
//     const matchingCoordinate = countryCoordinates.find(
//       ({ country }) => country === project.country
//     );

//     return {
//       type: "Feature",
//       properties: {
//         countryName: project.country,
//         countProjects: project.countProjects,
//       },
//       geometry: {
//         type: "Point",
//         coordinates: matchingCoordinate.coordinates,
//       },
//     };
//   });
//   {/*console.log("features", features)*/};

//   const layerNames = [
//     "output_country-2uwmmy",
//     "output_level1-5iewsu",
//     "output_level2-8nur76",
//   ];

//   const initializeMap = () => {
//     {/*console.log("Initializing map...")*/};
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mkmd/clpwf4fj901g801qt81xf2d7u",
//       center: [lng, lat],
//       zoom: zoom,
//       minZoom: 2.6,
//       pitchWithRotate: false,
//       dragRotate: false,
//       touchZoomRotate: false,
//       preserveDrawingBuffer: true,
//       sources: {
//         // ... other sources ...
//         stripes: {
//           type: "image",
//           url: "/images/stripes2.jpg", // Path to your local image file
//           coordinates: [
//             [0, 0],
//             [1, 0],
//             [1, 1],
//             [0, 1],
//           ],
//         },
//       },
//     });
//     map.current.addControl(new mapboxgl.FullscreenControl());
//     map.current.on("move", handleMove);

//     layerNames.forEach((layerName) => {
//       map.current.on("click", layerName, createLayerClickHandler);
//     });
//     map.current.setMaxPitch(0);
//     map.current.setMinPitch(0);
//   };

//   const addBoundaryToMap = () => {
//     const countryBoundary = mapStyle.countryBoundary;
//     map.current.addLayer(countryBoundary);
//   };

//   useEffect(() => {
//     if (map.current && features && features.length > 0) {
//       const existingSource = map.current.getSource("projectClusters");
//       if (existingSource) {
//         {/*console.log("Updating existing source data...")*/};
//         // Source already exists, update its data
//         existingSource.setData({
//           type: "FeatureCollection",
//           features: features,
//         });
//         // Update text label field property
//         map.current.setLayoutProperty("projectClusters-labels", "text-field", [
//           "to-string",
//           ["get", "countProjects"],
//         ]);
//         {/*console.log("Source data updated:", "projectClusters")*/};
//       } else {
//         {/*console.log("Adding new source...")*/};
//         // Source doesn't exist, add it
//         setTimeout(() => {
//           addBoundaryToMap();
//           map.current.addSource("projectClusters", {
//             type: "geojson",
//             data: {
//               type: "FeatureCollection",
//               features: features,
//             },
//             cluster: true,
//             clusterMaxZoom: 14,
//             clusterRadius: 10,
//           });
//           {/*console.log("Source added:", "projectClusters")*/};
//           map.current.addLayer(mapStyle.projectClusters.circles);
//           map.current.addLayer(mapStyle.projectClusters.labels);
//         }, 6);
//       }
//     }
//   }, [features]);

//   const handleMove = () => {
//     setLng(map.current.getCenter().lng.toFixed(4));
//     setLat(map.current.getCenter().lat.toFixed(4));
//     setZoom(map.current.getZoom().toFixed(2));
//   };

//   const createLayerClickHandler = (e) => {
//     const feature = e.features[0];
//     const lngLat = e.lngLat;

//     const newHoveredRegion = {
//       name: feature.properties["Name_2"],
//       key: feature.properties["Key"],
//     };

//     let popup = null;

//     if (popup) {
//       popup.remove();
//     }
//     let name = feature.properties.Name_2;
//     if (name === "0") {
//       name = feature.properties.Name_1.replace(
//         /(?<=[a-z])(?=[A-Z])/g,
//         " "
//       ).toUpperCase();
//     } else {
//       name = name.replace(/(?<=[a-z])(?=[A-Z])/g, " ").toUpperCase();
//     }

//     popup = new mapboxgl.Popup({
//       maxWidth: "",
//       maxHeight: "50px",
//       className: "custom-popup",
//       closeButton: false,
//     })
//       .setLngLat(lngLat)
//       .setHTML(`${name}`)
//       .addTo(map.current);

//     onChangeRegion(newHoveredRegion);
//   };

//   useEffect(() => {
//     let isMounted = true;

//     if (!map.current) {
//       initializeMap();
//     } else {
//       layerNames.forEach((layerName) => {
//         const existingLayer = map.current.getLayer(layerName);
//         if (existingLayer) {
//           map.current.setPaintProperty(
//             layerName,
//             "fill-color",
//             getMapboxExpression(selectedYear, selectedMonth, countryData)
//           );
//         }
//       });

//       const separateLayerName = "output_protocol-8p5u5g";
//       const existingSeparateLayer = map.current.getLayer(separateLayerName);

//       if (existingSeparateLayer) {
//         map.current.setPaintProperty(
//           separateLayerName,
//           "fill-pattern",
//           getStripesExpression(selectedYear, selectedMonth, protocoleData)
//         );
//       }
//     }
//   }, [selectedYear, selectedMonth]);

//   useEffect(() => {
//     let isMounted = true;

//     if (map.current) {
//       map.current.on("move", handleMove);
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [lat, lng, zoom]);

//   return (
//     <div className="view-container">
//       <div ref={mapContainer} className="map-container" />
//       <Legend displayCompare={"single"}/>
//     </div>
//   );
// }

// export default MapView;
