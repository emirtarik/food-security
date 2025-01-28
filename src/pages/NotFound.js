import React from "react";
import { useTranslationHook } from "../i18n";


export default function NotFound() {
  const { t, currentLanguage, changeLanguage } = useTranslationHook('misc');
  return (
    <div>
      <h1
        style={{
          textAlign: "center",
          paddingTop: "40px",
          paddingBottom: "20px",
        }}
      >
        {t("404")}
      </h1>
    </div>
  );
}
