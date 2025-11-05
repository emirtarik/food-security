import React, { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import Popup from '../components/Popup';
import "../App.css";
import { useTranslationHook } from "../i18n";
import slideDataLeft from "../data/locales/en/slideDataLeft.json";
import slideDataRight from "../data/locales/en/slideDataRight.json";
import articleData from "../data/articleData.json";
import temoignageData from "../data/temoignageData.json";
import presData from "../data/presData.json";
import documentData from "../data/DocumentsRPCA.json";
import videoData from "../data/VideosRPCA.json";
import mapsData from "../data/MapsRPCA.json";
import { DocumentsSection, MapsSection, VideosSection } from "./Resources";
import { BASE_URL } from "../components/constant.js";

const bgStyle = (path) => ({
  backgroundImage: `url(${BASE_URL + path})`,
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
});

const HomeSlideLeft = ({ slideImg, slideLink }) => {
  const { t, currentLanguage, changeLanguage } =
    useTranslationHook("slideDataLeft");
  return (
    <section className="home-slide lazy" style={bgStyle(slideImg)}>
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          backgroundColor: "#243d54",
          marginLeft: "80px",
          marginRight: "80px",
          marginTop: "120px",
        }}
      >
        <a
          style={{
            paddingTop: "30px",
            marginBottom: "30px",
          }}
        >
          <p
            style={{
              color: "#C2BE00",
              lineHeight: "120%",
              font: "normal normal 900 33px/35px Lato",
            }}
          >
            {t("slideTitle")}
          </p>
          <p
            style={{
              font: "normal normal 900 20px/25px Lato",
              marginBottom: "20px",
            }}
          >
            {t("slideSubtitle")}
          </p>
          <a
            style={{
              border: "1px solid #FFF",
              font: "normal normal 300 12px/17px Lato",
              maxWidth: "120px",
              paddingTop: "10px",
              paddingBottom: "10px",
              paddingLeft: "20px",
              paddingRight: "20px",
              margin: "auto",
            }}
            href={`${BASE_URL}${slideLink}`}
          >
            {t("more")}
          </a>
        </a>
      </div>
    </section>
  );
};

const HomeSlideRight = ({
  slideLink,
  slideTitle,
  sildeSubtitle,
  slideTime,
  slideLocation,
  arrowPic,
  eventPic,
}) => {
  const { t, currentLanguage, changeLanguage } =
    useTranslationHook("slideDataRight");
  return (
    <section className="home-slide lazy" style={bgStyle("/images/banner-right.jpg")}>
      <div className="container">
        <a href={`${BASE_URL}${slideLink}`}>
          <div
            style={{
              display: "grid",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              backgroundColor: "rgba(36, 61, 84, 0.7)",
              padding: "30px",
              borderRadius: "8px",
            }}
          >
            <img
              src={`${BASE_URL}${eventPic}`}
              style={{
                width: "60px",
                height: "60px",
                justifySelf: "center",
                marginBottom: "25px",
              }}
              alt="Event"
            />
            <h2
              style={{
                color: "#C2BE00",
                font: "normal normal 900 45px/35px Lato",
              }}
            >
              {t("nextEvent")}
            </h2>
            <p
              style={{
                marginBottom: "0px",
                font: "normal normal 900 20px/26px Lato",
              }}
            >
              {t("slideTime")}
            </p>
            <p style={{ font: "normal normal 900 20px/26px Lato" }}>
              {t("slideLocation")}
            </p>
            <p
              style={{
                color: "#F1E1D1",
                marginBottom: "0px",
                font: "normal normal 900 20px/26px Lato",
                textTransform: "uppercase",
              }}
            >
              {t("slideTitle")}
            </p>
            <p
              style={{
                color: "#AEC351",
                font: "normal normal 900 16px/22px Lato",
              }}
            >
              {t("sildeSubtitle")}
            </p>
            <p
              style={{
                marginBottom: "0px",
                font: "normal normal 900 20px/26px Lato",
              }}
            >
              {t("Discover")}{" "}
              <img
                src={`${BASE_URL}${arrowPic}`}
                style={{ width: "20px", height: "15px" }}
                alt="Arrow"
              />
            </p>
          </div>
        </a>
      </div>
    </section>
  );
};

const HomeFeatured = () => {
  return (
    <section className="home-featured featured-articles">
      <div className="container-fluid">
        <div className="row">
          {articleData.map((article, index) => (
            <div key={index} className={article.colClass}>
              <article className="article article-primary">
                <div
                  className="article-thumb lazy"
                  style={bgStyle(article.imageUrl)}
                ></div>
                <div className="article-content">
                  <h2>{article.title}</h2>
                  {article.description && <p>{article.description}</p>}
                  <span className="btn btn-white">{article.buttonLabel}</span>
                </div>
                <a href={BASE_URL + article.link} className="bllink">
                  {article.buttonLabel}
                </a>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomeTemoignage = () => {
  const { lead, title, fonction } = temoignageData;

  return (
    <section className="home-temoignage">
      <div className="container">
        <h2>Working together</h2>
        <p className="lead">{lead}</p>
        <p className="name">
          {title}, {fonction}
        </p>
        <div className="embed-responsive embed-responsive-16by9">
          <iframe
            width="853"
            height="480"
            src={`https://www.youtube.com/embed/uYxQQXZPR0s?feature=oembed&enablejsapi=1&origin=https%3A%2F%2Fwww.food-security.net`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded youtube"
          />
        </div>
      </div>
    </section>
  );
};

const HomeCountries = () => (
  <section className="home-countries">
    <div className="home-countries-map-wrapper">
      <div className="home-countries-map" id="home-countries-map"></div>
    </div>

    <div className="home-countries-content">
      <h2>Country &amp; region Gateway</h2>
      <p>Discover data and resources by country or region</p>
      <a href={BASE_URL + "/analysis-and-response"} className="btn btn-white">
        More
      </a>
    </div>
  </section>
);

const HomeArticles = () => {
  return (
    <section className="home-articles" style={{ padding: "0px" }}>
      <div className="container">
        <div className="row">
          <DocumentsSection documents={documentData} maxDocuments={5} />
          <MapsSection documents={mapsData} maxDocuments={3} />
          <VideosSection documents={videoData} maxDocuments={3} />
        </div>
      </div>
    </section>
  );
};

const HomePres = () => {
  const { title, content, imageURL } = presData;

  return (
    <section className="home-pres">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-sm-2">
            <a href="/le-reseau/"></a>
            <img src={BASE_URL + imageURL} alt="Réseau RPCA" />
          </div>
          <div className="col-sm-10">
            <h2>{title}</h2>
            {content}
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [showPopup, setShowPopup] = useState(false); {/* change here for popup display */}

  const closePopup = () => {
    setShowPopup(false);
  };
  return (
    <div>
      <Header />
      {showPopup && <Popup onClose={closePopup} />} {/* Show popup if `showPopup` is true */}
      <section style={{ paddingRight: "15px" }}>
        <div className="row">
          <div
            className="col-md-6 col-xl-6"
            style={{ paddingLeft: "0px", paddingRight: "0px" }}
          >
            <HomeSlideLeft {...slideDataLeft} />
          </div>
          <div
            className="col-md-6 col-xl-6"
            style={{
              paddingLeft: "0px",
              paddingRight: "0px",
            }}
          >
            <HomeSlideRight {...slideDataRight} />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
