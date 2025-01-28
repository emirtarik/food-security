import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import Header from "./Header";
import SubHeader from "./SubHeader";
import Footer from "./Footer";
import opportunityData from "../data/opportunityData.json";
import { useTranslationHook } from "../i18n";
import { InfoHeader } from "./SubHeader";
import "../styles/Events.css";
import { Events } from "./Events";

export default function EventsSection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  function updateURL() {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", searchQuery);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  }

  useEffect(() => {
    // Call the updateURL function whenever searchQuery changes
    updateURL();
  }, [searchQuery]);

  const path = useLocation().pathname;
  const { IntroElement, DescriptionElement } = InfoHeader(path);

  // Check if opportunity data is available and defined
  const isDataAvailable = opportunityData && opportunityData.length > 0;

  return (
    <div>
      <Header />
      <SubHeader />
      <SearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        style={{ marginTop: "100px" }}
      />
      {isDataAvailable ? (
        <Events
          data={opportunityData}
          searchQuery={searchQuery}
          showICalendarLink={false}
          showMoreLink={true}
        />
      ) : (
        <div className="no-opportunities-message">
          {t("No Opportunities")}
        </div>
      )}
      <Footer />
    </div>
  );
}
