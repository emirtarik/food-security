import React, { useEffect, useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../styles/Table.css";

export function formatNumber(number) {
  if (number === null) {
    return "0"; // Return '0' as a string or 0 if you prefer a number
  }

  return number.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function calculatePercentage(value, total) {
  const percentage = (value / total) * 100;
  return percentage.toFixed(2); // Displaying percentage with two decimal places
}

export function calculateColumnSum(columnName, rowData) {
  const columnValues = rowData.map((row) =>
    parseFloat(row[columnName].replace(/,/g, ""))
  );
  const total = columnValues.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  return total;
}

export function formatFeature(
  feature,
  {
    selectedYear,
    selectedMonth,
    startTimeYear,
    startTimeMonth,
    endTimeYear,
    endTimeMonth,
    displayCompare,
  }
) {
  const getMonthStr = (month) => (month === 11 ? "11" : `0${month}`);

  function monthStr(month) {
    return getMonthStr(month);
  }

  const getPhaseValue = (property, year, month) => {
    const value = feature.properties[`${property}-${year}-${month}`];
    return isNaN(value) || value === null ? "/" : formatNumber(value);
  };

  const calculateChange = (
    property,
    startTimeYear,
    startTimeMonth,
    endTimeYear,
    endTimeMonth
  ) => {
    const startValue =
      feature.properties[`${property}-${startTimeYear}-${startTimeMonth}`];
    const endValue =
      feature.properties[`${property}-${endTimeYear}-${endTimeMonth}`];

    const value = endValue - startValue;

    return formatNumber(value);
  };

  const populationData =
    feature.properties[`POP-${selectedYear}-${monthStr(selectedMonth)}`];

  if (populationData === undefined) {
    return {
      Country: feature.properties["Country"],
      Level1: feature.properties["Name_1"] === 0 ? "" : feature.properties["Name_1"],
      Level2: feature.properties["Name_2"] === 0 ? "" : feature.properties["Name_2"],
      Population: "Data not available",
      "Phase 1": "Data not available",
      "Phase 2": "Data not available",
      "Phase 3": "Data not available",
      "Phase 4": "Data not available",
      "Phase 5": "Data not available",
      "Phase 3-5": "Data not available",
      "%": "Data not available",
    };
  }

  let formattedData;

  if (displayCompare === "single") {
    formattedData = {
      Country: getNameByLevel(feature, 0),
      Level1: getNameByLevel(feature, 1) === 0 ? "" : getNameByLevel(feature, 1),
      Level2: getNameByLevel(feature, 2) === 0 ? "" : getNameByLevel(feature, 2),
      Population: getPhaseValue("POP", selectedYear, monthStr(selectedMonth)),
      "Phase 1": getPhaseValue("PH1", selectedYear, monthStr(selectedMonth)),
      "Phase 2": getPhaseValue("PH2", selectedYear, monthStr(selectedMonth)),
      "Phase 3": getPhaseValue("PH3", selectedYear, monthStr(selectedMonth)),
      "Phase 4": getPhaseValue("PH4", selectedYear, monthStr(selectedMonth)),
      "Phase 5": getPhaseValue("PH5", selectedYear, monthStr(selectedMonth)),
      "Phase 3-5": getPhaseValue("PH3:5", selectedYear, monthStr(selectedMonth)),
      "%": calculatePercentage(feature.properties[`PH3:5-${selectedYear}-${monthStr(selectedMonth)}`], populationData),
      "CH": getPhaseValue("CLAS", selectedYear, monthStr(selectedMonth)),
      Key: feature.properties.Key,
    };
  } else if (displayCompare === "compare") {
    formattedData = {
      Country: getNameByLevel(feature, 0),
      Level1: getNameByLevel(feature, 1) === 0 ? "" : getNameByLevel(feature, 1),
      Level2: getNameByLevel(feature, 2) === 0 ? "" : getNameByLevel(feature, 2),
      Population: calculateChange("POP", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 1": calculateChange("PH1", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 2": calculateChange("PH2", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 3": calculateChange("PH3", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 4": calculateChange("PH4", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 5": calculateChange("PH5", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "Phase 3-5": calculateChange("PH3:5", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      "%": calculatePercentage(
        feature.properties[`PH3:5-${endTimeYear}-${monthStr(endTimeMonth)}`], feature.properties[`POP-${endTimeYear}-${monthStr(endTimeMonth)}`])
         - calculatePercentage(
        feature.properties[`PH3:5-${startTimeYear}-${monthStr(startTimeMonth)}`], feature.properties[`POP-${startTimeYear}-${monthStr(startTimeMonth)}`]),
      "CH": -1*calculateChange("CLAS", startTimeYear, monthStr(startTimeMonth), endTimeYear, monthStr(endTimeMonth)),
      Key: feature.properties.Key,
    };
  }

  return formattedData;
}

export function getNameByLevel(feature, level = 0) {
  const propNames = ["Country", "Name_1", "Name_2"];
  const propName = propNames[level];
  const name = feature.properties[propName];
  if (level > 0 && name === feature.properties[propNames[level - 1]]) {
    return "";
  } else {
    return name;
  }
}

export const Table = ({
  countryData,
  level1Data,
  level2Data,
  selectedYear,
  selectedMonth,
  startTimeYear,
  startTimeMonth,
  endTimeYear,
  endTimeMonth,
  displayCompare,
}) => {
  const [columnDefs, setColumnDefs] = useState([
    {
      field: "Country",
      rowgroup: true,
      hide: false,
      headerClass: "custom-header",
      cellClass: "custom-cell-bold",
      width: 100,
    },
    {
      field: "Level1",
      rowgroup: true,
      hide: false,
      headerClass: "custom-header",
      width: 100,
    },
    {
      field: "Level2",
      rowgroup: true,
      hide: false,
      headerClass: "custom-header",
      width: 100,
    },
    { field: "Population", headerClass: "custom-header", width: 120 },
    { field: "CH", headerClass: "custom-header", width: 100 },
    { field: "Phase 1", headerClass: "custom-header1", width: 90 },
    { field: "Phase 2", headerClass: "custom-header2", width: 90 },
    { field: "Phase 3", headerClass: "custom-header3", width: 90 },
    { field: "Phase 4", headerClass: "custom-header4", width: 90 },
    { field: "Phase 5", headerClass: "custom-header5", width: 90 },
    { field: "Phase 3-5", headerClass: "custom-header5", width: 100 },
    { field: "%", headerClass: "custom-header5", width: 60 },
  ]);
  const getRowId = (params) => params.data.Key;
  ///

  const [tableData, setTableData] = useState([]);
  const [expandedCountry, setExpandedCountry] = useState(null);
  const handleExpandButtonClick = (country) => {
    if (expandedCountry === country) {
      setExpandedCountry(null);
    } else {
      setExpandedCountry(country);
    }
  };
  ///
  useEffect(() => {
    if (!countryData || !countryData.features) {
      return; // Render nothing while data is being fetched
    }

    const rowData = countryData.features
      .map((feature) =>
        formatFeature(feature, {
          selectedYear,
          selectedMonth,
          startTimeYear,
          startTimeMonth,
          endTimeYear,
          endTimeMonth,
          displayCompare,
        })
      )
      .filter((row) => row.Population !== "Data not available");
    {/*console.log(rowData, "rowdata")*/};

    const totalRow = {
      Country: "Total",
      Population: formatNumber(calculateColumnSum("Population", rowData)),
      "Phase 1": formatNumber(calculateColumnSum("Phase 1", rowData)),
      "Phase 2": formatNumber(calculateColumnSum("Phase 2", rowData)),
      "Phase 3": formatNumber(calculateColumnSum("Phase 3", rowData)),
      "Phase 4": formatNumber(calculateColumnSum("Phase 4", rowData)),
      "Phase 5": formatNumber(calculateColumnSum("Phase 5", rowData)),
      "Phase 3-5": formatNumber(calculateColumnSum("Phase 3-5", rowData)),
      "%": calculatePercentage(
        calculateColumnSum("Phase 3-5", rowData),
        calculateColumnSum("Population", rowData)
      ),

      rowClass: "total-row",
    };
    {/*console.log(rowData, "rowdata after totalrow")*/};
    {/*console.log("totalRow", totalRow)*/};
    const allRows = [...rowData, totalRow];

    setTableData(allRows); // Update tableData with new data
  }, [
    countryData,
    level1Data,
    level2Data,
    selectedYear,
    selectedMonth,
    startTimeYear,
    startTimeMonth,
    endTimeYear,
    endTimeMonth,
    displayCompare,
  ]);

  function rowClick(clickEvent) {
    // llamar cuando se pique el boton o el nombre
    const clickedRowData = clickEvent.data;
    const api = clickEvent.api;
    const rowLevel = clickedRowData.level || 0;
    const columnsToCheck = ["Country", "Level1"];

    if (rowLevel === 2) {
      return;
    }
    // expand
    const columnToCheck = columnsToCheck[rowLevel];
    const cellValue = clickedRowData[columnToCheck];
    const dataLevel1 = level1Data.features
    .map((feature) =>
      formatFeature(feature, {
        selectedYear,
        selectedMonth,
        startTimeYear,
        startTimeMonth,
        endTimeYear,
        endTimeMonth,
        displayCompare,
      })
    )
    .filter((row) => row.Population !== "Data not available");
    const dataLevel2 = level2Data.features
    .map((feature) =>
      formatFeature(feature, {
        selectedYear,
        selectedMonth,
        startTimeYear,
        startTimeMonth,
        endTimeYear,
        endTimeMonth,
        displayCompare,
      })
    )
    .filter((row) => row.Population !== "Data not available");
    const data = dataLevel1.concat(dataLevel2);
    {/*console.log(data, "data")*/};
    const filteredRows = data.filter(
      (feature) => feature[columnToCheck] === cellValue
    );
    if (clickedRowData.expanded) {
      clickedRowData.expanded = false;
      api.applyTransaction({
        remove: filteredRows.map((row) => ({ Key: row.Key })),
      });
    } else {
      clickedRowData.expanded = true;
      api.applyTransaction({
        add: filteredRows.map((childFeature) => ({
          ...childFeature,
          excludeFromTotals: true,
          level: rowLevel + 1,
          expanded: false,
        })),
        addIndex: clickEvent.rowIndex + 1,
      });
    }
  }

  const groupDisplayType = "groupRows";
  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
    };
  }, []);
  const gridOptions = {
    onGridReady: (params) => {
      const api = params.api; // Get the grid API reference
      api.sizeColumnsToFit(); // Adjust columns to fit the grid's width
    },
  };

  return (
    <div>
      <div className="grid-wrapper">
        <div className="ag-theme-alpine">
          <AgGridReact
            rowData={tableData}
            groupDisplayType={groupDisplayType}
            columnDefs={columnDefs}
            onRowClicked={rowClick}
            getRowId={getRowId}
            gridOptions={gridOptions}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>
    </div>
  );
};

export default Table;