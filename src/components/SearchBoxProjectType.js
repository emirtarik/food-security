import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";
import { useTranslationHook } from "../i18n";

const staticProjectTypes = [
  "Humanitarian Aid",
  "Development",
  "Peace",
  "Social Protection",
  ];

const SearchBoxProjectTypes = ({
  selectedProjectTypes,
  setselectedProjectTypes,
}) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <StaticFilterOptions
      title={t("Type")}
      options={staticProjectTypes}
      selectedOptions={selectedProjectTypes}
      setSelectedOptions={setselectedProjectTypes}
    />
  );
};

export default SearchBoxProjectTypes;
