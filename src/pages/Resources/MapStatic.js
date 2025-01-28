import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header.js";
import Footer from "../Footer.js";
import SearchBox from "../../components/SearchBox.js";
import SubHeader from "../SubHeader.js";
import mapsData from "../../data/MapsRPCA.json";
import { BASE_URL } from "../../components/constant.js";
import { useTranslationHook } from "../../i18n";


const MapsSection = ({ documents, searchQuery, maxDocuments }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook(['misc']);
  const MAX_EXCERPT_LENGTH = 200;
  const convertedDocs = documents.map((item, index) => {
    return {
      id: index + 1,
      title: item.title,
      img: { medium: item.img },
      pj: null,
      excerpt: item.Description || "",
      datecontent: item.datecontent,
      permalink: item.map,
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
        <h2 className="block-title">{t("StaticMaps")}</h2>
        <a
          href={`${BASE_URL}/resources/maps`}
          className="btn bt-primaryinv btsmall"
        >
          {t("allmap")}
        </a>
      </header>

      <div className="row">
        {filteredDocuments.map((result) => (
          <div key={result.id} className="col-md-4">
            <article>
              <div className="thumb" style={{paddingBottom: "300px"}}>
                <img src={`${BASE_URL}${result.img.medium}`} alt={result.title} />
                <div className="screen">
                  {result.map ? (
                    <a
                      href={result.map}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-white mt-3"
                    >
                      {t("download")}
                    </a>
                  ) : (
                    <p>
                      {result.excerpt.length > MAX_EXCERPT_LENGTH
                        ? result.excerpt.slice(0, MAX_EXCERPT_LENGTH) + "..."
                        : result.excerpt}
                    </p>
                  )}
                  <a
                    href={`${BASE_URL}${result.permalink}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-white-inv mt-3"
                  >
                    {t("more")}
                  </a>
                </div>
              </div>

              <div className="content">
                <date>{result.datecontent}</date>
                <a href={`${BASE_URL}${result.permalink}`} className="title">
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

export { MapsSection };

export default function Maps() {
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
      <MapsSection documents={mapsData} searchQuery={searchQuery} />
      <Footer />
    </div>
  );
}
