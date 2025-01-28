import React, { useState } from "react";
import DataBlock from "./DataBlock";
import { BASE_URL } from "./constant";
import { useTranslationHook } from "../i18n";

const DataBlocksList = ({ filteredDataBlock }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  const [viewMode, setViewMode] = useState("grid"); // Add view mode state

  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  const exportToCSV = () => {
    const header = Object.keys(filteredDataBlock[0]).join(","); // Get the keys of the first entry as headers
    const dataRows = filteredDataBlock.map((entry) =>
      Object.values(entry).join(",")
    ); // Convert each entry to a CSV row

    const csvContent = `data:text/csv;charset=utf-8,${header}\n${dataRows.join(
      "\n"
    )}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      id="projects-list"
      className="container doc-results projects-results"
    >
      <div className="col-sm-6 text-left">
        <button
          className="btn btn-white"
          onClick={() => toggleViewMode("grid")}
        >
          <i className="fa fa-th filter filter-grid" id="modeGrid"></i>
        </button>
        <button
          className="btn btn-white"
          onClick={() => toggleViewMode("list")}
        >
          <i className="fa fa-list-ul filter filter-list" id="modeList"></i>
        </button>
        <button className="btn btn-white" onClick={exportToCSV}>
          <i className="fa fa-download" aria-hidden="true">
            {" "}
            {t("Export")} {ProjectCounter(filteredDataBlock)} {t("to CSV")}
          </i>
        </button>
      </div>
      <div
        className={
          viewMode === "grid"
            ? "container doc-results projects-results"
            : "container doc-results projects-results mode-ul"
        }
        style={
          viewMode === "grid" ? { display: "flex", flexWrap: "wrap" } : null
        }
      >
        {filteredDataBlock.map((entry, index) => (
          <DataBlock
            key={index}
            project={entry.Project}
            location={entry.Location}
            partners={entry.Partners}
            detail={entry.Detail}
            status={entry.Status}
            img={entry.Img ? `${BASE_URL}${entry.Img}` : null}
            budget={entry.Budget}
            startDate={entry.StartDate}
            endDate={entry.EndDate}
            viewMode={viewMode}
          />
        ))}
      </div>
    </section>
  );
};

export const ProjectCounter = (data) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  if (data.length === 0) {
    return t("noProject");
  } else if (data.length === 1) {
    return t("oneProject");
  } else {
    return `${data.length} ${t("projects")}`;
  }
};

export default DataBlocksList;
