import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SubHeader from "./SubHeader";
import SearchBox from "../components/SearchBox";
import { DocumentsSection } from "./Resources/Documents.js";
import { MapsSection } from "./Resources/MapStatic.js";
import { VideosSection } from "./Resources/Videos.js";
import documentData from "../data/DocumentsRPCA.json";
import videoData from "../data/VideosRPCA.json";
import { BASE_URL } from "../components/constant.js";

export { DocumentsSection, MapsSection, VideosSection };

export default function Resources() {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  function updateURL() {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", searchQuery);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  }

  useEffect(() => {
    // Call the updateURL function whenever searchQuery changes
    updateURL();
  }, [searchQuery]);

  return (
    <div>
      <Header />
      <SubHeader />
      <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <DocumentsSection
        documents={documentData}
        searchQuery={searchQuery}
        maxDocuments={5}
      />
      {/*<MapsSection
        documents={mapsData}
        searchQuery={searchQuery}
        maxDocuments={6}
  />*/}
      <VideosSection
        documents={videoData}
        searchQuery={searchQuery}
        maxDocuments={3}
      />
      <Footer />
    </div>
  );
}

export function updateURL(location, navigate, searchQuery) {
  const searchParams = new URLSearchParams(location.search);
  searchParams.set("search", searchQuery);
  navigate(`${location.pathname}?${searchParams.toString()}`);
}
