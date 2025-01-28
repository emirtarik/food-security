// src/components/PerformanceTable.js

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/PerformanceTable.css'; 
import { calculateStage, getColorByScore } from './SummaryGraphs'; // Ensure these functions are correctly implemented
import performanceData from '../data/performanceData.json'; // Import the JSON data
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTable } from 'react-table';

function PerformanceTable({ 
  country, 
  performanceScore, 
  financingNeed, 
  financingMobilized 
}) {
  console.log('PerformanceTable Props:', { country, performanceScore, financingNeed, financingMobilized });

  // Extract data for the selected country
  const countryData = performanceData[country];
  console.log('Country Data:', countryData);

  // Extract years, metrics, and annualChanges or set to empty arrays if countryData is missing
  const years = countryData ? countryData.years : [];
  const metrics = countryData ? countryData.metrics : {};
  const annualChanges = countryData ? countryData.annualChanges : {};

  const performanceTrend = performanceScore !== undefined ? `${performanceScore - 75}%` : '-';
  const financingTrend = financingNeed !== undefined ? `${financingNeed - 180}` : '-';
  const financingMTrend = financingMobilized !== undefined ? `${financingMobilized - 75}%` : '-';
  

  // Define the metrics to display in the data table
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

  // Define the columns for the data table using useMemo
  const dataTableColumns = useMemo(() => [
    {
      Header: 'Données du Cadre Harmonisé (avril)', // Renamed from 'Métriques'
      accessor: 'metric' // accessor is the "key" in the data
    },
    // Dynamically create a column for each year
    ...years.map(year => ({
      Header: year.toString(),
      accessor: year.toString()
    }))
  ], [years]);

  // Prepare data for the data table using useMemo
  const dataTableData = useMemo(() => {
    return tableMetrics.map(metric => {
      const metricValues = metrics[metric] || [];
      const row = { metric };
      years.forEach((year, idx) => {
        row[year] = metricValues[idx] !== undefined ? metricValues[idx] : '-';
      });
      return row;
    });
  }, [tableMetrics, metrics, years]);

  // Define the columns for the annual changes table using useMemo
  const annualChangesColumns = useMemo(() => [
    {
      Header: 'Indicateurs', // Renamed from 'Métriques'
      accessor: 'metric'
    },
    // Dynamically create a column for each year
    ...years.map(year => ({
      Header: year.toString(),
      accessor: year.toString()
    }))
  ], [years]);

  // Define the annual changes data using useMemo
  const annualChangesData = useMemo(() => {
    const changeMetrics = [
      "Evolution du système d'information (Score CH)",
      "Evolution personnes en phase CH 3-5",
      "Evoluation personnes en phase CH 3-5 (%)",
      "Evolution du nombre de zones en phase CH 3-5",
      "Evolution du nombre de zones en phase CH 3-5 (%)",
      "Evolution du besoin de financement couvert",
      "Gap de financement"
    ];

    return changeMetrics.map(metric => {
      const metricValues = annualChanges[metric] || [];
      const row = { metric };
      years.forEach((year, idx) => {
        row[year] = metricValues[idx] !== undefined ? metricValues[idx] : '-';
      });
      return row;
    });
  }, [annualChanges, years]);

  // Use react-table for the data table
  const {
    getTableProps: getDataTableProps,
    getTableBodyProps: getDataTableBodyProps,
    headerGroups: dataTableHeaderGroups,
    rows: dataTableRows,
    prepareRow: prepareDataTableRow,
  } = useTable({ columns: dataTableColumns, data: dataTableData });

  // Use react-table for the annual changes table
  const {
    getTableProps: getChangesTableProps,
    getTableBodyProps: getChangesTableBodyProps,
    headerGroups: changesTableHeaderGroups,
    rows: changesTableRows,
    prepareRow: prepareChangesTableRow,
  } = useTable({ columns: annualChangesColumns, data: annualChangesData });

  // If countryData is missing, display a message but still render the tables with empty data
  if (!countryData) {
    return (
      <div className="performance-container">
        <div className="performance-data-table">
          <h3>Données du Cadre Harmonisé (avril)</h3>
          <p>No data available for {country}.</p>
        </div>
        <div className="annual-changes-table">
          <h3>Indicateurs</h3>
          <p>No annual changes data available.</p>
        </div>
        <div className="performance-table">
          <p>No performance metrics available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-container">
      {/* Existing Performance Metrics Table */}
      <div className="performance-table">
        <div className="performance-header">
          Performance (vs. 2020)
        </div>

        {/* Performance Score Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/info-system.png" alt="info system icon" className="performance-icon" />
            # et évolution du système d'information (Score CH)
            <Tooltip title="Score CH indicates the performance of the information system." arrow placement="top">
              <HelpOutlineIcon className="question-tooltip-icon" tabIndex="0" aria-label="Information about Score CH" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">{performanceScore !== undefined ? `${performanceScore}%` : '-'}</div>
            <div className="performance-trend">{performanceTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: getColorByScore(performanceScore || 0) }}>
            {calculateStage(performanceScore / 20 || 0).label}
          </div>
        </div>

        {/* Financing Need Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/funding-gap.png" alt="funding gap icon" className="performance-icon" />
            Besoin de financement (million USD)
            <Tooltip title="Total financing need in million USD over the analysis period." arrow placement="top">
              <HelpOutlineIcon className="question-tooltip-icon" tabIndex="0" aria-label="Information about Financing Need" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">{financingNeed !== undefined ? financingNeed : '-'}</div>
            <div className="performance-trend">{financingTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: '#cccccc' }}>
            {/* Financing Need might not have a stage; adjust if necessary */}
            N/A
          </div>
        </div>

        {/* Financing Mobilized Row */}
        <div className="performance-row">
          <div className="performance-title">
            <img src="/images/finance-mobilized.png" alt="finance mobilized icon" className="performance-icon" />
            Financement mobilisé (%)
            <Tooltip title="Percentage of financing mobilized over the analysis period." arrow placement="top">
              <HelpOutlineIcon className="question-tooltip-icon" tabIndex="0" aria-label="Information about Financing Mobilized" />
            </Tooltip>
          </div>
          <div className="performance-data">
            <div className="performance-score">{financingMobilized !== undefined ? `${financingMobilized}%` : '-'}</div>
            <div className="performance-trend">{financingMTrend}</div>
          </div>
          <div className="performance-stage" style={{ backgroundColor: getColorByScore(financingMobilized || 0) }}>
            {calculateStage(financingMobilized || 0).label}
          </div>
        </div>
      </div>

      {/* Performance Data Table */}
      <div className="performance-data-table">
        <h3>Données du Cadre Harmonisé (avril)</h3> {/* Renamed Header */}
        <table {...getDataTableProps()}>
          <thead>
            {dataTableHeaderGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} key={column.id}>
                    {column.render('Header')}
                  </th>
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
                    <td {...cell.getCellProps()} key={cell.column.id}>
                      {cell.value}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Annual Changes Table */}
      <div className="annual-changes-table">
        <h3>Indicateurs</h3> {/* Renamed Header */}
        <table {...getChangesTableProps()}>
          <thead>
            {changesTableHeaderGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} key={column.id}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getChangesTableBodyProps()}>
            {changesTableRows.map(row => {
              prepareChangesTableRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id}>
                  {row.cells.map(cell => (
                    <td 
                      {...cell.getCellProps()} 
                      key={cell.column.id}
                      className={
                        // Apply conditional formatting for percentage metrics
                        row.original.metric.includes('(%') || row.original.metric.includes('Gap de financement')
                          ? 'percentage-cell'
                          : ''
                      }
                    >
                      {cell.value}
                    </td>
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
