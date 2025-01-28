import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../components/constant.js";
import Header from "../Header.js";
import Footer from "../Footer.js";
import { useTranslationHook } from "../../i18n";
import documentData from "../../data/DocumentsRPCA.json"; // Import the document data
import "../../styles/Document.css";

const SimpleSubHeader = () => {
  const { t } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  return (
    <div className="row">
      <div className="col-md-12" style={{ color: "#243d54" }}>
        <button onClick={() => navigate(-1)} className="btn btn-link" style={{ padding: "10px", marginTop: "3px" }}>
          &larr; {t("Back to documents")}
        </button>
      </div>
    </div>
  );
};

const DocumentDetail = () => {
  const { t } = useTranslationHook(["misc"]);
  const { bllink } = useParams(); // Get the bllink from the URL parameters
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);

  useEffect(() => {
    // Find the document with the matching bllink
    const foundDocument = documentData.find(doc => doc.bllink === `/documents/${bllink}`);
    setDocument(foundDocument);
  }, [bllink]);

  if (!document) {
    return <div>No document selected</div>;
  }

  const description = document.content?.Description || "No description available";
  const countries = document.content?.Countries || "N/A";
  const themes = document.content?.Themes || "N/A";
  const scale = document.content?.Scale || "N/A";
  const languages = document.content?.Langs || "N/A";



  return (
    <div>
      <Header />
      <SimpleSubHeader />
      <div className="document-detail-container row">
        <div className="col-md-6 thumbnail-section">
          <img src={`${BASE_URL}${document.img}`} alt={document.title} className="thumbnail-img" />
          <div className="button-group">
            <a
              href={document.bllink}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-primary"
            >
              {t("View")}
            </a>
            <a
              href={`${BASE_URL}${document.permalink}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-secondary"
            >
              {t("DownloadPDF")}
            </a>
          </div>
        </div>
        <div className="col-md-6 document-info">
          <h2>{document.title}</h2>
          <h2 className="rectangle"></h2>
          <h3>{document.datecontent}</h3>
          <p>{description}</p>
          <p><span className="list-header">{t("Countries")}:</span> <span className="list">{countries}</span></p>
          <p><span className="list-header">{t("Themes")}:</span> <span className="list">{themes}</span></p>
          <p><span className="list-header">{t("Scale")}:</span> <span className="list">{scale}</span></p>
          <p><span className="list-header">{t("Languages")}:</span> <span className="list">{languages}</span></p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DocumentDetail;
