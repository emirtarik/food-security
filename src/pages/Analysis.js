// src/pages/Analysis.js
import React, { useEffect, useRef, useState } from "react";
import MapView from "../components/MapView";
import ComparisonTable from "../components/ComparisonTable";
import RegionSelector from "../components/RegionSelector";
import Header from "./Header";
import Footer from "./Footer";
import SubHeader from "./SubHeader";
import Disclaimer from "../components/Disclaimer";
import { useTranslationHook } from "../i18n";
import "../styles/Analysis.css";

export default function Analysis() {
  const { t } = useTranslationHook("misc");
  const projectsSectionRef = useRef(null);

  // Tabs state: "map" or "comparison"
  const [activeTab, setActiveTab] = useState("map");

  // Define available time periods as extracted from csv_files.
  const timePeriodOptions = [
    "PJune-2025",
    "October-2024",
    "March-2024",
    "October-2022",
    "March-2022",
    "October-2021",
    "March-2021",
    "March-2020",
    "October-2019",
    "March-2019",
    "October-2018",
    "October-2017",
    "March-2017",
    "October-2016",
    "March-2016",
    "March-2015",
    "March-2014"
  ];

  // Selected region and period data from RegionSelector.
  const [selectedRegionData, setSelectedRegionData] = useState({
    region: { admin0: "", admin1: "", admin2: "" },
    period1: "March-2024",
    period2: "October-2024"
  });

  // Fetch geojson features for region selection.
  const [geojsonFeatures, setGeojsonFeatures] = useState([]);

  useEffect(() => {
    if (projectsSectionRef.current) {
      projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    // Fetch the GeoJSON file and extract features.
    fetch("/data/admin2.geojson")
      .then(response => response.json())
      .then(data => {
        // Assuming the GeoJSON file has a 'features' array.
        setGeojsonFeatures(data.features);
      })
      .catch(error => console.error("Error loading GeoJSON:", error));
  }, []);

  return (
    <div className="analysis-page">
      <Header />
      <SubHeader />
      <section id="projects" className="container visualization-section">
        <div className="row">
          <div className="col-12">
            <div className="tab-container">
              <button
                className={activeTab === "map" ? "tab-button active-tab" : "tab-button"}
                onClick={() => setActiveTab("map")}
              >
                Map
              </button>
              <button
                className={activeTab === "comparison" ? "tab-button active-tab" : "tab-button"}
                onClick={() => setActiveTab("comparison")}
              >
                Comparison
              </button>
            </div>
            <div className="tab-content">
              {activeTab === "map" ? (
                <MapView />
              ) : (
                <div>
                  <RegionSelector 
                    geojsonData={geojsonFeatures} 
                    onSelect={setSelectedRegionData} 
                    timePeriodOptions={timePeriodOptions} 
                  />
                  <ComparisonTable
                    regionSelection={selectedRegionData.region}
                    period1={selectedRegionData.period1}
                    period2={selectedRegionData.period2}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <Disclaimer isProject={false} />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
