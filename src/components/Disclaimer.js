import { useTranslationHook } from "../i18n";

export default function Disclamer({ isProject }) {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <div className="calendar-header" style={{ marginTop: "20px" }}>
      {isProject ? (
        <p>
          {" "}
          {t("Disclaimer Tool")}{" "}
          <a
            href="https://www.oecd.org/swac"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#243d54", textDecoration: "underline" }}
          >
            (CSAO/OCDE)
          </a>
          <br />
        </p>
      ) : null}
      <p style={{ paddingLeft: 200, paddingRight: 200, textAlign: "center" }}>
        {t("Disclaimer")}
      </p>
    </div>
  );
}
