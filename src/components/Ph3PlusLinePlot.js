import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTranslationHook } from "../i18n";
import '../styles/Ph3PlusLinePlot.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Country flag colors - using colors that represent each country's flag
// Ensuring no two countries have the same colors
const countryColors = {
  'Nigeria': '#009E60', // Green from flag
  'Senegal': '#FCD116', // Yellow from flag
  'Burkina Faso': '#7F4E1E', // Equal mix of green and red from flag
  'Côte d\'Ivoire': '#F77F00', // Orange from flag
  'Mali': '#CE1126', // Red from flag
  'Niger': '#45B7D1', // Blue (different from yellow)
  'Chad': '#C60C30', // Red from flag
  'Mauritania': '#00A651', // Green from flag
  'Gambia': '#D21034', // Red from flag (different shade)
  'Guinea-Bissau': '#E70013', // Red from flag (different shade)
  'Guinea': '#FF6B6B', // Red from flag (different shade)
  'Sierra Leone': '#1EB53A', // Green from flag
  'Liberia': '#C41E3A', // Red from flag
  'Ghana': '#4ECDC4', // Teal (different from red)
  'Togo': '#0066CC', // Blue from flag
  'Benin': '#96CEB4', // Light green (different shade)
  'Cameroon': '#007A5E', // Green from flag
  'Central African Republic': '#FFCD00', // Yellow from flag
  'Congo': '#82E0AA', // Light green (different shade)
  'Democratic Republic of the Congo': '#007934', // Green from flag
  'Gabon': '#3C8D0D', // Green from flag
  'Equatorial Guinea': '#006C3A', // Green from flag
  'São Tomé and Príncipe': '#CC0000', // Red from flag
  'Angola': '#006838', // Green from flag
  'Zambia': '#F1948A', // Light red (different shade)
  'Malawi': '#009639', // Green from flag
  'Mozambique': '#D7BDE2', // Purple (different from red)
  'Zimbabwe': '#75C043', // Green from flag
  'Botswana': '#003580', // Blue from flag
  'Namibia': '#007A4D', // Green from flag
  'South Africa': '#F7DC6F', // Light yellow (different shade)
  'Eswatini': '#85C1E9', // Light blue (different shade)
  'Lesotho': '#FC3F1E', // Red from flag
  'Madagascar': '#BB8FCE', // Purple (different from red)
  'Comoros': '#F8C471', // Orange (different from red)
  'Seychelles': '#EA2839', // Red from flag
  'Mauritius': '#0055A4', // Blue from flag
  'Réunion': '#98D8C8', // Light blue (different shade)
  'Mayotte': '#6AB2E7', // Blue from flag
  'Djibouti': '#FFEAA7', // Light yellow (different from red)
  'Eritrea': '#009A49', // Green from flag
  'Ethiopia': '#43A047', // Green from flag
  'Somalia': '#000000', // Black from flag
  'Kenya': '#FFCD00', // Yellow from flag
  'Uganda': '#1EB53A', // Green from flag
  'Tanzania': '#00A1DE', // Blue from flag
  'Rwanda': '#DDA0DD', // Light purple (different from red)
  'Burundi': '#2C3E50', // Dark blue (different from black)
  'South Sudan': '#E74C3C', // Red (different shade)
  'Sudan': '#8E44AD', // Purple (different from red)
  'Egypt': '#34495E', // Dark gray (different from black)
  'Libya': '#E67E22', // Orange (different from red)
  'Tunisia': '#006233', // Green from flag
  'Algeria': '#C1272D', // Red from flag
  'Morocco': '#7F8C8D', // Gray (different from black)
  'Western Sahara': '#003F87', // Blue from flag
  'Cape Verde': '#3498DB', // Light blue (different shade)
  'Cabo Verde': '#3498DB', // Light blue (different shade)
};



// Fallback colors for countries not in the list
const fallbackColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

let fallbackColorIndex = 0;

