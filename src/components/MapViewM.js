// import React, { useRef, useEffect, useState } from "react";
// // eslint-disable-next-line import/no-webpack-loader-syntax
// import mapboxgl from "!mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";
// import Legend from "./Legend";
// import "../styles/MapView.css";

// mapboxgl.accessToken =
//   "pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA";

// export function MapView({
//   selectedYear,
//   selectedMonth,
//   onChangeRegion,
//   countryData,
//   protocoleData,
//   startTimeMonth,
//   startTimeYear,
//   endTimeMonth,
//   endTimeYear,
//   displayCompare,
// }) {
//   const mapContainer = useRef(null);
//   const map = useRef(null);
//   const [lng, setLng] = useState(-1);
//   const [lat, setLat] = useState(18);
//   const [zoom, setZoom] = useState(3.5);
//   const [hoveredRegion, setHoveredRegion] = useState(null);

//   function initializeMap() {
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mkmd/clpwf4fj901g801qt81xf2d7u",
//       center: [lng, lat],
//       zoom: zoom,
//       minZoom: 2.6,
//       preserveDrawingBuffer: true,
//       pitchWithRotate: false,
//       dragRotate: false,
//       touchZoomRotate: false,

//       sources: {
//         // ... other sources ...
//         stripes: {
//           type: "image",
//           url: "/images/stripes2.jpg",
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

//     const layerIdsToRemove = [
//       "choropleth-fill",
//       "admin-0-boundary-disputed",
//       "admin-0-boundary",
//       "admin-1-boundary",
//       "admin-0-boundary-bg",
//       "admin-1-boundary-bg",
//     ];

//     layerIdsToRemove.forEach((layerId) => {
//       if (map.current.getLayer(layerId)) {
//         map.current.removeLayer(layerId);
//       }
//     });
//   }

//   function handleMove() {
//     setLng(map.current.getCenter().lng.toFixed(4));
//     setLat(map.current.getCenter().lat.toFixed(4));
//     setZoom(map.current.getZoom().toFixed(2));
//   }

//   const layerNames = [
//     "output_country-2uwmmy",
//     "output_level1-5iewsu",
//     "output_level2-8nur76",
//   ];

//   function createLayerClickHandler(e) {
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
//   }

//   useEffect(() => {
//     let isMounted = true;

//     if (!map.current) {
//       initializeMap();
//     } else {
//       layerNames.forEach((layerName) => {
//         const existingLayer = map.current.getLayer(layerName);
//         if (existingLayer) {
//           let fillColor;
//           if (displayCompare === "single") {
//             fillColor = getMapboxExpression(
//               selectedYear,
//               selectedMonth,
//               countryData
//             );
//           } else if (displayCompare === "compare") {
//             fillColor = getMapboxComparison(
//               startTimeYear,
//               startTimeMonth,
//               endTimeYear,
//               endTimeMonth,
//               countryData
//             );
//           }
//           map.current.setPaintProperty(layerName, "fill-color", fillColor);
//         }
//       });

//       const separateLayerName = "output_protocol-8p5u5g";
//       const existingSeparateLayer = map.current.getLayer(separateLayerName);

