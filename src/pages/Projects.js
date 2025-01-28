// src/pages/Projects.js
import React from "react";
import Header from "./Header";
import SubHeader from "./SubHeader";
import Footer from "./Footer";
import Disclaimer from "../components/Disclaimer";
import { useTranslationHook } from "../i18n";
import "../styles/Projects.css"; // Optional: For any additional custom styles

export default function Projects() {
  const { t } = useTranslationHook("misc"); // Initialize translation hook

  return (
    <div className="projects-page">
      <Header />
      <SubHeader />

      {/* Main Content */}
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h2 className="mb-4">{t("projectsUnderRenovation")}</h2>
            <p className="lead">{t("checkBackLater")}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
