import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header.js";
import Footer from "../Footer.js";
import SearchBox from "../../components/SearchBox.js";
import SubHeader from "../SubHeader.js";
import SearchBoxDocument from "../../components/SearchBoxDocument.js";
import { BASE_URL, ASSETS_BASE_URL } from "../../components/constant.js";
import { useTranslationHook } from "../../i18n";
import "../../styles/Document.css";

//import documentData from "../../data/DocumentsRPCA.json";

const DOCUMENTS_JSON_URL =
  process.env.REACT_APP_DOCUMENTS_JSON_URL ||
 `${ASSETS_BASE_URL}/data/DocumentsRPCA.json`; // fallback

 const isAbs = (s) => typeof s === "string" && (/^https?:\/\//i.test(s) || /^data:/i.test(s));
 
 const normalizePath = (raw) => {
   if (!raw) return "";
   if (typeof raw === "string") return raw;
   if (typeof raw === "object") {
     return raw.medium || raw.url || raw.src || raw.path || "";
   }
   return "";
 };
 
 const resolveAsset = (raw) => {
   const p = normalizePath(raw);
   if (!p) return "";
   if (isAbs(p)) return p;
   if (p.startsWith("/uploads") || p.startsWith("/images") || p.startsWith("/data")) {
     return `${ASSETS_BASE_URL}${p}`;
   }
   return `${BASE_URL}${p}`;
 };
  
const DocumentsSection = ({
  documents,
  searchQuery,
  selectedLocations,
  selectedThemes,
  selectedScales,
  selectedLangs,
  maxDocuments,
}) => {
  const { t } = useTranslationHook(["misc"]);
  const MAX_EXCERPT_LENGTH = 100;
  const navigate = useNavigate();

  const convertedDocs = documents.map((item, index) => {
    const content = item.content || {}; // Ensure content is an object

    return {
      id: index + 1,
      title: item.title,
      img: { medium: item.img },
      pj: item.pj,
      excerpt: item.excerpt || "",
      datecontent: item.datecontent,
      permalink: item.permalink,
      countries: content.Countries || "",
      themes: content.Themes || "",
      scales: content.Scale || "",
      langs: content.Langs || "",
      description: content.Description || "", // Ensure description is included
      bllink: item.bllink, // Include the bllink property
    };
  });

  const filteredDocuments = convertedDocs
    .filter((result) => {
      const titleMatches =
        !searchQuery ||
        searchQuery.trim() === "" ||
        result.title.toLowerCase().includes(searchQuery.toLowerCase());

      const locationsMatch =
        !selectedLocations ||
        selectedLocations.length === 0 ||
        (result.countries || "")
          .split(",")
          .map((location) => location.trim())
          .some((selectedLocation) =>
            selectedLocations.includes(selectedLocation)
          );
      const themesMatch =
        !selectedThemes ||
        selectedThemes.length === 0 ||
        (result.themes || "")
          .split(",")
          .map((theme) => theme.trim())
          .some((selectedtheme) => selectedThemes.includes(selectedtheme));

      const scalesMatch =
        !selectedScales ||
        selectedScales.length === 0 ||
        (result.scales || "")
          .split(",")
          .map((scale) => scale.trim())
          .some((selectedScale) => selectedScales.includes(selectedScale));

      const langsMatch =
        !selectedLangs ||
        selectedLangs.length === 0 ||
        (result.langs || "")
          .split(",")
          .map((lang) => lang.trim())
          .some((selectedLang) => selectedLangs.includes(selectedLang));

      return (
        titleMatches &&
        locationsMatch &&
        themesMatch &&
        scalesMatch &&
        langsMatch
      );
    })
    .slice(0, maxDocuments);

  const handleDocumentClick = (document, e) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    navigate(document.bllink, { state: { document } });
  };

  return (
    <section className="doc-results container pb-5">
      <header className="block-header">
        <h2 className="block-title">{t("Documents")}</h2>
        <a
          href={`/resources/documents`}
          className="btn bt-primaryinv btsmall"
        >
          {t("alldoc")}
        </a>
      </header>

      <div className="row">
        {filteredDocuments.map((result) => (
          <div
            key={result.id}
            className="col-sm-6 col-md-4 col-lg-5ths"
            onClick={(e) => handleDocumentClick(result, e)}
            style={{ cursor: "pointer" }}
          >
            <article>
              <div className="thumb">
              <img
                //src={`${ASSETS_BASE_URL}${result.img.medium}`}
                //alt={result.title}
                src={resolveAsset(result.img?.medium ?? result.img)}
                alt={result.title}
                onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.src = `${ASSETS_BASE_URL}/images/doc-placeholder.png`;
                } }
              />

                <div className="screen">
                  <p>
                    {result.excerpt.length > MAX_EXCERPT_LENGTH
                      ? result.excerpt.slice(0, MAX_EXCERPT_LENGTH) + "..."
                      : result.excerpt}
                  </p>
                  <a
                    onClick={(e) => handleDocumentClick(result, e)}
                    className="btn btn-white-inv mt-3"
                  >
                    {t("more")}
                  </a>
                </div>
              </div>

              <div className="content">
                <date>{result.datecontent}</date>
                <p className="title">{result.title}</p>
              </div>

              <a
                onClick={(e) => handleDocumentClick(result, e)}
                className="bllink"
              >
                {t("more")}
              </a>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
};

export { DocumentsSection };

export default function Documents() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedScales, setSelectedScales] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

   
  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(DOCUMENTS_JSON_URL, {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch documents (${res.status})`);
        }
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading documents JSON:", err);
        setError("Could not load documents metadata.");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);


  function updateURL() {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", searchQuery);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  }

  useEffect(() => {
    updateURL();
  }, [searchQuery]);

  return (
    <div>
      <Header />
      <SubHeader />
      <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="row">
        <div className="col-md-2 col-xl-2">
          <SearchBoxDocument
            //jsonData={documentData}
            jsonData={documents}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            selectedThemes={selectedThemes}
            setSelectedThemes={setSelectedThemes}
            selectedScales={selectedScales}
            setSelectedScales={setSelectedScales}
            selectedLangs={selectedLangs}
            setSelectedLangs={setSelectedLangs}
          />
        </div>
        <div className="col-md-10 col-xl-10">
         {loading && <p>Loading documents…</p>}
         {error && !loading && (
           <p style={{ color: "red", fontSize: 12 }}>{error}</p>
          )}
          <DocumentsSection
            //documents={documentData}
            documents={documents}
            searchQuery={searchQuery}
            selectedLocations={selectedLocations}
            selectedThemes={selectedThemes}
            selectedScales={selectedScales}
            selectedLangs={selectedLangs}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
