import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header.js";
import Footer from "../Footer.js";
import SearchBox from "../../components/SearchBox.js";
import videoData from "../../data/VideosRPCA.json";
import SubHeader from "../SubHeader.js";
import { BASE_URL } from "../../components/constant.js";
import { useTranslationHook } from "../../i18n";

const VideosSection = ({ documents, searchQuery, maxDocuments }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook(['misc']);
  const convertedDocs = documents.map((item, index) => {
    return {
      id: index + 1,
      title: item.title,
      excerpt: item.excerpt || "",
      embedurl: item.embedurl,
      permalink: item.permalink,
    };
  });
  const filteredDocuments = convertedDocs
    .filter((result) => {
      if (!searchQuery || searchQuery.trim() === "") {
        return true; // Include all documents
      }
      // Check if the document's title includes the search query
      return result.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, maxDocuments);

  return (
    <section className="doc-results container pb-5">
      <header className="block-header">
        <h2 className="block-title">{t("Multimedia")}</h2>
        <a
          href={`${BASE_URL}/resources/multimedia`}
          className="btn bt-primaryinv btsmall"
        >
          {t("allvideo")}
        </a>
      </header>

      <div className="row">
        {filteredDocuments.map((result) => (
          <div key={result.id} className="col-md-4">
            <article>
              <div className="thumb">
                <div className="embed-responsive embed-responsive-16by9">
                  <iframe src={result.embedurl}></iframe>
                </div>
              </div>
              <div className="content">
                <a href={result.embedurl} className="title">
                  {result.title}
                </a>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
};

export { VideosSection };

export default function Videos() {
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
      <VideosSection documents={videoData} searchQuery={searchQuery} />
      <Footer />
    </div>
  );
}
