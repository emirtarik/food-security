// src/pages/Analysis.js
import React, { useEffect, useRef } from "react";
import TableauEmbed from "../components/TableauEmbed"; // Import TableauEmbed
import Header from "./Header";
import Footer from "./Footer";
import SubHeader from "./SubHeader";
import Disclaimer from "../components/Disclaimer"; // Corrected spelling
import { useTranslationHook } from "../i18n";
import "../styles/Analysis.css"; // Import the Analysis.css file

export default function Analysis() {
  const { t } = useTranslationHook("misc");
  const projectsSectionRef = useRef(null);

  useEffect(() => {
    // Scroll to the projects section when the component mounts
    if (projectsSectionRef.current) {
      projectsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []); // Empty dependency array ensures the effect runs only once after initial render

  return (
    <div className="analysis-page">
      <Header />
      <SubHeader />
      {/* Tableau Visualization Section */}
      <section id="projects" className="container visualization-section">
        <div className="row">
          <div className="col-12">
            {/* Embed Tableau Visualization */}
            <TableauEmbed />
          </div>
        </div>
        {/* Disclaimer Section */}
        <div className="row">
          <div className="col-12">
            <Disclaimer isProject={false} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
