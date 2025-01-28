import React from "react";
import { useTranslationHook } from "../i18n";
import picPlaceholder from "../assets/picture-placeholder.png";

const DataBlock = ({
  project,
  location,
  partners,
  detail,
  status,
  img,
  budget,
  startDate,
  endDate,
  viewMode,
}) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <div className="col-md-4">
      <article
        className={
          viewMode === "grid"
            ? "doc-results article"
            : "doc-results mode-ul article"
        }
        style={
          viewMode === "list"
            ? { boxShadow: "0 0 30px 0 rgba(0,0,0,.17)" }
            : null
        }
      >
        <div className="thumb">
          <img src={img || picPlaceholder} alt={project} />
          {status ? (
            <div className={`status ${status ? status.toLowerCase() : ""}`}>
              {status}
            </div>
          ) : null}
        </div>
        <div className="content">
          <h4 className="title">{project}</h4>
          {location ? (
            <div className="loc">
              <i className="fa fa-map-marker"></i> {location}
            </div>
          ) : null}
          {partners ? (
            <div className="partners">{t("Partner")}: {partners}</div>
          ) : null}
          {viewMode === "list" && budget ? (
            <div className="partners">{t("Budget")}: {budget}</div>
          ) : null}
          {viewMode === "list" && startDate ? (
            <div className="partners">
              {t("Duration")}: {startDate} - {endDate}
            </div>
          ) : null}
        </div>
        {/* TEMPORARILY DISABLE MORE BUTTON UNTIL THE DETAIL PAGE IS READY */}
        {/* <div className="btnmore text-center">
          <a
            href={detail}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bt-primaryinv"
            title={project}
          >
            More
          </a>
          </div>*/}
      </article>
    </div>
  );
};

export default DataBlock;
