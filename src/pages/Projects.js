// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import MapView from "../components/MapView";
// // import Timebar from "../components/Timebar";
// // import Sidebar from "../components/Sidebar";
// import Search from "../components/Search";
// import DataBlocksList from "../components/DataBlocksList";
// import data from "../data/projectData.json";
// import Header from "./Header";
// import Footer from "./Footer";
// import SubHeader from "./SubHeader";
// // import { timeFunction } from "./Analysis";
// import Disclamer from "../components/Disclaimer";
// import { Logo } from "../components/Sidebar";
// import CaptureSectionScreenshot from "../components/Screenshot";
// import { useTranslationHook } from "../i18n";

// export default function Projects() {
//   const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
//   const projectsSectionRef = useRef(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState([]);
//   const [selectedLocations, setSelectedLocations] = useState([]);
//   const [selectedPartner, setSelectedPartner] = useState([]);
//   const [selectedProjectTypes, setselectedProjectTypes] = useState([]);
//   const [selectedTargets, setSelectedTargets] = useState([]);
//   const [selectedTopics, setSelectedTopics] = useState([]);

//   const [countryData, setCountryData] = useState(null);
//   const [level1Data, setLevel1Data] = useState(null);
//   const [level2Data, setLevel2Data] = useState(null); //for diff layers
//   const [protocoleData, setProtocoleData] = useState(null);
//   const { initialSelectedYear, initialSelectedMonth } = timeFunction();
//   const [selectedYear, setSelectedYear] = useState(initialSelectedYear);
//   const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth);
//   const [hoveredRegion, setHoveredRegion] = useState(null);
//   const [filteredData, setFilteredData] = useState({
//     filteredCountryData: [],
//     filteredLevel1Data: [],
//     filteredLevel2Data: [],
//   });
//   const handleFilteredDataChange = (filteredData) => {
//     setFilteredData(filteredData);
//   };

//   const handleYearChange = (year) => {
//     setSelectedYear(year);
//   };
//   const handleMonthChange = (month) => {
//     setSelectedMonth(month);
//   };

//   const handleRegionChange = (region) => {
//     setHoveredRegion(region);
//   };

