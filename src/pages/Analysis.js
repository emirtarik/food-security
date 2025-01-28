// src/pages/Analysis.js
import React, { useEffect, useRef } from "react";
import TableauEmbed from "../components/TableauEmbed"; // Import TableauEmbed
import Header from "./Header";
import Footer from "./Footer";
import SubHeader from "./SubHeader";
import CaptureSectionScreenshot from "../components/Screenshot";
import Disclamer from "../components/Disclaimer";
import { useTranslationHook } from "../i18n";
import "../styles/Analysis.css"; // Import the Analysis.css file

export default function Analysis() {
  const { t } = useTranslationHook("misc");
  const projectsSectionRef = useRef(null);

  const tableauUrl =
    "https://public.tableau.com/views/DashboardAgrhymet_17084302692750/CarteCycleOctobre-Novembre2024";

  useEffect(() => {
    // Scroll to the projects section when the component mounts
    if (projectsSectionRef.current) {
      projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []); // Empty dependency array ensures the effect runs only once after initial render

  return (
    <div>
      <Header />
      <SubHeader />
      <section
        ref={projectsSectionRef}
        id="calendar-header"
        className="container row-filter pt-5"
        style={{ marginBottom: "0px" }}
      >
        <div className="row">
          <div className="col-sm-12">
            <h1
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginLeft: "20px",
              }}
            >
            </h1>
          </div>
        </div>
      </section>
      <section
        id="projects"
        className="container row-filter"
        style={{ marginBottom: "0px" }}
      >
        <div className="row">
          <div className="col-12">
            {/* Embed Tableau Visualization */}
            <TableauEmbed
              url={tableauUrl}
              hideTabs={true}
              hideToolbar={false}
              onFirstInteractive={() => {
                console.log("Tableau visualization is ready.");
              }}
            />
          </div>
        </div>
        <Disclamer isProject={false} />
      </section>
      <Footer />
    </div>
  );
}
