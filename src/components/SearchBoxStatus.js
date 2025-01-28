import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";
import { useTranslationHook } from "../i18n";


const StatusOptions = ["ONGOING", "COMPLETED", "FORTHCOMING"];

const SearchBoxStatus = ({ selectedStatus, setSelectedStatus }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <StaticFilterOptions
      title={t("Status")}
      options={StatusOptions}
      selectedOptions={selectedStatus}
      setSelectedOptions={setSelectedStatus}
    />
  );
};

export default SearchBoxStatus;
