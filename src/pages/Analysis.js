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
import { useTranslationHook } from "../i18n";
import "../styles/Analysis.css";

export default function Analysis() {
  const { t, i18n } = useTranslationHook("analysis");
  const projectsSectionRef = useRef(null);

  // Tabs state: "map" or "comparison"
  const [activeTab, setActiveTab] = useState("map");

  // Shared state for country and region selection across all plots
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);

  // Map controls state
  const [dateOptions, setDateOptions] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [showFoodInsecurityLayer, setShowFoodInsecurityLayer] = useState(true);
  const [showAcledLayer, setShowAcledLayer] = useState(true);
  const [showCriticalOverlap, setShowCriticalOverlap] = useState(true);

  // Regional organization definitions (shared across components)
  const regionalOrganizations = {
    'UEMOA': {
      name: 'UEMOA',
      countries: ['Benin', 'Burkina Faso', 'Côte d\'Ivoire', 'Guinea-Bissau', 'Mali', 'Niger', 'Senegal', 'Togo'],
      color: '#FF6B35',
      description: 'West African Economic and Monetary Union'
    },
    'ECOWAS': {
      name: 'ECOWAS',
      countries: ['Benin', 'Burkina Faso', 'Cabo Verde', 'Côte d\'Ivoire', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Liberia', 'Mali', 'Niger', 'Nigeria', 'Senegal', 'Sierra Leone', 'Togo'],
      color: '#4CAF50',
      description: 'Economic Community of West African States'
    },
    'CILSS': {
      name: 'CILSS',
      countries: ['Benin', 'Burkina Faso', 'Cape Verde', 'Chad', 'Gambia', 'Guinea-Bissau', 'Mali', 'Mauritania', 'Niger', 'Senegal'],
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

  // Helper function to format date display
  const formatDateDisplay = (dateStr) => {
    // Better language detection - check multiple sources
    let language = 'en';
    
    // Try to get language from i18n first
    if (i18n && i18n.language) {
      language = i18n.language;
    } else if (window.location.pathname.includes('/fr') || 
        window.location.href.includes('/fr') || 
        document.documentElement.lang === 'fr') {
      language = 'fr';
    }
    
    // Alternative: Check if we can detect French from the translation system
    // Try translating a word that's different in French
    const testTranslation = t('map');
    if (testTranslation === 'Carte') {
      language = 'fr';
    }
    
    // Manual override for testing - uncomment the line below to force French
    // language = 'fr';
    
    console.log('i18n object:', i18n); // Debug log
    console.log('Test translation for "map":', testTranslation); // Debug log
    console.log('Language detected:', language, 'for date:', dateStr); // Debug log
    
    if (!dateStr) return '';
    
    // Handle PJune-2025 format (projection)
    if (dateStr.startsWith('P')) {
      const month = dateStr.substring(1, dateStr.indexOf('-'));
      const year = dateStr.substring(dateStr.indexOf('-') + 1);
      
      const monthMap = {
        en: {
          'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
          'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
          'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
        },
        fr: {
          'Jan': 'Janvier', 'Feb': 'Février', 'Mar': 'Mars', 'Apr': 'Avril',
          'May': 'Mai', 'Jun': 'Juin', 'Jul': 'Juillet', 'Aug': 'Août',
          'Sep': 'Septembre', 'Oct': 'Octobre', 'Nov': 'Novembre', 'Dec': 'Décembre'
        }
      };
      
      const fullMonth = monthMap[language]?.[month] || month;
      const projectionText = language === 'fr' ? t('projection') : t('projection');
      
      console.log('Projection format - Month:', month, 'Full month:', fullMonth, 'Language:', language); // Debug log
      return `${fullMonth} ${projectionText} ${year}`;
    }
    
    // Handle regular format like "March-2024"
    const parts = dateStr.split('-');
    if (parts.length === 2) {
      const month = parts[0];
      const year = parts[1];
      
      const monthMap = {
        en: {
          'January': 'January', 'February': 'February', 'March': 'March', 'April': 'April',
          'May': 'May', 'June': 'June', 'July': 'July', 'August': 'August',
          'September': 'September', 'October': 'October', 'November': 'November', 'December': 'December'
        },
        fr: {
          'January': 'Janvier', 'February': 'Février', 'March': 'Mars', 'April': 'Avril',
          'May': 'Mai', 'June': 'Juin', 'July': 'Juillet', 'August': 'Août',
          'September': 'Septembre', 'October': 'Octobre', 'November': 'Novembre', 'December': 'Décembre'
        }
      };
      
      const translatedMonth = monthMap[language]?.[month] || month;
      console.log('Regular format - Month:', month, 'Translated:', translatedMonth, 'Language:', language); // Debug log
      return `${translatedMonth} ${year}`;
    }
    
    // Fallback to original string if format is not recognized
    return dateStr;
  };

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
        
        // Simple approach: map PJune to June for sorting purposes
        const normalizedPeriods = periods.map(period => {
          if (period === 'PJune-2025') {
            return 'June-2025'; // Map PJune to June for sorting
          }
          return period;
        });
        
        normalizedPeriods.sort((p1, p2) => {
          // Parse dates for chronological sorting
          const parseDate = (dateStr) => {
            // Handle different date formats: "Mar2023", "Nov2023", "Jun2024", etc.
            const monthMap = {
              'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
              'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            };
            
            // Extract month and year
            const monthMatch = dateStr.match(/^([A-Za-z]{3})(\d{4})$/);
            if (monthMatch) {
              const month = monthMap[monthMatch[1]];
              const year = parseInt(monthMatch[2]);
              return new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
            }
            
            // Fallback to string comparison if parsing fails
            return new Date(dateStr);
          };
          
          const date1 = parseDate(p1);
          const date2 = parseDate(p2);
          
          return date1 - date2; // Chronological order (earliest first)
        });
        
        // Convert back to original format for PJune
        const sortedPeriods = normalizedPeriods.map(period => {
          if (period === 'June-2025') {
            return 'PJune-2025'; // Convert back to original format
          }
          return period;
        });
        
        setDateOptions(sortedPeriods);
        setCurrentDateIndex(periods.length - 1); // Set to the last available date
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
                <div>
                  {/* Map Controls */}
                  <div className="map-controls">
                    <div className="control-section">
                      <div className="modern-date-selector">
                        <div className="date-header">
                          <span className="date-label">{t("date")}</span>
                          <span className="current-date">{formatDateDisplay(dateOptions[currentDateIndex])}</span>
                        </div>
                        <div className="slider-container">
                          <div className="slider-track">
                            <div 
                              className="slider-fill" 
                              style={{ 
                                width: `${dateOptions.length > 1 ? (currentDateIndex / (dateOptions.length - 1)) * 100 : 0}%` 
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max={dateOptions.length - 1}
                              step="1"
                              value={currentDateIndex}
                              onChange={(e) => setCurrentDateIndex(parseInt(e.target.value))}
                              className="modern-slider"
                            />
                          </div>
                                                  <div className="slider-labels">
                          <span className="slider-min">{formatDateDisplay(dateOptions[0])}</span>
                          <span className="slider-max">{formatDateDisplay(dateOptions[dateOptions.length - 1])}</span>
                        </div>
                        </div>
                      </div>

                    </div>
                    <div className="control-section">
                      <div className="modern-layer-controls">
                        <div className="layer-control-item">
                          <label className="modern-checkbox">
                            <input
                              type="checkbox"
                              checked={showFoodInsecurityLayer}
                              onChange={(e) => setShowFoodInsecurityLayer(e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            <span className="layer-label">{t("showFoodInsecurityData") || "Show Food Insecurity Data"}</span>
                          </label>
                        </div>
                        <div className="layer-control-item">
                          <label className="modern-checkbox">
                            <input
                              type="checkbox"
                              checked={showAcledLayer}
                              onChange={(e) => setShowAcledLayer(e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            <span className="layer-label">{t("showConflictData") || "Show Conflict Data"}</span>
                          </label>
                        </div>
                        <div className="layer-control-item">
                          <label className="modern-checkbox">
                            <input
                              type="checkbox"
                              checked={showCriticalOverlap}
                              onChange={(e) => setShowCriticalOverlap(e.target.checked)}
                            />
                            <span className="checkmark"></span>
                            <span className="layer-label">{t("showCriticalOverlap") || "Show Critical Overlap"}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <MapView 
                    currentDateIndex={currentDateIndex}
                    setCurrentDateIndex={setCurrentDateIndex}
                    dateOptions={dateOptions}
                    showFoodInsecurityLayer={showFoodInsecurityLayer}
                    setShowFoodInsecurityLayer={setShowFoodInsecurityLayer}
                    showAcledLayer={showAcledLayer}
                    setShowAcledLayer={setShowAcledLayer}
                    showCriticalOverlap={showCriticalOverlap}
                    setShowCriticalOverlap={setShowCriticalOverlap}
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
              ) : (
                <div>
                  <RegionSelector
                    geojsonData={geojsonFeatures}
                    onSelect={setSelectedRegionData}
                  />

                  {/* Single Country Map View showing situation changes */}
                  {selectedRegionData.period1 && selectedRegionData.period2 && geojsonFeatures.length > 0 ? (
                    selectedRegionData.region.admin0 ? (
                      <div className="country-map-container" style={{ margin: '20px 0' }}>
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
