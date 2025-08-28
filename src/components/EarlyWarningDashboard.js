import React, { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useTranslationHook } from '../i18n';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EarlyWarningDashboard = ({ geojsonData, selectedCountries, selectedRegions, regionalOrganizations }) => {
  const { t } = useTranslationHook("analysis");

  // Process dashboard data
  const dashboardData = useMemo(() => {
    if (!geojsonData || selectedCountries.length === 0) {
      return null;
    }

    // Get the latest period
    const periods = new Set();
    geojsonData.forEach(feature => {
      Object.keys(feature.properties).forEach(key => {
        if (key.startsWith('classification_')) {
          periods.add(key.replace('classification_', ''));
        }
      });
    });
    const latestPeriod = Array.from(periods).sort().pop();

    if (!latestPeriod) return null;

    // Calculate metrics for selected countries
    const countryMetrics = [];
    const riskLevels = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalPopulation = 0;
    let totalPh3Plus = 0;
    let totalPh4Plus = 0;

    selectedCountries.forEach(countryName => {
      let countryPop = 0;
      let countryPh3Plus = 0;
      let countryPh4Plus = 0;
      let worstPhase = 1;

      geojsonData.forEach(feature => {
        if (feature.properties.admin0Name === countryName) {
          const popTotal = parseFloat(String(feature.properties[`population_total_${latestPeriod}`] || '0').replace(/,/g, ''));
          const popPh3 = parseFloat(String(feature.properties[`population_ph3_${latestPeriod}`] || '0').replace(/,/g, ''));
          const popPh4 = parseFloat(String(feature.properties[`population_ph4_${latestPeriod}`] || '0').replace(/,/g, ''));
          const classification = feature.properties[`classification_${latestPeriod}`];

          if (!isNaN(popTotal) && popTotal > 0) {
            countryPop += popTotal;
            countryPh3Plus += popPh3 || 0;
            countryPh4Plus += popPh4 || 0;

            // Extract phase number for worst phase calculation
            if (classification) {
              const phaseMatch = classification.match(/Phase\s+(\d+)/);
              if (phaseMatch) {
                worstPhase = Math.max(worstPhase, parseInt(phaseMatch[1]));
              }
            }
          }
        }
      });

      if (countryPop > 0) {
        const ph3PlusPercent = (countryPh3Plus / countryPop) * 100;
        const ph4PlusPercent = (countryPh4Plus / countryPop) * 100;

        // Determine risk level based on Phase 3+ percentage
        let riskLevel = 'low';
        if (ph3PlusPercent >= 30) riskLevel = 'critical';
        else if (ph3PlusPercent >= 20) riskLevel = 'high';
        else if (ph3PlusPercent >= 10) riskLevel = 'medium';

        riskLevels[riskLevel]++;

        countryMetrics.push({
          country: countryName,
          population: countryPop,
          ph3PlusPercent,
          ph4PlusPercent,
          worstPhase,
          riskLevel
        });

        totalPopulation += countryPop;
        totalPh3Plus += countryPh3Plus;
        totalPh4Plus += countryPh4Plus;
      }
    });

    return {
      latestPeriod,
      countryMetrics,
      riskLevels,
      totalPopulation,
      totalPh3Plus,
      totalPh4Plus,
      overallPh3PlusPercent: totalPopulation > 0 ? (totalPh3Plus / totalPopulation) * 100 : 0,
      overallPh4PlusPercent: totalPopulation > 0 ? (totalPh4Plus / totalPopulation) * 100 : 0
    };
  }, [geojsonData, selectedCountries]);

  // Chart configurations
  const riskDistributionChart = useMemo(() => {
    if (!dashboardData) return null;

    return {
      labels: [
        t('lowRisk') || 'Low Risk',
        t('mediumRisk') || 'Medium Risk',
        t('highRisk') || 'High Risk',
        t('criticalRisk') || 'Critical Risk'
      ],
      datasets: [{
        data: [
          dashboardData.riskLevels.low,
          dashboardData.riskLevels.medium,
          dashboardData.riskLevels.high,
          dashboardData.riskLevels.critical
        ],
        backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }, [dashboardData, t]);

  const countryComparisonChart = useMemo(() => {
    if (!dashboardData) return null;

    const sortedCountries = [...dashboardData.countryMetrics]
      .sort((a, b) => b.ph3PlusPercent - a.ph3PlusPercent)
      .slice(0, 8); // Show top 8 countries

    return {
      labels: sortedCountries.map(c => c.country),
      datasets: [
        {
          label: t('ph3PlusPercentage') || 'Phase 3+ %',
          data: sortedCountries.map(c => c.ph3PlusPercent),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: t('ph4PlusPercentage') || 'Phase 4+ %',
          data: sortedCountries.map(c => c.ph4PlusPercent),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [dashboardData, t]);

  const alertsData = useMemo(() => {
    if (!dashboardData) return [];

    const alerts = [];
    
    dashboardData.countryMetrics.forEach(country => {
      if (country.ph3PlusPercent >= 30) {
        alerts.push({
          level: 'critical',
          country: country.country,
          message: t('criticalAlertMsg') || `Critical: ${country.ph3PlusPercent.toFixed(1)}% in Phase 3+`
        });
      } else if (country.ph3PlusPercent >= 20) {
        alerts.push({
          level: 'high',
          country: country.country,
          message: t('highAlertMsg') || `High Risk: ${country.ph3PlusPercent.toFixed(1)}% in Phase 3+`
        });
      } else if (country.worstPhase >= 4) {
        alerts.push({
          level: 'medium',
          country: country.country,
          message: t('phaseAlertMsg') || `Phase ${country.worstPhase} detected in regions`
        });
      }
    });

    return alerts.sort((a, b) => {
      const levels = { critical: 3, high: 2, medium: 1 };
      return levels[b.level] - levels[a.level];
    });
  }, [dashboardData, t]);

  if (!dashboardData) {
    return (
      <div className="early-warning-dashboard">
        <div className="plot-header">
          <h3>{t('earlyWarningTitle') || 'Early Warning System Dashboard'}</h3>
        </div>
        <div className="no-data-message">
          {t('selectCountriesForDashboard') || 'Please select countries to view the early warning dashboard.'}
        </div>
      </div>
    );
  }

  return (
    <div className="early-warning-dashboard">
      <div className="plot-header">
        <h3>{t('earlyWarningTitle') || 'Early Warning System Dashboard'}</h3>
      </div>

      {/* Key Metrics Summary */}
      <div className="metrics-summary">
        <div className="metric-card">
          <div className="metric-value">{dashboardData.countryMetrics.length}</div>
          <div className="metric-label">{t('countriesMonitored') || 'Countries Monitored'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{(dashboardData.totalPopulation / 1000000).toFixed(1)}M</div>
          <div className="metric-label">{t('totalPopulation') || 'Total Population'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{dashboardData.overallPh3PlusPercent.toFixed(1)}%</div>
          <div className="metric-label">{t('overallPh3Plus') || 'Overall Phase 3+'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{dashboardData.overallPh4PlusPercent.toFixed(1)}%</div>
          <div className="metric-label">{t('overallPh4Plus') || 'Overall Phase 4+'}</div>
        </div>
      </div>

      {/* Dashboard Panels */}
      <div className="dashboard-panels">
        {/* Alert Panel */}
        <div className="dashboard-panel alert-panel">
          <h4>{t('activeAlerts') || 'Active Alerts'}</h4>
          <div className="alerts-list">
            {alertsData.length > 0 ? (
              alertsData.slice(0, 5).map((alert, index) => (
                <div key={index} className={`alert-item ${alert.level}`}>
                  <div className="alert-country">{alert.country}</div>
                  <div className="alert-message">{alert.message}</div>
                </div>
              ))
            ) : (
              <div className="no-alerts">{t('noActiveAlerts') || 'No active alerts'}</div>
            )}
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="dashboard-panel chart-panel">
          <h4>{t('riskDistribution') || 'Risk Distribution'}</h4>
          <div className="chart-container-small">
            <Doughnut 
              data={riskDistributionChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { family: 'Lato, sans-serif', size: 11 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Country Comparison Chart */}
        <div className="dashboard-panel chart-panel-wide">
          <h4>{t('countryComparison') || 'Country Comparison (Phase 3+ & 4+)'}</h4>
          <div className="chart-container-medium">
            <Bar 
              data={countryComparisonChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: { family: 'Lato, sans-serif', size: 11 }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 50,
                    ticks: {
                      font: { family: 'Lato, sans-serif', size: 10 }
                    }
                  },
                  x: {
                    ticks: {
                      font: { family: 'Lato, sans-serif', size: 10 },
                      maxRotation: 45
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Status Overview */}
        <div className="dashboard-panel status-panel">
          <h4>{t('statusOverview') || 'Status Overview'}</h4>
          <div className="status-list">
            {dashboardData.countryMetrics
              .sort((a, b) => b.ph3PlusPercent - a.ph3PlusPercent)
              .slice(0, 6)
              .map((country, index) => (
                <div key={index} className="status-item">
                  <div className="status-country">{country.country}</div>
                  <div className="status-metrics">
                    <span className={`status-badge ${country.riskLevel}`}>
                      {country.ph3PlusPercent.toFixed(1)}% Ph3+
                    </span>
                    <span className="status-phase">Phase {country.worstPhase}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <small>{t('lastUpdated') || 'Last Updated'}: {dashboardData.latestPeriod}</small>
      </div>
    </div>
  );
};

export default EarlyWarningDashboard;
