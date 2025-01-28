// src/components/TableauEmbed.js
import React, { useEffect, useRef } from "react";
import "../styles/TableauEmbed.css"; // Ensure this CSS file exists and is correctly linked

const tableauScriptURL = "https://public.tableau.com/javascripts/api/tableau-2.min.js";

function TableauEmbed() {
  const containerRef = useRef(null);
  const vizRef = useRef(null); // To store the Viz instance
  const url = "https://public.tableau.com/shared/PRFCDGTBP?:display_count=n&:origin=viz_share_link";

  useEffect(() => {
    // Function to initialize Tableau Viz
    const initViz = () => {
      if (vizRef.current) {
        console.log("Viz instance already exists.");
        return;
      }
      if (window.tableau) {
        vizRef.current = new window.tableau.Viz(containerRef.current, url, {
          width: "100%",
          height: "800px", // Set a fixed height or adjust as needed
          hideTabs: true,
          hideToolbar: true,
        });
      } else {
        console.error("Tableau API not loaded");
      }
    };

    // Initialize Viz
    initViz();

    // Cleanup function to dispose of Viz instance on unmount
    return () => {
      if (vizRef.current) {
        vizRef.current.dispose();
        vizRef.current = null;
      }
    };
  }, [url]); // Dependency array ensures this runs once per URL

  return <div ref={containerRef} className="tableau-container" />;
}

export default TableauEmbed;
