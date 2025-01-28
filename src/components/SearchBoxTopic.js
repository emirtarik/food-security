import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";
import { useTranslationHook } from "../i18n";

const TopicOptions = [
  "Agriculture",
  "Livestock & pastoralism",
  "Forestry & biodiversity",
  "Fisheries & aquaculture",
  "Natural resource management, Climate adaptation and mitigation",
  "Employment & revenues",
  "Nutrition & health",
  "Demography & migration",
  "Energy",
  "Water & sanitation",
  "Markets, prices and trade",
  "Gender (Youth and women)",
  "Governance",
  "Resilience",
  "Youth",
  // ... other Topic options
];

const SearchBoxTopic = ({ selectedTopics, setSelectedTopics }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <StaticFilterOptions
      title={t("Topic")}
      options={TopicOptions}
      selectedOptions={selectedTopics}
      setSelectedOptions={setSelectedTopics}
    />
  );
};

export default SearchBoxTopic;
