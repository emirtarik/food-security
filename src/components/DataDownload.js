// src/components/DataDownload.js
import React, { useMemo, useState } from "react";
import { useTranslationHook } from "../i18n";
import "../styles/DataDownload.css";

const STAKEHOLDER_OPTIONS = [
  "Journalists/Medias",
  "NGO (ex. Amnesty) / Network Organisations (ex. UCLG)",
  "Private companies & initiatives / Consulting Firms and Independent Contractors (ex. ARUP, KPMG, freelance)",
  "Schools and Universities / Research Institutes or Centres (ex. IIED, ACC -African Centre for Cities)",
  "Financing entities / Multilateral banks of development) (ex. AfDB, BOAD, WB Group, ADB)",
  "International or Regional Organisations (ex. African Union, OECD ; ex. ECOWAS, UEMOA)",
  "National public and governmental entities (Ministries, Embassies, Cooperation Agencies)",
  "Local public and government entities (Municipalities, etc.)",
  "Citizens/Civil Society",
];

const DataDownload = () => {
  const { t, currentLanguage } = useTranslationHook("analysis");

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    country: "",
    organisation: "",
    stakeholder: "",
    usage: "",
  });

  const [touched, setTouched] = useState({});

  const emailValid = useMemo(() => {
    if (!formData.email) return false;
    const re = /^(?:[a-zA-Z0-9_'^&+\-])+(?:\.(?:[a-zA-Z0-9_'^&+\-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return re.test(formData.email.trim());
  }, [formData.email]);

  const requiredValid = useMemo(() => {
    return (
      emailValid &&
      formData.firstName.trim().length > 0 &&
      formData.lastName.trim().length > 0 &&
      formData.country.trim().length > 0 &&
      formData.organisation.trim().length > 0 &&
      formData.stakeholder.trim().length > 0
    );
  }, [emailValid, formData.firstName, formData.lastName, formData.country, formData.organisation, formData.stakeholder]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const getError = (name) => {
    if (!touched[name]) return "";
    if (name === "email" && !emailValid) return t("invalidEmail") || "Please enter a valid email";
    if (["firstName", "lastName", "country", "organisation", "stakeholder"].includes(name)) {
      if (!formData[name] || formData[name].trim().length === 0) return t("required") || "Required";
    }
    return "";
  };

  const handleDownload = () => {
    if (!requiredValid) return;
    try {
      if (window.gtag) {
        window.gtag('event', 'download_csv', {
          event_category: 'data_download',
          event_label: 'RPCA_food_insecurity.csv',
          value: 1,
          user_email_domain: formData.email.split('@')[1] || '',
          stakeholder: formData.stakeholder,
          country: formData.country
        });
      }
    } catch (_) {}
    const a = document.createElement('a');
    a.href = '/data/RPCA_food_insecurity.csv';
    a.download = 'RPCA_food_insecurity.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="data-download-container">
      <h3 className="data-download-title">{t("dataDownloadTitle") || "Download our Dataset"}</h3>

      <form className="data-download-form" onSubmit={(e) => { e.preventDefault(); handleDownload(); }}>
        <div className="form-row">
          <label htmlFor="email">{t("email") || "Email address"}*</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={onChange} onBlur={onBlur} placeholder="name@example.org" />
          {getError("email") && <div className="error-text">{getError("email")}</div>}
        </div>

        <div className="form-row two-cols">
          <div>
            <label htmlFor="firstName">{t("firstName") || "First name"}*</label>
            <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={onChange} onBlur={onBlur} />
            {getError("firstName") && <div className="error-text">{getError("firstName")}</div>}
          </div>
          <div>
            <label htmlFor="lastName">{t("lastName") || "Last name"}*</label>
            <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={onChange} onBlur={onBlur} />
            {getError("lastName") && <div className="error-text">{getError("lastName")}</div>}
          </div>
        </div>

        <div className="form-row two-cols">
          <div>
            <label htmlFor="country">{t("country") || "Country"}*</label>
            <input id="country" name="country" type="text" value={formData.country} onChange={onChange} onBlur={onBlur} />
            {getError("country") && <div className="error-text">{getError("country")}</div>}
          </div>
          <div>
            <label htmlFor="organisation">{t("organisation") || "Organisation (public sector: specify ministry or local entity)"}*</label>
            <input id="organisation" name="organisation" type="text" value={formData.organisation} onChange={onChange} onBlur={onBlur} />
            {getError("organisation") && <div className="error-text">{getError("organisation")}</div>}
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="stakeholder">{t("stakeholderGrouping") || "Stakeholder grouping"}*</label>
          <select id="stakeholder" name="stakeholder" value={formData.stakeholder} onChange={onChange} onBlur={onBlur}>
            <option value="">{t("selectOption") || "Select an option"}</option>
            {STAKEHOLDER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {getError("stakeholder") && <div className="error-text">{getError("stakeholder")}</div>}
        </div>

        <div className="form-row">
          <label htmlFor="usage">{t("intendedUse") || "How do you intend to use the data? (voluntary)"}</label>
          <textarea id="usage" name="usage" rows={3} value={formData.usage} onChange={onChange} />
        </div>

        <div className="form-actions">
          <button type="submit" className="download-btn" disabled={!requiredValid} onClick={handleDownload}>
            {requiredValid ? (t("downloadCsv") || "Download CSV") : (t("completeFormToDownload") || "Complete form to enable download")}
          </button>
          <a className="csv-link" href="/data/RPCA_food_insecurity.csv" download style={{ display: "none" }}>CSV</a>
        </div>

        <p className="privacy-note">
          {(() => {
            const isFr = (currentLanguage || '').startsWith('fr');
            const termsHref = isFr ? 'https://www.oecd.org/fr/about/terms-conditions.html' : 'https://www.oecd.org/en/about/terms-conditions.html';
            const privacyHref = isFr ? 'https://www.oecd.org/fr/about/privacy.html' : 'https://www.oecd.org/en/about/privacy.html';
            return (
              <span>
                {isFr
                  ? "En soumettant votre adresse e-mail, vous acceptez les "
                  : "By submitting your email address you agree to the OECD’s "}
                <a href={termsHref} target="_blank" rel="noreferrer" className="privacy-link">{isFr ? "Conditions générales" : "Terms and Conditions"}</a>
                {isFr ? " et la " : " and "}
                <a href={privacyHref} target="_blank" rel="noreferrer" className="privacy-link">{isFr ? "Politique de confidentialité" : "Privacy Policy"}</a>
                {isFr ? "." : "."}
              </span>
            );
          })()}
        </p>
      </form>
    </div>
  );
};

export default DataDownload;