//   const handleClearAllFilters = () => {
//     setSearchQuery("");
//     setSelectedStatus([]);
//     setSelectedLocations([]);
//     setSelectedPartner([]);
//     setselectedProjectTypes([]);
//     setSelectedTargets([]);
//     setSelectedTopics([]);
//   };

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const responseCountry = await axios.get(
//           "./data/output_country.geojson"
//         );
//         setCountryData(responseCountry.data);

//         const responseLevel1 = await axios.get("./data/output_level1.geojson");
//         setLevel1Data(responseLevel1.data);

//         const responseLevel2 = await axios.get("./data/output_level2.geojson");
//         setLevel2Data(responseLevel2.data);

//         const responseProtocole = await axios.get(
//           "./data/output_protocol.geojson"
//         );
//         setProtocoleData(responseProtocole.data);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }

//     fetchData();
//   }, []);

//   const filteredDataBlock = data
//     .filter((entry) => {
//       if (selectedPartner.length === 0) {
//         return true;
//       }
//       const partnersArray = (entry.Partners || "")
//         .split(";")
//         .map((partner) => partner.trim());
//       return selectedPartner.some((selectedPartner) =>
//         partnersArray.includes(selectedPartner)
//       );
//     })
//     .filter((entry) => {
//       if (selectedLocations.length === 0) {
//         return true;
//       }
//       const locationsArray = (entry.Location || "")
//         .split(";")
//         .map((location) => location.trim());
//       return selectedLocations.some((selectedLocation) =>
//         locationsArray.includes(selectedLocation)
//       );
//     })
//     .filter((entry) => {
//       if (selectedStatus.length === 0) {
//         return true;
//       }
//       const statusArray = (entry.Status || "")
//         .split(";")
//         .map((status) => status.trim());
//       return selectedStatus.some((selectedStatus) =>
//         statusArray.includes(selectedStatus)
//       );
//     })
//     .filter((entry) => {
//       if (selectedTopics.length === 0) {
//         return true;
//       }
//       const topicsArray = (entry.Topic || "")
//         .split(";")
//         .map((topic) => topic.trim());
//       return selectedTopics.some((selectedTopic) =>
//         topicsArray.includes(selectedTopic)
//       );
//     })
//     .filter((entry) => {
//       if (selectedTargets.length === 0) {
//         return true;
//       }
//       const targetsArray = (entry.Target || "")
//         .split(";")
//         .map((target) => target.trim());
//       return selectedTargets.some((selectedTarget) =>
//         targetsArray.includes(selectedTarget)
//       );
//     })
//     .filter((entry) => {
//       if (selectedProjectTypes.length === 0) {
//         return true;
//       }
//       const projectTypesArray = (entry.ProjectType || "")
//         .split(";")
//         .map((projectType) => projectType.trim());
//       return selectedProjectTypes.some((selectedProjectTypes) =>
//         projectTypesArray.includes(selectedProjectTypes)
//       );
//     })
//     .filter((entry) => {
//       if (!searchQuery) {
//         return true;
//       }
//       return entry.Project.toLowerCase().includes(searchQuery.toLowerCase());
//     });

//   // Calculating projects per country
//   let countryProjectArray = [];

//   // Move the logic for creating countryProjectArray here
//   const projectsPerCountry = filteredDataBlock.reduce((acc, entry) => {
//     const locations = entry.Location.split(";").map((location) =>
//       location.trim()
//     );

//     locations.forEach((location) => {
//       // Remove spaces from the location and convert it to lowercase
//       const modifiedLocation = location.replace(/\s+/g, "");

//       if (!countryData) {
//         return; // Handle the case when countryData is null or undefined
//       }

//       // Loop through countryData to find a matching Country
//       countryData.features.forEach((countryFeature) => {
//         const countryProperties = countryFeature.properties;
//         const countryName = countryProperties.Country;

//         if (modifiedLocation === countryName) {
//           if (!acc[modifiedLocation]) {
//             acc[modifiedLocation] = {
//               country: modifiedLocation,
//               countProjects: 0,
//               centroid: null,
//             };
//           }
//           acc[modifiedLocation].countProjects++;

//           // Calculate the centroid
//           const countryGeometry = countryFeature.geometry;
//           const countryCentroid = [];

//           // Add centroid to the countryProjectArray
//           acc[modifiedLocation].centroid = countryCentroid;
//         }
//       });
//     });

//     return acc;
//   }, {});

//   // Convert the object into an array of objects with named properties
//   countryProjectArray = Object.values(projectsPerCountry).map(
//     ({ country, countProjects, centroid }) => ({
//       country: country.replace(/\s+/g, " "),
//       countProjects,
//       centroid,
//     })
//   );

//   const pageTitle = "Response";
//   const totalProjects = countryProjectArray.reduce(
//     (total, country) => total + country.countProjects,
//     0
//   );

//   useEffect(() => {
//     // Scroll to the projects section when the component mounts
//     if (projectsSectionRef.current) {
//       projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, []); // Empty dependency array ensures the effect runs only once after initial render

  
//   return (
//     <div>
//       <Header />
//       <SubHeader />
//       <section
//         id="calendar-header"
//         className="container row-filter pt-5"
//         style={{ marginBottom: "0px" }}
//         ref={projectsSectionRef}
//       >
//         <div className="row">
//           <div className="col-sm-9">
//           </div>
//         </div>
//         <Search
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           selectedPartner={selectedPartner}
//           setSelectedPartner={setSelectedPartner}
//           selectedLocations={selectedLocations}
//           setSelectedLocations={setSelectedLocations}
//           selectedStatus={selectedStatus}
//           setSelectedStatus={setSelectedStatus}
//           selectedTopics={selectedTopics}
//           setSelectedTopics={setSelectedTopics}
//           selectedTargets={selectedTargets}
//           setSelectedTargets={setSelectedTargets}
//           selectedProjectTypes={selectedProjectTypes}
//           setselectedProjectTypes={setselectedProjectTypes}
//         />
//       </section>
//       <section
//         id="projects"
//         className="container row-filter"
//         style={{ marginTop: "15px", marginBottom: "0px" }}
//       >
//         <div>
//           <div style={{marginLeft: "15px"}}><CaptureSectionScreenshot></CaptureSectionScreenshot></div>
//           <div className="row">
//             <div className="col-sm-6 col-lg-4 col-xl-3">
//               {/*<Sidebar
//                 countryData={countryData}
//                 level1Data={level1Data}
//                 level2Data={level2Data}
//                 regionInfo={hoveredRegion}
//                 onChangeYear={handleYearChange}
//                 selectedYear={selectedYear}
//                 onChangeMonth={handleMonthChange}
//                 selectedMonth={selectedMonth}
//               >
//               </Sidebar>*/}
//               <Logo selectedYear={selectedYear} />
//               <Timebar
//                 onChangeYear={handleYearChange}
//                 selectedYear={selectedYear}
//                 onChangeMonth={handleMonthChange}
//                 selectedMonth={selectedMonth}
//                 displayMap={"map"}
//               />
//             </div>
//             <div className="col-xl-9">
//               <MapView
//                 protocoleData={protocoleData}
//                 countryData={countryData}
//                 regionInfo={hoveredRegion}
//                 onChangeYear={handleYearChange}
//                 onChangeRegion={handleRegionChange}
//                 selectedYear={selectedYear}
//                 onChangeMonth={handleMonthChange}
//                 selectedMonth={selectedMonth}
//                 countryProjectArray={countryProjectArray}
//               />
//             </div>
//           </div>
//         </div>
//       </section>
//       <section
//         id="projects-list"
//         className="container doc-results projects-results"
//         style={{ marginTop: "0px" }}
//       >
//         <div className="row">
//           <DataBlocksList filteredDataBlock={filteredDataBlock} />
//         </div>
//         <Disclamer isProject={true} />
//       </section>
//       <Footer />
//     </div>
//   );
// }
