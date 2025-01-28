import React from "react";
import "../../styles/SetofInstruments.css";
import Header from "../Header";
import SubHeader from "../SubHeader";
import Footer from "../Footer";
import SurveyComponent from "../../components/Survey";
import DynamicPost from "../../components/DynamicPost";
import postData from "../../data/postData.json";
import { useTranslationHook } from "../../i18n";
import { BASE_URL } from "../../components/constant.js";
import "../../styles/CGovSAN.css";

export default function CGovSAN() {
  const { t, currentLanguage, changeLanguage } = useTranslationHook(["misc"]);
  const embedUrl =
    "https://view.officeapps.live.com/op/embed.aspx?src=https://www.food-security.net/uploads/2020/08/Evaluation-grid_September-2020_FR.xlsx";
  return (
    <div>
      <Header />
      <SubHeader />
      <div className="Example">
        <div className="Example__container">
          <div className="Example__container__document">
            <DynamicPost
              data={postData}
              category="post"
              permalinkOverride="c-gov-san"
            />
            <a className="btn btn-primary"
              href={`${BASE_URL}/uploads/2020/08/Evaluation-grid_September-2020_FR.xlsx`}
            >
              {t("download")}
            </a>
            <iframe
              title="Embedded Document"
              src={embedUrl}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function CGovSANSurvey() {
  const pageTitle = "C Gov SAN";

  return (
    <div>
      <Header />
      <SubHeader />
      <section
        id="calendar-header"
        className="container row-filter pt-5"
        style={{ marginBottom: "0px" }}
      >
        <div className="row">
          <div className="col-sm-9">
            <h1>{pageTitle}</h1>
          </div>
        </div>
      </section>
      <section className="container pt-5 pb-5" id="countrypage">
        <SurveyComponent /> {/* https://surveyjs.io/create-free-survey */}
      </section>
      <section className="container pt-5 pb-5" id="countrypage"></section>
      <Footer />
    </div>
  );
}
