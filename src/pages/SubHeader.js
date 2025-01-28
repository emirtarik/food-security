import React from "react";
import { useTranslationHook } from "../i18n";
import { useLocation } from "react-router-dom";
import { BASE_URL } from "../components/constant.js";
import IconBreadcrumbsWrapper from "../components/IconBreadcrumbs";
import "../styles/SubHeader.css";

export default function SubHeader() {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  const originalLocation = useLocation();
  const location = originalLocation.pathname.replace(/-/g, " & ");
  const parts = location.split("/");
  let lastPart = "";
  let secondToLastPart = "";
  let routeTitle = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]) {
      lastPart = parts[i];
      if (i > 0 && parts[i - 1]) {
        secondToLastPart = parts[i - 1];
      }
      break;
    }
  }

  let menuItems = null;

  if (secondToLastPart === "resources" || lastPart === "resources") {
    // If the second-to-last part is 'resources', show resource-related links
    routeTitle = "Resources";
    menuItems = (
      <>
        <a className="nav-link" href={`${BASE_URL}/resources/documents`}>
          {t("Documents")}
        </a>
        {/*<a className="nav-link" href={`${BASE_URL}/resources/maps`}>
          {t("StaticMaps")}
    </a>*/}
        <a className="nav-link" href={`${BASE_URL}/resources/multimedia`}>
          {t("Multimedia")}
        </a>
      </>
    );
  } else if (secondToLastPart === "about" || lastPart === "about") {
    routeTitle = "About";
    menuItems = (
      <>
        <a className="nav-link" href={`${BASE_URL}/about/who-are-we`}>
          {t("Intro")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/about/history`}>
          {t("History")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/about/the-pregec-charter`}>
          {t("PREGEC")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/about/members`}>
          {t("Members")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/about/remarks`}>
          {t("Remarks")}
        </a>
      </>
    );
  } else if (
    secondToLastPart === "analysis & and & response" ||
    lastPart === "analysis & and & response" ||
    secondToLastPart === "analysis" ||
    lastPart === "analysis" ||
    secondToLastPart === "response" ||
    lastPart === "response"

  ) {
    // If the second-to-last part is 'analysis', show analysis-related links
    routeTitle = "Analysis and Response";
    menuItems = (
      <>
        <a
          className="nav-link"
          href={`${BASE_URL}/analysis-and-response/analysis`}
        >
          {t("Info")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/analysis-and-response/response`}>
          {t("Response")}
        </a>
        <a className="nav-link" href={`${BASE_URL}/analysis-and-response/toolkit`}>
          {t("Toolkit")}
        </a>
      </>
    );
  } else if (
    secondToLastPart === "set & of & instruments" ||
    lastPart === "set & of & instruments" ||
    secondToLastPart === "c & gov & san" ||
    lastPart === "c & gov & san"
  ) {
    // If the second-to-last part is 'analysis', show analysis-related links
    routeTitle = "Toolkit";
    menuItems = (
      <>
        <a
          className="nav-link"
          href={`${BASE_URL}/analysis-and-response/toolkit/set-of-instruments`}
        >
          {t("SetofInstrument")}
        </a>
        <a
          className="nav-link"
          href={`${BASE_URL}/analysis-and-response/toolkit/c-gov-san`}
        >
          {t("CGovSAN")}
        </a>
      </>
    );
  } else if (
    secondToLastPart === "event & and & opportunities" ||
    lastPart === "event & and & opportunities"  ) {
    routeTitle = "Events and Opportunities";
    menuItems = (
      <>
        <a
          className="nav-link"
          href={`${BASE_URL}/event-and-opportunities/event`}
        >
          {t("Events")}
        </a>
        <a
          className="nav-link"
          href={`${BASE_URL}/event-and-opportunities/opportunities`}
        >
          {t("Opportunities")}
        </a>
      </>
    );
  }

  let Title = null;
  switch (routeTitle) {
    case "Resources":
      Title = t("Resources");
      break;
    case "About":
      Title = t("About");
      break;
    case "Analysis and Response":
      Title = t("Analysis");
      break;
    case "Toolkit":
      Title = t("Toolkit");
      break;
    case "Events and Opportunities":
      Title = t("Agenda");
      break;
  }

  let Last = null;
switch (lastPart) {
  case "documents":
    Last = t("Documents");
    break;
  case "multimedia":
    Last = t("Multimedia");
    break;
  case "who-are-we":
    Last = t("Intro");
    break;
  case "history":
    Last = t("History");
    break;
  case "the-pregec-charter":
    Last = t("PREGEC");
    break;
  case "members":
    Last = t("Members");
    break;
  case "remarks":
    Last = t("Remarks");
    break;
  case "analysis":
    Last = t("Info");
    break;
  case "response":
    Last = t("Response");
    break;
  case "toolkit":
    Last = t("Toolkit");
    break;
  case "set-of-instruments":
    Last = t("SetofInstrument");
    break;
  case "c-gov-san":
    Last = t("CGovSAN");
    break;
  case "event":
    Last = t("Events");
    break;
  case "opportunities":
    Last = t("Opportunities");
    break;
  default:
    // Handle default case here if necessary
    break;
}
  
  const path = originalLocation.pathname;
  const { IntroElement, DescriptionElement } = InfoHeader(path);

  return (
    <section>
      <IconBreadcrumbsWrapper routeTitle={Title} lastPart={Last} />
      <section id="rubheader" className="container-fluid">
        <div className="row">
          <div className="col-md-12" style={{ color: "#243d54" }}>
            {IntroElement}
            {DescriptionElement}
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 col-lg-3 title-row">
            <p
              style={{
                fontSize: "1.2rem",
                marginBottom: "0px",
                color: "#243d54",
                font: "normal normal 900 24px/34px Lato",
              }}
            >
              {Title} :
            </p>
          </div>
          <div className="col-md-8 col-lg-9">
            <nav
              className="nav"
              style={{
                paddingTop: "16.5px",
                paddingLeft: "0px",
                color: "#243d54",
              }}
            >
              {menuItems}
            </nav>
          </div>
        </div>
      </section>
      <div></div>
    </section>
  );
}

export const InfoHeader = (path) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  let Intro = "";
  let Description = "";

  if (path.indexOf("/toolkit") !== -1) {
    Intro = t("Toolkit");
    Description = t("Toolkitd");
  } else if (path.indexOf("/analysis") !== -1) {
    Intro = t("Analysis");
    Description = t("ExploreCH");
  } else if (path.indexOf("/response") !== -1) {
    Intro = t("Response");
    Description = t("Response");
  } else if (path.indexOf("/analysis-and-response") !== -1) {
    Intro = t("Analysis");
    Description = t("ExploreCH");
  } else if (path.indexOf("/documents") !== -1) {
    Intro = t("Documents");
    Description = t("Documents");
  } else if (path.indexOf("/maps") !== -1) {
    Intro = "Map";
    Description = "Map";
  } else if (path.indexOf("/multimedia") !== -1) {
    Intro = t("Multimedia");
    Description = t("Multimedia");
  } else if (path.indexOf("/resources") !== -1) {
    Intro = t("Resources");
    Description = t("Resources");
  } else if (path.indexOf("/topics") !== -1) {
    Intro = t("Topics");
    Description = t("Topicsd");
  } else if (path.indexOf("/event-and-opportunities") !== -1) {
    Intro = t("Agenda");
    Description = t("Events");
  } else if (path.indexOf("/about") !== -1) {
    Intro = t("About");
    Description = t("Aboutd");
  } else {
    Intro = "Bienvenue";
    Description = "Réseau de prévention des crises alimentaires";
  }

  return {
    IntroElement: <h1 className="rubheader-intro">{Intro.toUpperCase()}</h1>,
    DescriptionElement: (
      <h3 className="rubheader-description">{Description}</h3>
    ),
  };
};