const getCountryColor = (countryName) => {
  if (countryColors[countryName]) {
    return countryColors[countryName];
  }
  // Use fallback colors for countries not in our list
  const color = fallbackColors[fallbackColorIndex % fallbackColors.length];
  fallbackColorIndex++;
  return color;
};

const Ph3PlusLinePlot = ({ 
  geojsonData, 
  selectedCountries, 
  setSelectedCountries, 
  selectedRegions, 
  setSelectedRegions, 
  availableCountries, 
  regionalOrganizations 
}) => {
  const { t } = useTranslationHook("analysis");
  const [timePeriods, setTimePeriods] = useState([]);

  // Parse period key function (same as in MapView)
  const parsePeriodKey = (period) => {
    if (!period) return { year: NaN, monthIndex: -1, isPrediction: false };
    const [a, b] = period.split("-");
    let year, rawMonth;

    if (/^\d{4}$/.test(a)) {
      year = +a;
      rawMonth = b;
    } else if (/^\d{4}$/.test(b)) {
      year = +b;
      rawMonth = a;
    } else {
      return { year: NaN, monthIndex: -1, isPrediction: false };
    }

    let isPrediction = false;
    if (/^[Pp]/.test(rawMonth)) {
      isPrediction = true;
      rawMonth = rawMonth.slice(1);
    }

    if (/^\d{1,2}$/.test(rawMonth)) {
      const idx = Math.min(Math.max(+rawMonth - 1, 0), 11);
      return { year, monthIndex: idx, isPrediction };
    }

    const date = new Date(`${rawMonth} 1, ${year}`);
    const idx = date.getMonth();
    if (isNaN(idx)) {
      return { year: NaN, monthIndex: -1, isPrediction };
    }
    return { year, monthIndex: idx, isPrediction };
  };

  // Process data when geojsonData changes
  useEffect(() => {
    if (!geojsonData || geojsonData.length === 0) return;

    // Extract all time periods from the feature properties
    const periodsSet = new Set();

    geojsonData.forEach(feature => {
      // Extract all time periods from the feature properties
      Object.keys(feature.properties).forEach(key => {
        if (key.startsWith('population_ph3_')) {
          const period = key.replace('population_ph3_', '');
          periodsSet.add(period);
        }
      });
    });

    // Filter out June data points (monthIndex 5, which is June in 0-based indexing)
    const filteredPeriods = Array.from(periodsSet).filter(period => {
      const { monthIndex } = parsePeriodKey(period);
      return monthIndex !== 5; // Exclude June (monthIndex 5)
    });

    const periods = filteredPeriods.sort((p1, p2) => {
      const { year: y1, monthIndex: m1 } = parsePeriodKey(p1);
      const { year: y2, monthIndex: m2 } = parsePeriodKey(p2);
      if (y1 !== y2) return y1 - y2;
      return m1 - m2;
    });

    setTimePeriods(periods);
  }, [geojsonData]);

  // Process chart data
  const processedChartData = useMemo(() => {
    if (!geojsonData || !timePeriods.length || !selectedCountries.length) return null;

    // Aggregate data by country and period
    const countryData = {};

    selectedCountries.forEach(country => {
      countryData[country] = {};
      
      timePeriods.forEach(period => {
        let totalPopulation = 0;
        let ph3Population = 0;

        // Sum up all features for this country and period
        geojsonData.forEach(feature => {
          if (feature.properties.admin0Name === country) {
            const totalField = `population_total_${period}`;
            const ph3Field = `population_ph3_${period}`;
            
            const total = parseFloat(String(feature.properties[totalField] || '0').replace(/,/g, ''));
            const ph3 = parseFloat(String(feature.properties[ph3Field] || '0').replace(/,/g, ''));
            
            if (!isNaN(total)) totalPopulation += total;
            if (!isNaN(ph3)) ph3Population += ph3;
          }
        });

        // Check if all regions in this country have 'Non analysée' classification for this period
        const classificationField = `classification_${period}`;
        let allNotAnalyzed = true;
        
        geojsonData.forEach(feature => {
          if (feature.properties.admin0Name === country) {
            const classification = feature.properties[classificationField];
            if (classification && classification !== 'Non analysée') {
              allNotAnalyzed = false;
            }
          }
        });
        
        // Calculate percentage - only if we have valid data and not all regions are 'Non analysée'
        if (totalPopulation > 0 && ph3Population >= 0 && !allNotAnalyzed) {
          const percentage = (ph3Population / totalPopulation) * 100;
          countryData[country][period] = percentage;
        } else {
          // Set to null for missing data or when all regions are 'Non analysée'
          countryData[country][period] = null;
        }
      });
    });

    // Format periods for display
    const formattedPeriods = timePeriods.map(period => {
      const { year, monthIndex, isPrediction } = parsePeriodKey(period);
      if (isNaN(year) || monthIndex < 0) return period;
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[monthIndex];
      return isPrediction ? `P${monthName}-${year}` : `${monthName}-${year}`;
    });

    // Calculate average across ALL countries (not just selected) for each period
    const averageData = timePeriods.map(period => {
      const values = availableCountries.map(country => {
        // Get data for this country and period
        let totalPopulation = 0;
        let ph3Population = 0;
        
        geojsonData.forEach(feature => {
          if (feature.properties.admin0Name === country) {
            const totalField = `population_total_${period}`;
            const ph3Field = `population_ph3_${period}`;
            
            const total = parseFloat(String(feature.properties[totalField] || '0').replace(/,/g, ''));
            const ph3 = parseFloat(String(feature.properties[ph3Field] || '0').replace(/,/g, ''));
            
            if (!isNaN(total)) totalPopulation += total;
            if (!isNaN(ph3)) ph3Population += ph3;
          }
        });
        
        // Check if all regions in this country have 'Non analysée' classification for this period
        const classificationField = `classification_${period}`;
        let allNotAnalyzed = true;
        
        geojsonData.forEach(feature => {
          if (feature.properties.admin0Name === country) {
            const classification = feature.properties[classificationField];
            if (classification && classification !== 'Non analysée') {
              allNotAnalyzed = false;
            }
          }
        });
        
        // Calculate percentage for this country - only if we have valid data and not all regions are 'Non analysée'
        if (totalPopulation > 0 && ph3Population >= 0 && !allNotAnalyzed) {
          return (ph3Population / totalPopulation) * 100;
        } else {
          return null;
        }
      });
      
      const validValues = values.filter(v => v !== null && v !== undefined && v > 0);
      return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : null;
    });

    // Calculate regional averages for selected regions
    const regionalAverages = {};
    selectedRegions.forEach(regionKey => {
      const region = regionalOrganizations[regionKey];
      if (region) {
        regionalAverages[regionKey] = timePeriods.map(period => {
          const values = region.countries.map(country => {
            // Get data for this country and period
            let totalPopulation = 0;
            let ph3Population = 0;
            
            geojsonData.forEach(feature => {
              if (feature.properties.admin0Name === country) {
                const totalField = `population_total_${period}`;
                const ph3Field = `population_ph3_${period}`;
                
                const total = parseFloat(String(feature.properties[totalField] || '0').replace(/,/g, ''));
                const ph3 = parseFloat(String(feature.properties[ph3Field] || '0').replace(/,/g, ''));
                
                if (!isNaN(total)) totalPopulation += total;
                if (!isNaN(ph3)) ph3Population += ph3;
              }
            });
            
            // Check if all regions in this country have 'Non analysée' classification for this period
            const classificationField = `classification_${period}`;
            let allNotAnalyzed = true;
            
            geojsonData.forEach(feature => {
              if (feature.properties.admin0Name === country) {
                const classification = feature.properties[classificationField];
                if (classification && classification !== 'Non analysée') {
                  allNotAnalyzed = false;
                }
              }
            });
            
            // Calculate percentage for this country - only if we have valid data and not all regions are 'Non analysée'
            if (totalPopulation > 0 && ph3Population >= 0 && !allNotAnalyzed) {
              return (ph3Population / totalPopulation) * 100;
            } else {
              return null;
            }
          });
          
          const validValues = values.filter(v => v !== null && v !== undefined && v > 0);
          return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : null;
        });
      }
    });

    // Create datasets for Chart.js
    const datasets = selectedCountries.map(country => ({
      label: country,
      data: timePeriods.map(period => countryData[country][period]),
      borderColor: getCountryColor(country),
      backgroundColor: getCountryColor(country) + '20', // Add transparency
      borderWidth: 2,
      fill: false,
      tension: 0.4, // Smoother lines
      pointRadius: 3,
      pointHoverRadius: 6,
      spanGaps: false, // Don't connect points when data is missing
    }));

    // Add average line dataset
    datasets.push({
      label: t('chAverage') || 'CH Average',
      data: averageData,
      borderColor: '#666666',
      backgroundColor: '#66666620',
      borderWidth: 2,
      borderDash: [5, 5], // Dashed line
      fill: false,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 4,
      spanGaps: false, // Don't connect points when data is missing
    });

    // Add regional average datasets
    selectedRegions.forEach(regionKey => {
      const region = regionalOrganizations[regionKey];
      const regionData = regionalAverages[regionKey];
      if (region && regionData) {
        datasets.push({
          label: region.name,
          data: regionData,
          borderColor: region.color,
          backgroundColor: region.color + '20',
          borderWidth: 2,
          borderDash: [8, 4], // Dashed line
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 4,
          spanGaps: false, // Don't connect points when data is missing
        });
      }
    });

    return {
      labels: formattedPeriods,
      datasets: datasets
    };
  }, [geojsonData, timePeriods, selectedCountries, selectedRegions, availableCountries, t, regionalOrganizations]);

    // Calculate dynamic Y-axis max based on selected countries' data
  const calculateYAxisMax = () => {
    if (!processedChartData || !processedChartData.datasets) return 50;
    
    let maxValue = 0;
    processedChartData.datasets.forEach(dataset => {
      dataset.data.forEach(value => {
        if (value !== null && value !== undefined && value > maxValue) {
          maxValue = value;
        }
      });
    });
    
    // Round up to the nearest multiple of 10, with a minimum of 10
    const roundedMax = Math.max(10, Math.ceil(maxValue / 10) * 10);
    return roundedMax;
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Lato, sans-serif'
          },
          usePointStyle: true,
          padding: 20,
          filter: (legendItem, chartData) => {
            // Only show legend for countries that have data
            const dataset = chartData.datasets[legendItem.datasetIndex];
            return dataset.data.some(value => value !== null && value !== undefined && value > 0);
          }
        }
      },
      title: {
        display: true,
        text: t('ph3PlusProportionTitle') || 'Proportion of Population in Phase 3+ by Country',
        font: {
          family: 'Lato, sans-serif',
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const country = context.dataset.label;
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${country}: ${t('noData') || 'No data'}`;
            }
            return `${country}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('timePeriod') || 'Time Period',
          font: {
            family: 'Lato, sans-serif'
          }
        },
        ticks: {
          font: {
            family: 'Lato, sans-serif'
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: t('ph3PlusPercentage') || 'Population in Phase 3+ (%)',
          font: {
            family: 'Lato, sans-serif'
          }
        },
        ticks: {
          font: {
            family: 'Lato, sans-serif'
          }
        },
        beginAtZero: true,
        max: calculateYAxisMax()
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };



  const handleCountryToggle = (country) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      } else {
        return [...prev, country];
      }
    });
  };

  const handleRegionToggle = (regionKey) => {
    const region = regionalOrganizations[regionKey];
    if (!region) return;

    if (selectedRegions.includes(regionKey)) {
      // Unselect the region
      setSelectedRegions(prev => prev.filter(r => r !== regionKey));
      
      // Check which countries from this region are still selected in other regions
      const otherSelectedRegions = selectedRegions.filter(r => r !== regionKey);
      const countriesStillSelectedInOtherRegions = new Set();
      
      otherSelectedRegions.forEach(otherRegionKey => {
        const otherRegion = regionalOrganizations[otherRegionKey];
        if (otherRegion) {
          otherRegion.countries.forEach(country => {
            if (availableCountries.includes(country)) {
              countriesStillSelectedInOtherRegions.add(country);
            }
          });
        }
      });
      
      // Only remove countries that are not selected in any other region
      setSelectedCountries(prev => prev.filter(country => {
        // Keep countries that are not in this region
        if (!region.countries.includes(country)) {
          return true;
        }
        // Keep countries that are still selected in other regions
        if (countriesStillSelectedInOtherRegions.has(country)) {
          return true;
        }
        // Remove countries that are only in this region
        return false;
      }));
    } else {
      // Select the region
      setSelectedRegions(prev => [...prev, regionKey]);
      // Select all countries in this region (that are available)
      const regionCountries = region.countries.filter(country => availableCountries.includes(country));
      setSelectedCountries(prev => [...new Set([...prev, ...regionCountries])]);
    }
  };

  // Function to get flag filename for a country
  const getFlagFilename = (countryName) => {
    const flagMap = {
      'Nigeria': 'nigeria.svg',
      'Senegal': 'senegal.svg',
      'Burkina Faso': 'burkina-faso.svg',
      'Côte d\'Ivoire': 'côte-d\'ivoire.svg',
      'Mali': 'mali.svg',
      'Niger': 'niger.svg',
      'Chad': 'chad.svg',
      'Ghana': 'ghana.svg',
      'Guinea': 'guinea.svg',
      'Guinea-Bissau': 'guinea-bissau.svg',
      'Liberia': 'liberia.svg',
      'Sierra Leone': 'sierra-leone.svg',
      'Togo': 'togo.svg',
      'Benin': 'benin.svg',
      'Gambia': 'gambia.svg',
      'Cabo Verde': 'cabo-verde.svg',
      'Mauritania': 'mauritania.svg'
    };
    return flagMap[countryName] || null;
  };



  if (!geojsonData || geojsonData.length === 0) {
    return (
      <div className="ph3-plus-line-plot-container">
        <div className="loading-message">
          {t('loadingData') || 'Loading data...'}
        </div>
      </div>
    );
  }

  return (
    <div className="ph3-plus-line-plot-container">
      <div className="plot-header">
        <h3>{t('ph3PlusProportionTitle') || 'Proportion of Population in Phase 3+ by Country'}</h3>
      </div>

      <div className="controls-section">
        <div className="selectors-row">
          <div className="country-selector">
            <label>{t('selectCountries') || 'Select Countries:'}</label>
            <div className="country-checkboxes">
              {availableCountries.map(country => {
                const flagFilename = getFlagFilename(country);
                return (
                  <label key={country} className="country-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => handleCountryToggle(country)}
                    />
                    <span 
                      className="country-color-indicator"
                      style={{ backgroundColor: getCountryColor(country) }}
                    ></span>
                    <span className="country-name">{country}</span>
                    {flagFilename && (
                      <img 
                        src={`/flags/${flagFilename}`} 
                        alt={`${country} flag`}
                        className="country-flag"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="region-selector">
            <label>{t('selectRegions') || 'Select Regional Averages:'}</label>
            <div className="region-checkboxes">
              {Object.keys(regionalOrganizations).map(regionKey => {
                const region = regionalOrganizations[regionKey];
                return (
                  <label key={regionKey} className="region-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(regionKey)}
                      onChange={() => handleRegionToggle(regionKey)}
                    />
                    <span 
                      className="region-color-indicator"
                      style={{ backgroundColor: region.color }}
                    ></span>
                    <span className="region-name">{region.name}</span>
                    <img 
                      src={`/flags/logo-${regionKey.toLowerCase()}.png`} 
                      alt={`${region.name} logo`}
                      className="region-logo"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        {processedChartData ? (
          <Line data={processedChartData} options={chartOptions} />
        ) : (
          <div className="no-data-message">
            {t('noDataAvailable') || 'No data available for the selected countries.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ph3PlusLinePlot;