//       if (existingSeparateLayer) {
//         let fillStripes;
//         if (displayCompare === "single") {
//           fillStripes = getStripesExpression(
//             selectedYear,
//             selectedMonth,
//             protocoleData
//           );
//         } else if (displayCompare === "compare") {
//           fillStripes = getStripesExpression(
//             endTimeYear,
//             endTimeMonth,
//             protocoleData
//           );
//         }
//         map.current.setPaintProperty(
//           separateLayerName,
//           "fill-pattern",
//           fillStripes
//         );
//       }
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [
//     selectedYear,
//     selectedMonth,
//     startTimeYear,
//     startTimeMonth,
//     endTimeYear,
//     endTimeMonth,
//     displayCompare
//   ]);

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
//       <Legend displayCompare={displayCompare} />
//     </div>
//   );
// }

// export function getMapboxExpression(selectedYear, selectedMonth, countryData) {
//   const yearValue = parseInt(selectedYear);
//   const monthValue = parseInt(selectedMonth);

//   if (CLASExists(countryData, yearValue, monthValue)) {
//     let propertyName;
//     if (monthValue === 11) {
//       propertyName = `CLAS-${yearValue}-${monthValue}`;
//     } else {
//       propertyName = `CLAS-${yearValue}-0${monthValue}`;
//     }
//     return [
//       "case",
//       ["==", ["number", ["get", propertyName]], 1],
//       "#d3f3d4",
//       ["==", ["number", ["get", propertyName]], 2],
//       "#ffe252",
//       ["==", ["number", ["get", propertyName]], 3],
//       "#fa890f",
//       ["==", ["number", ["get", propertyName]], 4],
//       "#eb3333",
//       "#ffffff",
//     ];
//   } else {
//     return "#ffffff";
//   }
// }

// export function getMapboxComparison(
//   startYear,
//   startMonth,
//   endYear,
//   endMonth,
//   countryData
// ) {
//   const monthStr = (month) => (month === 11 ? "11" : `0${month}`);

//   const compareResult = [
//     "case",
//     [
//       "all",
//       ["!=", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], 0],
//       ["!=", ["get", `CLAS-${endYear}-${monthStr(endMonth)}`], 0],
//       [">", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], ["get", `CLAS-${endYear}-${monthStr(endMonth)}`]],
//     ],
//     "#d3f3d4",
//     [
//       "all",
//       ["!=", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], 0],
//       ["!=", ["get", `CLAS-${endYear}-${monthStr(endMonth)}`], 0],
//       ["==", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], ["get", `CLAS-${endYear}-${monthStr(endMonth)}`]],
//     ],
//     "#ffe252",
//     [
//       "all",
//       ["!=", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], 0],
//       ["!=", ["get", `CLAS-${endYear}-${monthStr(endMonth)}`], 0],
//       ["<", ["get", `CLAS-${startYear}-${monthStr(startMonth)}`], ["get", `CLAS-${endYear}-${monthStr(endMonth)}`]],
//     ],
//     "#fa890f",
//     "#ffffff",
//   ];
  
//   if (
//     CLASExists(countryData, startYear, startMonth) &&
//     CLASExists(countryData, endYear, endMonth)
//   ) {
//     return compareResult;
//   } else {
//     return "#ffffff";
//   }
// }

// export function getStripesExpression(selectedYear, selectedMonth, protocoleData) {
    
//   const yearValue = parseInt(selectedYear);
//   const monthValue = parseInt(selectedMonth);
//   const propertyExists = protocoleData.features.some((feature) => {
//     let propertyName;
//     if (monthValue === 11) {
//       propertyName = `PROT-${yearValue}-${monthValue}`;
//     } else {
//       propertyName = `PROT-${yearValue}-0${monthValue}`;
//     }

//     return propertyName in feature.properties;
    
//   });
    
//   if (propertyExists) {
//     let propertyName;
//     if (monthValue === 11) {
//       propertyName = `PROT-${yearValue}-${monthValue}`;
//     } else {
//       propertyName = `PROT-${yearValue}-0${monthValue}`;
//     }

//     return [
//       'case',
//       ['==', ['number', ['get', propertyName]], 1],'stripes',
//       'transparent' 
//     ];
//   } else {
//     return 'transparent'; 
  
// }
// }

// // Not robust enough, as it return true if the property exists in any feature, fixed in compareResult
// export function CLASExists(data, yearValue, monthValue) {
//   return data.features.some((feature) => {
//     let propertyName;
//     if (monthValue === 11) {
//       propertyName = `CLAS-${yearValue}-${monthValue}`;
//     } else {
//       propertyName = `CLAS-${yearValue}-0${monthValue}`;
//     }

//     return propertyName in feature.properties;
//   });
// }

// export default MapView;