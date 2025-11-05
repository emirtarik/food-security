// src/pages/Analysis.js
import React, { useEffect, useRef, useState } from "react";
import MapView from "../components/MapView";
import ComparisonTable from "../components/ComparisonTable";
import RegionSelector from "../components/RegionSelector";
import CountryMapView from "../components/CountryMapView";
import Ph3PlusLinePlot from "../components/Ph3PlusLinePlot";
import Header from "./Header";
import Footer from "./Footer";
import SubHeader from "./SubHeader";
import Disclaimer from "../components/Disclaimer";
import DataDownload from "../components/DataDownload";
import { useTranslationHook } from "../i18n";
import "../styles/Analysis.css";

export default function Analysis() {
  const { t, currentLanguage } = useTranslationHook("analysis");
  const projectsSectionRef = useRef(null);

  // Tabs state: "map" | "comparison" | "download"
  const [activeTab, setActiveTab] = useState("map");

  // Shared state for country and region selection across all plots
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);

  // Map controls state
  const [dateOptions, setDateOptions] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  // Removed opacity control - not needed for production
  // Layer visibility controls removed - only food insecurity data available! 

  // Regional organization definitions (shared across components)
  const regionalOrganizations = {
    'UEMOA': {
      name: 'UEMOA',
      countries: ['Benin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinea Bissau', 'Mali', 'Niger', 'Senegal', 'Togo'],
      color: '#FF6B35',
      description: 'West African Economic and Monetary Union'
    },
    'ECOWAS': {
      name: 'ECOWAS',
      countries: ['Benin', 'Burkina Faso', 'Cabo Verde', 'Côte d\'Ivoire', 'Gambia', 'Ghana', 'Guinea', 'Guinea Bissau', 'Liberia', 'Mali', 'Niger', 'Nigeria', 'Senegal', 'Sierra Leone', 'Togo'],
      color: '#4CAF50',
      description: 'Economic Community of West African States'
    },
    'CILSS': {
      name: 'CILSS',
      countries: ['Benin', 'Burkina Faso', 'Cabo Verde', 'Chad', 'Gambia', 'Guinea Bissau', 'Mali', 'Mauritania', 'Niger', 'Senegal'],
      color: '#9C27B0',
      description: 'Permanent Interstates Committee for Drought Control in the Sahel'
    }
  };

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

  // Helper function to parse and sort dates chronologically
  const parseAndSortDates = (periods) => {
    return periods.sort((p1, p2) => {
      // Handle special case for PJune (Projection June)
      const normalizePeriod = (period) => {
        if (period.startsWith('P')) {
          // For PJune-2025, treat it as June-2025 for sorting, but keep original for display
          return period.replace('P', '');
        }
        return period;
      };

      const normalized1 = normalizePeriod(p1);
      const normalized2 = normalizePeriod(p2);

      // Parse month and year
      const parseDate = (periodStr) => {
        const [month, year] = periodStr.split('-');
        const monthIndex = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
          'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        return {
          year: parseInt(year),
          month: monthIndex[month] || 0
        };
      };

      const date1 = parseDate(normalized1);
      const date2 = parseDate(normalized2);

      // Compare years first
      if (date1.year !== date2.year) {
        return date1.year - date2.year;
      }
      
      // If same year, compare months
      return date1.month - date2.month;
    });
  };

  // Month names for translation
  const MONTH_NAMES = {
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
    fr: [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ]
  };

  // Helper function to translate month names
  const translateMonthName = (monthName, language) => {
    if (!monthName) return monthName;
    
    // Map English month names to indices
    const monthIndexMap = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    // Try to find the month index
    const monthIndex = monthIndexMap[monthName];
    
    if (monthIndex !== undefined) {
      // Use the language-specific month name
      const lang = language === 'fr' ? 'fr' : 'en';
      return MONTH_NAMES[lang][monthIndex];
    }
    
    // If not found, try to parse using Date object as fallback
    try {
      const date = new Date(`${monthName} 1, 2000`);
      if (!isNaN(date.getTime())) {
        const idx = date.getMonth();
        const lang = language === 'fr' ? 'fr' : 'en';
        return MONTH_NAMES[lang][idx];
      }
    } catch (e) {
      // If parsing fails, return original
    }
    
    // Return original if translation not found
    return monthName;
  };

  // Helper function to format dates for display
  const formatDateDisplay = (period) => {
    if (!period) return '';
    
    const language = currentLanguage || 'fr';
    
    if (period.startsWith('P')) {
      // Handle projection periods like PJune-2025
      const month = period.substring(1, period.lastIndexOf('-'));
      const year = period.substring(period.lastIndexOf('-') + 1);
      const translatedMonth = translateMonthName(month, language);
      const projectionText = t("projection");
      return `${translatedMonth} ${projectionText} ${year}`;
    }
    
    // Handle regular periods like March-2024
    const [month, year] = period.split('-');
    const translatedMonth = translateMonthName(month, language);
    return `${translatedMonth} ${year}`;
  };

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
        
        // Extract available countries from the data
        const countries = new Set();
        data.features.forEach(feature => {
          if (feature.properties.admin0Name) {
            countries.add(feature.properties.admin0Name);
          }
        });
        const sortedCountries = Array.from(countries).sort();
        setAvailableCountries(sortedCountries);
        
        // Set initial selected countries
        setSelectedCountries(['Nigeria', 'Burkina Faso', 'Côte d\'Ivoire', 'Mali', 'Senegal']);

        // Extract date options from the GeoJSON data
        const periodSet = new Set();
        data.features.forEach(f => {
          // Extract food insecurity periods
          Object.keys(f.properties)
            .filter(key => key.startsWith("classification_"))
            .forEach(key => periodSet.add(key.replace("classification_", "")));
        });
        
        const periods = Array.from(periodSet);
        const sortedPeriods = parseAndSortDates(periods);
        
        setDateOptions(sortedPeriods);
        setCurrentDateIndex(sortedPeriods.length - 1); // Set to the last available date
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
              <button
                className={activeTab === "download" ? "tab-button active-tab" : "tab-button"}
                onClick={() => setActiveTab("download")}
              >
                {t("download") || "Download"}
              </button>
            </div>
            <div className="tab-content">
              {activeTab === "map" ? (
                <div>
                  {/* Map Controls */}
                  <div className="map-controls">
                    <div className="control-section">
                      <div className="modern-date-selector">
                        <div className="date-header">
                          <div className="date-label">{t("date")}</div>
                          <div className="current-date">{formatDateDisplay(dateOptions[currentDateIndex]) || ''}</div>
                        </div>
                        <div className="slider-container">
                          <div className="slider-track">
                            <div
                              className="slider-fill"
                              style={{ width: `${dateOptions.length > 1 ? (currentDateIndex / (dateOptions.length - 1)) * 100 : 0}%` }}
                            />
                          </div>
                          <input
                            className="modern-slider"
                            type="range"
                            min="0"
                            max={dateOptions.length - 1}
                            step="1"
                            value={currentDateIndex}
                            onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
                          />
                        </div>
                        <div className="date-range-labels">
                          <span className="date-range-start">{formatDateDisplay(dateOptions[0])}</span>
                          <span className="date-range-end">{formatDateDisplay(dateOptions[dateOptions.length - 1])}</span>
                        </div>
                      </div>
                    </div>
                    {/* Layer controls removed - only food insecurity data available */}
                  </div>
                  
                  <MapView 
                    currentDateIndex={currentDateIndex}
                    setCurrentDateIndex={setCurrentDateIndex}
                    dateOptions={dateOptions}
                  />
                  
                  <Ph3PlusLinePlot
                    geojsonData={geojsonFeatures}
                    selectedCountries={selectedCountries}
                    setSelectedCountries={setSelectedCountries}
                    selectedRegions={selectedRegions}
                    setSelectedRegions={setSelectedRegions}
                    availableCountries={availableCountries}
                    regionalOrganizations={regionalOrganizations}
                  />
                </div>
              ) : activeTab === "comparison" ? (
                <div>
                  <RegionSelector
                    geojsonData={geojsonFeatures}
                    onSelect={setSelectedRegionData}
                  />

                  {/* Single Country Map View showing situation changes */}
                  {selectedRegionData.period1 && selectedRegionData.period2 && geojsonFeatures.length > 0 ? (
                    selectedRegionData.region.admin0 ? (
                      <div className="country-map-container" style={{ margin: '20px 0', minHeight: '650px', height: 'auto' }}>
                        <CountryMapView
                          country={selectedRegionData.region.admin0}
                          currentPeriod={selectedRegionData.period2}
                          otherPeriod={selectedRegionData.period1}
                          data={geojsonFeatures}
                          showChangeOverlay={true}
                        />
                      </div>
                    ) : (
                      <div className="country-map-placeholder" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', backgroundColor: '#f9f9f9', borderRadius: '4px', margin: '20px 0' }}>
                        <div style={{ textAlign: 'center', color: '#666' }}>
                          <p style={{ fontSize: '1.1em', marginBottom: '8px' }}>🗺️</p>
                          <p>{t("selectCountryPrompt")}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="country-map-placeholder" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', backgroundColor: '#f9f9f9', borderRadius: '4px', margin: '20px 0' }}>
                      <div style={{ textAlign: 'center', color: '#666' }}>
                        <p style={{ fontSize: '1.1em', marginBottom: '8px' }}>📅</p>
                        <p>{t("selectPeriodsPrompt") || "Please select two time periods to compare"}</p>
                      </div>
                    </div>
                  )}
                  
                  <ComparisonTable
                    regionSelection={selectedRegionData.region}
                    period1={selectedRegionData.period1}
                    period2={selectedRegionData.period2}
                  />
                </div>
              ) : (
                <div>
                  <DataDownload />
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
