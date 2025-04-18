import React, { useState } from "react";
import { useTranslationHook } from "../i18n";
import logoHeader from "../assets/img/logo_header.svg";
import { BASE_URL } from "../components/constant.js";
import MenuListComposition from "../components/DropdownMenu.js";
import "../styles/main.min.css";
import "../styles/Header.css";

const Header = () => {
  const lines = Array.from({ length: 16 }, (_, index) => (
    <VerticalLine key={index} color="#aaaaaa" height="135px" margin="7.5px" />
  ));

  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  return (
    <header id="mainheader">
      <div
        className="head container-fluid"
        style={{
          background: "rgb(244 223 204 / 64%) 0% 0% no-repeat padding-box",
        }}
      >
        <div className="row align-items-center">
          <div id="verticalLine" className="col-sm-3 links">
            {lines}
          </div>
          <div className="col-sm-6 brand">
            <h1>
              <a href={BASE_URL} title="The Food Crisis Prevention Network">
                <img
                  src={logoHeader}
                  className="logo"
                  alt="The Food Crisis Prevention Network"
                />
              </a>
            </h1>
          </div>

          <div className="col-sm-3 lang">
            <ul className="nav nav-lang justify-content-end">
              <li className="nav-item">
                <button
                  href="#"
                  className={`nav-link ${selectedLanguage === 'fr' ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange("fr")}
                >
                  FR
                </button>
              </li>
              <li className="nav-item">|</li>
              <li className="nav-item">
                <button
                  className={`nav-link ${selectedLanguage === 'en' ? 'selected' : ''}`}
                  onClick={() => handleLanguageChange("en")}
                >
                  EN
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarNav"
        >
          <ul className="navbar-nav">
            <li>
              <a href={`${BASE_URL}/`}>
                <MenuListComposition
                  firstLevel={t("Home")}
                  secondLevel={GenerateSecondLevel(t("Home"))}
                  icon={`${process.env.PUBLIC_URL}/images/home.png`} // Correct path to home icon
                />
              </a>
            </li>
            <li>
              <a href={`${BASE_URL}/analysis-and-response`}>
                <MenuListComposition
                  firstLevel={t("Analysis")}
                  secondLevel={GenerateSecondLevel(t("Analysis"))}
                  icon={`${process.env.PUBLIC_URL}/images/analysis.png`} // Update with correct path if needed
                />
              </a>
            </li>
            <li>
              <a href={`${BASE_URL}/resources`}>
                <MenuListComposition
                  firstLevel={t("Resources")}
                  secondLevel={GenerateSecondLevel(t("Resources"))}
                  icon={`${process.env.PUBLIC_URL}/images/resources.png`} // Update with correct path if needed
                />
              </a>
            </li>
            <li>
              <a href={`${BASE_URL}/topics`}>
                <MenuListComposition
                  firstLevel={t("Topics")}
                  secondLevel={GenerateSecondLevel(t("Topics"))}
                  icon={`${process.env.PUBLIC_URL}/images/topics.png`} // Update with correct path if needed
                />
              </a>
            </li>
            <li>
              <a href={`${BASE_URL}/event-and-opportunities`}>
                <MenuListComposition
                  firstLevel={t("Agenda")}
                  secondLevel={GenerateSecondLevel(t("Agenda"))}
                  icon={`${process.env.PUBLIC_URL}/images/agenda.png`} // Update with correct path if needed
                />
              </a>
            </li>
            <li>
              <a href={`${BASE_URL}/about`}>
                <MenuListComposition
                  firstLevel={t("About")}
                  secondLevel={GenerateSecondLevel(t("About"))}
                  icon={`${process.env.PUBLIC_URL}/images/about.png`} // Update with correct path if needed
                />
              </a>
            </li>
          </ul>
          <div className="actions-sm">
            <div className="row">
              <div className="col-6">
                <ul className="list-inline"></ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};



export const SocialMedia = () => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <div
      id="mainheader"
      style={{ position: "relative", marginBottom: "0px", zIndex: "0" }}
    >
      <p
        style={{
          font: "normal normal 900 20px/25px Lato",
          textTransform: "uppercase",
          color: "#243D54",
        }}
      >
        {t("Social")}
      </p>
      <div className="col-sm-3 links" style={{ marginLeft: "-42px" }}>
        <ul className="socials-top list-inline d-flex">
          <li className="socials list-inline-item">
            <a
              href="http://www.x.com/rpca_network"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="fa fa-twitter" aria-hidden="true"></i>
            </a>
          </li>
          <li className="socials list-inline-item">
            <a
              href="https://www.youtube.com/channel/UCMlracQCKihkybLscgfwBDA"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="fa fa-youtube" aria-hidden="true"></i>
            </a>
          </li>
          <li className="socials list-inline-item">
            <a
              href="https://www.flickr.com/photos/95035905@N02/albums/with/72157679917259303"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="fa fa-flickr" aria-hidden="true"></i>
            </a>
          </li>
          <li className="socials list-inline-item">
            <a
              href="https://my.sendinblue.com/users/subscribe/js_id/3vfpq/id/1"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="fa fa-envelope" aria-hidden="true"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export const VerticalLine = ({ height, color, margin }) => {
  const verticalLineStyle = {
    borderLeft: `1.4px solid ${color || "#aaaaaa"}`,
    height: height || "135px",
    marginLeft: margin || "7.5px",
  };

  return <div style={verticalLineStyle}></div>;
};

export const GenerateSecondLevel = (firstLevel) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  switch (firstLevel) {
    case t("Maps"):
      return [
        { text: t("Info"), href: `${BASE_URL}/analysis-and-response/analysis` },
        {
          text: t("Response"),
          href: `${BASE_URL}/analysis-and-response/response`,
        },
        {
          text: t("Toolkit"),
          href: `${BASE_URL}/analysis-and-response/toolkit`,
        },
      ];
    case t("Resources"):
      return [
        { text: t("Documents"), href: `${BASE_URL}/resources/documents` },
        { text: t("Multimedia"), href: `${BASE_URL}/resources/multimedia` },
        { text: t("Archive"), href: `${BASE_URL}/resources/archive` },
      ];
    case t("Agenda"):
      return [
        { text: t("Events"), href: `${BASE_URL}/event-and-opportunities/event` },
        {
          text: t("Opportunities"),
          href: `${BASE_URL}/event-and-opportunities/opportunities`,
        },
      ];
    case t("About"):
      return [
        { text: t("Intro"), href: `${BASE_URL}/about/who-are-we` },
        { text: t("History"), href: `${BASE_URL}/about/history` },
        { text: t("PREGEC"), href: `${BASE_URL}/about/the-pregec-charter` },
        { text: t("Members"), href: `${BASE_URL}/about/members` },
        // { text: t("Remarks"), href: `${BASE_URL}/about/remarks` },
      ];
    case t("Home"):
      return [];
    case t("Topics"):
      return [];

    default:
      return [];
  }
};

export default Header;
