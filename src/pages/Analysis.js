// src/pages/Analysis.js
import React, { useEffect, useRef, useState } from "react";
import MapView from "../components/MapView";
import ComparisonTable from "../components/ComparisonTable";
import RegionSelector from "../components/RegionSelector";
import CountryMapView from "../components/CountryMapView";
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

  // Determine current admin level from selectedRegionData
  const getCurrentAdminLevel = (region) => {
    if (region.admin2) return "admin2";
    if (region.admin1) return "admin1";
    if (region.admin0) return "admin0";
    return null;
  };

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
                  {/* Conditional rendering of CountryMapView components */}
                  {getCurrentAdminLevel(selectedRegionData.region) === "admin0" && selectedRegionData.region.admin0 && selectedRegionData.period1 && selectedRegionData.period2 && geojsonFeatures.length > 0 && (
                    <div className="country-maps-container" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
                      <div style={{ width: '48%' }}> {/* Adjusted width for better spacing */}
                        <CountryMapView
                          country={selectedRegionData.region.admin0}
                          period={selectedRegionData.period1}
                          data={geojsonFeatures}
                        />
                      </div>
                      <div style={{ width: '48%' }}> {/* Adjusted width for better spacing */}
                        <CountryMapView
                          country={selectedRegionData.region.admin0}
                          period={selectedRegionData.period2}
                          data={geojsonFeatures}
                        />
                      </div>
                    </div>
                  )}
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
