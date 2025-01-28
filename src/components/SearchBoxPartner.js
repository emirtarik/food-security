import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";
import { useTranslationHook } from "../i18n";


const staticPartner = [
  "AfDB",
  "Austria - OEZA",
  "Belgium - Enable",
  "BID",
  "Canada - Global Affairs",
  "Danemark – DANIDA",
  "FCDO",
  "Espagne – AECID",
  "EU",
  "Fonds africain de développement",
  "France",
  "Germany - BMZ",
  "HCR",
  "Italy",
  "Luxembourg",
  "Netherlands (The) - MINBUZA",
  "OEZA",
  "SNV",
  "Switzerland - SDC",
  "The World Bank",
  "UNICEF",
  "USAID-USA",
  // ... other partner options
];

const SearchBoxPartner = ({ selectedPartner, setSelectedPartner }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <StaticFilterOptions
      title={t("Partner")}
      options={staticPartner}
      selectedOptions={selectedPartner}
      setSelectedOptions={setSelectedPartner}
    />
  );
};

export default SearchBoxPartner;
