import React, { useEffect, useState } from "react";
import { useTranslationHook } from "../i18n";
import LogoEcoWas from "../assets/img/logo-ecowas.png";
import LogoUEMOA from "../assets/img/logo-uemoa.jpg";
import LogoCILSS from "../assets/img/logo-cilss.png";
import LogoSWAC from "../assets/img/logo-swac-oecd.png";
import LogoSWAC_FR from "../assets/img/logo-swac-oecd-fr.png";
import LogoEU from "../assets/img/EN_Co-fundedbytheEU_RGB_POS.png";
import LogoEU_FR from "../assets/img/FR_Co-fundedbytheEU_RGB_POS.png";
import { BASE_URL } from "../components/constant";
import presData from "../data/presData.json";
import { SocialMedia } from "./Header";

const Footer = () => {
  const { currentLanguage } = useTranslationHook("misc");
  const [swacLogo, setSwacLogo] = useState(LogoSWAC);
  const [euLogo, setEuLogo] = useState(LogoEU);

  useEffect(() => {
    if (currentLanguage === 'fr') {
      setSwacLogo(LogoSWAC_FR);
      setEuLogo(LogoEU_FR);
    } else {
      setSwacLogo(LogoSWAC);
      setEuLogo(LogoEU);
    }
  }, [currentLanguage]);

  // Close the share modal
  const closeModal = () => {
    const modal = document.getElementById("shareModal");
    const bootstrapModal = new window.bootstrap.Modal(modal);
    bootstrapModal.hide();
  };

  return (
    <footer className="footer" style={{ paddingTop: "0px" }}>
      <HomePres />
      <div className="container-fluid" style={{ paddingTop: "20px" }}>
        <div className="row align-items-xl-center"
        style={{ justifyContent: "center" }}>
          <div className="col-sm-6">
            <ul className="footer-logos list-unstyled d-flex align-items-center center-logos">
              <li>
                <a
                  href="https://www.cilss.int"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img src={LogoCILSS} alt="CILSS" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.oecd.org/swac"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img src={swacLogo} alt="SWAC OECD" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ecowas.int"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img src={LogoEcoWas} alt="ECOWAS" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.uemoa.int"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img src={LogoUEMOA} alt="UEMOA" />
                </a>
              </li>
              {/* <li>
                <a
                  href="https://european-union.europa.eu/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img src={euLogo} alt="EU" />
                </a>
              </li> */}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const HomePres = () => {
  const { imageURL } = presData;
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <section className="home-pres">
      <div className="container">
        <div className="row align-items-center">
          <div
            className="col-sm-4"
            style={{ display: "grid", justifyContent: "center" }}
          >
            <SocialMedia />
          </div>
          <div
            className="col-sm-4"
            style={{ display: "grid", justifyContent: "center" }}
          >
            <a href="/le-reseau/"></a>
            <img
              src={BASE_URL + imageURL}
              alt="Réseau RPCA"
              style={{ paddingBottom: "13px" }}
            />
            <p
              style={{
                display: "flex",
                font: "normal normal 300 13px/18px Lato",
                justifyContent: "center",
              }}
            >
              © RPCA {new Date().getFullYear()}
            </p>
          </div>
          <div
            className="col-sm-4"
            style={{ display: "grid", justifyContent: "center" }}
          >
            <ul
              className="nav footer-nav"
              style={{ textTransform: "uppercase", display: "block" }}
            >
              <li className="nav-item">
                <a className="nav-link" href="#">
                  {t("Terms & Conditions")}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href={`${BASE_URL}/about/`}>
                {t("About this website")}
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                {t("Contact us")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
