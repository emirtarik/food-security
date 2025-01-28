import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";
import { useTranslationHook } from "../i18n";


const Countries = [
  "Benin",
  "Burkina Faso",
  "Cabo Verde",
  "Cameroon",
  "Chad",
  "Côte d'Ivoire",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Liberia",
  "Mali",
  "Mauritania",
  "Niger",
  "Nigeria",
  "Senegal",
  "Sierra Leone",
  "Togo",
  // ... other country options
];

const SearchBoxLocation = ({ selectedLocations, setSelectedLocations }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <StaticFilterOptions
      title={t("Location")}
      options={Countries}
      selectedOptions={selectedLocations}
      setSelectedOptions={setSelectedLocations}
    />
  );
};

export default SearchBoxLocation;
