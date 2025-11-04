import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../components/constant.js";
import Header from "../Header.js";
import Footer from "../Footer.js";
import { useTranslationHook } from "../../i18n";
import documentData from "../../data/DocumentsRPCA.json";
import "../../styles/Document.css";
import "../../styles/PDFViewer.css";

import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [document, setDocument] = useState(null);
  
  // PDF viewer state variables using scale zoom (percentages)
  const [showPDF, setShowPDF] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    const foundDocument = documentData.find(doc => doc.bllink === `/documents/${bllink}`);
    setDocument(foundDocument);
  }, [bllink]);

  if (!document) {
    return <div>No document selected</div>;
  }

  const description = document.content?.Description || "No description available";
  const countries = document.content?.Countries || "N/A";
  const themes = document.content?.Themes || "N/A";
  const scaleInfo = document.content?.Scale || "N/A";
  const languages = document.content?.Langs || "N/A";

  // When PDF is successfully loaded, set the number of pages and reset pageNumber to 1.
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Zoom controls using scale values
  const zoomIn = () => setScale(prev => prev + 0.2);
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
  const resetZoom = () => setScale(1.0);

  return (
    <div>
      <Header />
      <SimpleSubHeader />
      <div className="document-detail-container row">
        <div className="col-md-6 thumbnail-section">
          <img 
            src={`${BASE_URL}${document.img}`} 
            alt={document.title} 
            className="thumbnail-img" 
          />
          <div className="button-group">
            <button onClick={() => setShowPDF(!showPDF)} className="btn btn-primary">
              {t("View")}
            </button>
            <a
              href={`${BASE_URL}${document.permalink}`}
              download
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
          {document.flag && (
            <div
              className="document-flag"
            >
              <img
                src={`${BASE_URL}${document.flag}`}
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
              onClick={() => setPageNumber(prev => Math.max(prev - 2, 1))}
              disabled={pageNumber === 1}
              className="btn btn-sm btn-outline-primary"
            >
              Previous
            </button>
            <span>
              Page {pageNumber}{numPages && pageNumber + 1 <= numPages ? ` - ${pageNumber + 1}` : ''} of {numPages || '--'}
            </span>
            <button 
              onClick={() => setPageNumber(prev => Math.min(prev + 2, numPages))}
              disabled={numPages ? pageNumber >= numPages : true}
              className="btn btn-sm btn-outline-primary"
            >
              Next
            </button>
            <button 
              onClick={() => setPageNumber(numPages - 1)}
              disabled={numPages ? pageNumber >= numPages - 1 : true}
              className="btn btn-sm btn-outline-primary"
            >
              Last
            </button>
            <div style={{ marginLeft: '20px' }}>
              <button onClick={zoomOut} className="btn btn-sm btn-outline-secondary">-</button>
              <span style={{ margin: '0 5px' }}>
                Zoom: {(scale * 100).toFixed(0)}%
              </span>
              <button onClick={zoomIn} className="btn btn-sm btn-outline-secondary">+</button>
              <button onClick={resetZoom} className="btn btn-sm btn-outline-secondary" style={{ marginLeft: '5px' }}>Reset</button>
            </div>
          </div>
          
          {/* PDF Document Display */}
          <PDFDocument
            file={`${BASE_URL}${document.permalink}`}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={error => console.error('Error loading PDF:', error)}
          >
            <div className="pdf-container">
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              { (pageNumber + 1) <= numPages && (
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
