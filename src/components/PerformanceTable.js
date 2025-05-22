import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/PerformanceTable.css';
import { calculateStage, getColorByScore } from './SummaryGraphs';
import performanceData from '../data/performanceData.json';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTable } from 'react-table';

function PerformanceTable({ 
  country, 
  performanceScore, 
  financingNeed, 
  financingMobilized 
}) {
  // Get data for selected country
  const countryData = performanceData[country] || {};
  const years = countryData.years || [];
  const metrics = countryData.metrics || {};

  // Find index of 2021 in years
  const idx2021 = years.indexOf(2021);

  // Helper to safely read a metric value for 2021
  const getBaseline = (key) => {
    const arr = metrics[key] || [];
    return idx2021 >= 0 && arr[idx2021] != null ? Number(arr[idx2021]) : null;
  };

  // Baseline values from JSON for 2021
  const basePerformance = getBaseline("Performance du système d'information (Score CH)");
  const baseFinancingNeed = getBaseline("Besoin de financement (million USD)");
  const baseFinancingMobilized = getBaseline("Financement mobilisé (%)");

  // Compute trends by comparing current props to 2021 baselines
  const performanceTrend = basePerformance != null && performanceScore != null
    ? `${(performanceScore - basePerformance).toFixed(1)}%`
    : '-';
  const financingTrend = baseFinancingNeed != null && financingNeed != null
    ? `${(financingNeed - baseFinancingNeed).toFixed(1)}`
    : '-';
  const financingMTrend = baseFinancingMobilized != null && financingMobilized != null
    ? `${(financingMobilized - baseFinancingMobilized).toFixed(1)}%`
    : '-';

  // Table metrics definitions
  const tableMetrics = useMemo(() => [
    "Performance du système d'information (Score CH)",
    "Population analysée (million)",
    "Nombre de personnes en phase CH 3-5 (million)",
    "Proportion de personnes analysées en phase CH 3-5 (%)",
    "Nombre de zones analysées",
    "Nombre de zones en phase CH 3-5",
    "Besoin de financement (million USD)",
    "Financement mobilisé (%)"
  ], []);

  // Columns for data table
  const dataTableColumns = useMemo(() => [
    { Header: 'Données du Cadre Harmonisé (avril)', accessor: 'metric' },
    ...years.map(year => ({ Header: year.toString(), accessor: year.toString() }))
  ], [years]);

  // Data rows for data table
  const dataTableData = useMemo(() => {
    return tableMetrics.map(metric => {
      const values = metrics[metric] || [];
      const row = { metric };
      years.forEach((year, i) => {
        row[year] = values[i] != null ? values[i] : '-';
      });
      return row;
    });
  }, [tableMetrics, metrics, years]);

  // Tables via react-table
  const {
    getTableProps: getDataTableProps,
    getTableBodyProps: getDataTableBodyProps,
    headerGroups: dataTableHeaderGroups,
    rows: dataTableRows,
    prepareRow: prepareDataTableRow,
  } = useTable({ columns: dataTableColumns, data: dataTableData });

  if (!countryData.years) {
    return <p>No data available for {country}.</p>;
  }

  return (
    <div className="performance-container">
      <div className="performance-table">
        <div className="performance-header">Performance (vs. 2021)</div>

        {/* Performance Score Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/info-system.png" alt="info system icon" className="performance-icon" />
            # et évolution du système d'information (Score CH)
            <Tooltip title="Score CH indicates the performance of the information system." arrow>
              <HelpOutlineIcon className="question-tooltip-icon" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">
              {performanceScore != null ? `${performanceScore}%` : '-'}
            </div>
            <div className="performance-trend">{performanceTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: getColorByScore(performanceScore || 0) }}>
            {calculateStage((performanceScore || 0) / 20).label}
          </div>
        </div>

        {/* Financing Need Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/funding-gap.png" alt="funding gap icon" className="performance-icon" />
            Besoin de financement (million USD)
            <Tooltip title="Total financing need in million USD over the analysis period." arrow>
              <HelpOutlineIcon className="question-tooltip-icon" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">{financingNeed != null ? financingNeed : '-'}</div>
            <div className="performance-trend">{financingTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: '#cccccc' }}>N/A</div>
        </div>

        {/* Financing Mobilized Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/finance-mobilized.png" alt="finance mobilized icon" className="performance-icon" />
            Financement mobilisé (%)
            <Tooltip title="Percentage of financing mobilized over the analysis period." arrow>
              <HelpOutlineIcon className="question-tooltip-icon" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">
              {financingMobilized != null ? `${financingMobilized}%` : '-'}
            </div>
            <div className="performance-trend">{financingMTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: getColorByScore(financingMobilized || 0) }}>
            {calculateStage((financingMobilized || 0) / 20).label}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="performance-data-table">
        <h3>Données du Cadre Harmonisé (avril)</h3>
        <table {...getDataTableProps()}>
          <thead>
            {dataTableHeaderGroups.map(group => (
              <tr {...group.getHeaderGroupProps()} key={group.id}>
                {group.headers.map(col => (
                  <th {...col.getHeaderProps()} key={col.id}>{col.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getDataTableBodyProps()}>
            {dataTableRows.map(row => {
              prepareDataTableRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} key={cell.column.id}>{cell.value}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

PerformanceTable.propTypes = {
  country: PropTypes.string.isRequired,
  performanceScore: PropTypes.number,
  financingNeed: PropTypes.number,
  financingMobilized: PropTypes.number,
};

PerformanceTable.defaultProps = {
  performanceScore: 0,
  financingNeed: 0,
  financingMobilized: 0,
};

export default PerformanceTable;
