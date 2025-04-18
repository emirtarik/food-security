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
  const { t } = useTranslationHook("analysis");
  const projectsSectionRef = useRef(null);

  // Tabs state: "map" or "comparison"
  const [activeTab, setActiveTab] = useState("map");

  // Selected region and period data from RegionSelector.
  // Initially, we set empty defaults so RegionSelector can derive its own defaults.
  const [selectedRegionData, setSelectedRegionData] = useState({
    region: { admin0: "", admin1: "", admin2: "" },
    period1: "",
    period2: ""
  });

  // Fetch geojson features for region selection from combined.geojson.
  const [geojsonFeatures, setGeojsonFeatures] = useState([]);

  useEffect(() => {
    if (projectsSectionRef.current) {
      projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    // Fetch the combined GeoJSON file and extract its features.
    fetch("/data/combined.geojson")
      .then(response => response.json())
      .then(data => {
        // Assuming the GeoJSON file has a 'features' array.
        setGeojsonFeatures(data.features);
      })
      .catch(error => console.error("Error loading combined GeoJSON:", error));
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
                {t("map")}
              </button>
              <button
                className={activeTab === "comparison" ? "tab-button active-tab" : "tab-button"}
                onClick={() => setActiveTab("comparison")}
              >
                {t("comparison")}
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
