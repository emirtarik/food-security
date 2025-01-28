import React, { useCallback, useState, useRef, useEffect } from "react";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "../../styles/SetofInstruments.css";
import pdfDoc from "../../assets/pdf/EN-SET-OF-INSTRUMENTS_RPCA_RPCA.pdf";
import Header from "../Header";
import SubHeader from "../SubHeader";
import Footer from "../Footer";

const url = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = url;

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

const maxWidth = 1000;

export default function SetofInstruments() {
  const [file, setFile] = useState(pdfDoc);
  const [numPages, setNumPages] = useState(null);
  const containerRef = useRef(null); // Use useRef directly
  const [containerWidth, setContainerWidth] = useState(null);

  const onResize = useCallback((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  const resizeObserverOptions = {};
  useResizeObserver(containerRef.current, resizeObserverOptions, onResize); // Use containerRef.current

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <Header />
      <SubHeader />
      <div className="Example">
        <div className="Example__container">
          <div className="Example__container__document" ref={containerRef}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              options={options}
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={
                    containerWidth
                      ? Math.min(containerWidth, maxWidth)
                      : maxWidth
                  }
                />
              ))}
            </Document>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
