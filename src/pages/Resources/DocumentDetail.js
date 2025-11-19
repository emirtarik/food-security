import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BASE_URL, ASSETS_BASE_URL } from "../../components/constant.js";
import Header from "../Header.js";
import Footer from "../Footer.js";
import { useTranslationHook } from "../../i18n";
import fallbackDocumentData from "../../data/DocumentsRPCA.json";
import { Document as PDFDocument, Page, pdfjs } from "react-pdf";
import "../../styles/Document.css";
import "../../styles/PDFViewer.css";



pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; 
 
const rawPathFromVal = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;

  if (typeof v === "object") {
    return v.medium || v.url || v.src || "";
  }

  return "";
};

const isAbs = (p) =>
  typeof p === "string" &&
  (/^https?:\/\//i.test(p) || /^data:/i.test(p));

const resolveAsset = (v) => {
  const p = rawPathFromVal(v);

  if (!p) {
    return `${ASSETS_BASE_URL}/images/doc-placeholder.png`;
  }

  if (isAbs(p)) return p;

  if (
    p.startsWith("/uploads") ||
    p.startsWith("/images") ||
    p.startsWith("/data")
  ) {
    return `${ASSETS_BASE_URL}${p}`;
  }

  return `${BASE_URL}${p}`;
};

const DOCS_JSON_URL =
  process.env.REACT_APP_DOCUMENTS_JSON_URL ||
  `${ASSETS_BASE_URL}/data/DocumentsRPCA.json`;

const SimpleSubHeader = () => {
  const { t } = useTranslationHook(["misc"]);
  const navigate = useNavigate();
  return (
    <div className="row">
      <div className="col-md-12" style={{ color: "#243d54" }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-link"
          style={{ padding: "10px", marginTop: "3px" }}
        >
          &larr; {t("Back to documents")}
        </button>
      </div>
    </div>
  );
};

const DocumentDetail = () => {
  const { t } = useTranslationHook(["misc"]);
  const { bllink } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();

  const initialFromState = location.state?.document || null;

  const [document, setDocument] = useState(initialFromState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 
  const [showPDF, setShowPDF] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        let data;
        try {
          const res = await fetch(DOCS_JSON_URL);
          if (!res.ok) {
            throw new Error(`Remote fetch failed with ${res.status}`);
          }
          data = await res.json();
        } catch (e) {
          console.warn("Falling back to local DocumentsRPCA.json:", e);
          data = fallbackDocumentData;
        }
  
        const fullPath = `/documents/${bllink}`;
        const foundDoc = data.find((doc) => doc.bllink === fullPath);
  
        if (!foundDoc) {
          setError("Document not found.");
          setDocument(null);
        } else {
          setDocument((prev) => ({ ...prev, ...foundDoc }));
        }
      } catch (e) {
        console.error("Error loading document:", e);
        setError("Error loading document metadata.");
        setDocument(null);
      } finally {
        setLoading(false);
      }
    }
  
    load();
  }, [bllink]);   
  
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const zoomIn = () => setScale((prev) => prev + 0.2);
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.2));
  const resetZoom = () => setScale(1.0);

  const meta = (document?.content && typeof document.content === "object")
    ? document.content
    : document || {};

  const description =
    meta.Description ?? document?.Description ?? document?.description ?? "No description available";

  const countries =
    meta.Countries ?? document?.Countries ?? document?.countries ?? "N/A";

  const themes =
    meta.Themes ?? document?.Themes ?? document?.themes ?? "N/A";

  const scaleInfo =
    meta.Scale ?? document?.Scale ?? document?.scales ?? "N/A";

  const languages =
    meta.Langs ?? meta.Languages ?? document?.Langs ?? document?.Languages ?? document?.langs ?? "N/A";

  return (
    <div>
      <Header />
      <SimpleSubHeader />

      <div className="document-detail-container row">
        <div className="col-md-6 thumbnail-section">
          <img
            src={resolveAsset(document?.img)}
            alt={document?.title || "document"}
            className="thumbnail-img"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${ASSETS_BASE_URL}/images/doc-placeholder.png`;
            }}
          />
          <div className="button-group">
            <button
              onClick={() => setShowPDF(!showPDF)}
              className="btn btn-primary"
            >
              {t("View")}
            </button>
            <a
              href={resolveAsset(document?.permalink)}
              download
              className="btn btn-secondary"
            >
              {t("DownloadPDF")}
            </a>
          </div>
        </div>

        <div className="col-md-6 document-info">
          <h2>{document?.title}</h2>
          <h2 className="rectangle"></h2>
          <h3>{document?.datecontent}</h3>
          <p>{description}</p>
          <p>
            <span className="list-header">{t("Countries")}: </span>
            <span className="list">{countries}</span>
          </p>
          <p>
            <span className="list-header">{t("Themes")}: </span>
            <span className="list">{themes}</span>
          </p>
          <p>
            <span className="list-header">{t("Scale")}: </span>
            <span className="list">{scaleInfo}</span>
          </p>
          <p>
            <span className="list-header">{t("Languages")}: </span>
            <span className="list">{languages}</span>
          </p>
          {/* EU Flag / Funding Visual */}
          {document?.flag && (
  <div className="document-flag">
    <img
      src={resolveAsset(document.flag)}
      alt="Document flag"
      className="flag-logo"
    />
  </div>
)}

        </div>
      </div>

      {/* PDF Viewer Section */}
      {showPDF && (
        <div className="pdf-viewer">
          {/* Toolbar */}
          <div className="pdf-toolbar">
            <button
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1}
              className="btn btn-sm btn-outline-primary"
            >
              First
            </button>
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 2, 1))}
              disabled={pageNumber === 1}
              className="btn btn-sm btn-outline-primary"
            >
              Previous
            </button>
            <span>
              Page {pageNumber}
              {numPages && pageNumber + 1 <= numPages ? ` - ${pageNumber + 1}` : ""}{" "}
              of {numPages || "--"}
            </span>
            <button
              onClick={() =>
                setPageNumber((prev) =>
                  numPages ? Math.min(prev + 2, numPages) : prev
                )
              }
              disabled={numPages ? pageNumber >= numPages : true}
              className="btn btn-sm btn-outline-primary"
            >
              Next
            </button>
            <button
              onClick={() => numPages && setPageNumber(numPages - 1)}
              disabled={numPages ? pageNumber >= numPages - 1 : true}
              className="btn btn-sm btn-outline-primary"
            >
              Last
            </button>
            <div style={{ marginLeft: "20px" }}>
              <button onClick={zoomOut} className="btn btn-sm btn-outline-secondary">-</button>
              <span style={{ margin: "0 5px" }}>Zoom: {(scale * 100).toFixed(0)}%</span>
              <button onClick={zoomIn} className="btn btn-sm btn-outline-secondary">+</button>
              <button onClick={resetZoom} className="btn btn-sm btn-outline-secondary" style={{ marginLeft: "5px" }}>
                Reset
              </button>
            </div>
          </div>

          <PDFDocument
            file={resolveAsset(document?.permalink)}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => console.error("Error loading PDF:", err)}
          >
            <div className="pdf-container">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {numPages && pageNumber + 1 <= numPages && (
                <Page
                  pageNumber={pageNumber + 1}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </div>
          </PDFDocument>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DocumentDetail;
