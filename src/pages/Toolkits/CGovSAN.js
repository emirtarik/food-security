import React from "react";
import "../../styles/SetofInstruments.css";
import Header from "../Header";
import SubHeader from "../SubHeader";
import Footer from "../Footer";
import { useTranslationHook } from "../../i18n";
import NotFound from "../NotFound";
import "../../styles/CGovSAN.css";

export default function CGovSAN() {
  const { t, currentLanguage, changeLanguage } = useTranslationHook(["misc"]);

  return (
    <div>
      <Header />
      <SubHeader />
      <NotFound />
      <Footer />
    </div>
  );
}

