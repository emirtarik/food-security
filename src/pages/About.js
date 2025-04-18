import React from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import SubHeader from './SubHeader';
import Footer from './Footer';
import NotFound from './NotFound';
import aboutPageData from '../data/aboutPageData.json';
import MarkdownContent from '../components/MarkdownContent';
import picPlaceholder from "../assets/picture-placeholder.png";
import picRPCA from "../assets/img/about_rpca.jpg";
import { useTranslationHook } from '../i18n';
import "../styles/About.css";

const renderContentWithLineBreaks = (content) => {
  return content.split('\n').map((line, index) => (
    <p key={index}>{line}</p>
  ));
};

const LinkRenderer = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="custom-link"
    >
      {children}
    </a>
  );
};

const WhoAreWe = () => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const pageData = aboutPageData.find(page => page.permalink === "/about/who-are-we");

  if (!pageData) {
    console.error("Page data not found for /about/who-are-we");
    return <NotFound />;
  }

  const content = currentLanguage === 'fr' ? pageData.fr : pageData.en;
  const videos = content.videos || [];

  console.log("Current Language:", currentLanguage);
  console.log("Page Content:", content);
  console.log("Videos:", videos);

  return (
    <div>
      <Header />
      <SubHeader />
      <section className="container page-detail">
        <h1 className="title">{content.title}</h1>
        <h2 className="rectangle"></h2>
        <div className="row" style={{ marginBottom: "-50px" }}>
          <img src={picRPCA} className="rpca-img" alt="RPCA" />
        </div>
        <div className="document-detail-container row">
          <div className="col-md-6 document-info">
            <p>{renderContentWithLineBreaks(content.content)}</p>
          </div>
          {/* <div className="col-md-6 thumbnail-section">
            <img src={picPlaceholder} className="thumbnail-img" alt="Placeholder" />
          </div> */}
        </div>

        <div className="row">
          <h2 className="title" style={{ marginLeft: "auto", marginRight: "auto", color: "#243d54"}}>{t("Videos90")}</h2>
        </div>
        <div className="row video-row">
          {videos.map((video, index) => (
            <div className="col-md-4 video-col" key={index}>
              <div className="video-container">
                <div className="video-overlay">{video.title}</div>
                <iframe src={video.link} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};


const History = () => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const pageData = aboutPageData.find(page => page.permalink === "/about/history");

  if (!pageData) {
    return <NotFound />;
  }

  const content = currentLanguage === 'fr' ? pageData.fr : pageData.en;
  const boxes = content.boxes || [];
  const documentsH = content.documentsH || [];

  return (
    <div>
      <Header />
      <SubHeader />
      <section className="container page-detail">
        <h1 className="title">{content.title}</h1>
        <h2 className="rectangle"></h2>
        <div className="document-detail-container row" style={{ gridTemplateColumns: "1fr 0fr"}}>
          <div className="col-md-6 document-info">
            <p>{renderContentWithLineBreaks(content.content)}</p>
          </div>
        </div>
        <div className="box-container">
          {boxes.map((box, index) => (
            <div className="green-box" key={index}>
              <div style={{ font: "normal normal bold 42px/46px Lato", marginBottom: "10px", marginTop: "40px" }}>{box.year}</div>
              <div style={{ font: "normal normal bold 20px/22px Lato", marginBottom: "auto", marginTop: "auto", color: "#fff" }}>{box.title}</div>
              {/* <div className="arrow">→</div> */}
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: "50px" }}>
          <h2 className="title" style={{ marginLeft: "auto", marginRight: "auto", color: "#243d54"}}>{t("DocumentsH")}</h2>
        </div>
        <div className="row video-row">
          {documentsH.map((document, index) => (
            <div className="col-md-4 video-col" key={index}>
              <a href={document.link} target="_blank" rel="noopener noreferrer">
                <div className="video-container" style={{ backgroundImage: `url(${document.thumbnail})`, backgroundPosition: "center" }}>
                  <div className="video-overlay">{document.title}</div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

const Pregec = () => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const markdownFile = currentLanguage === 'fr'
    ? "/markdown/the-pregec-charter-fr.md"
    : "/markdown/the-pregec-charter.md";
  const pageData = aboutPageData.find(page => page.permalink === "/about/the-pregec-charter");

  if (!pageData) {
    return <NotFound />;
  }

  const content = currentLanguage === 'fr' ? pageData.fr : pageData.en;
  const documents = content.documents || [];

  return (
    <div>
      <Header />
      <SubHeader />
      <section className="container page-detail">
        <h1 className="title">
          {currentLanguage === 'fr' ? "La Charte PREGEC" : "The PREGEC Charter"}
        </h1>
        <h2 className="rectangle"></h2>
        <div className="document-detail-container row">
          <div className="col-md-6 document-info">
            <MarkdownContent file={markdownFile} />
          </div>
        </div>
        <div className="box-container">
          {documents.map((doc, index) => (
            <div 
              className="blue-box video-container" 
              key={index}
              style={{ 
                backgroundImage: `url(${doc.thumbnail})`, 
                backgroundPosition: "center",
                backgroundSize: "cover"
              }}
            >
              <a 
                href={doc.link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit", width: "100%", height: "100%" }}
              >
                <div className="video-overlay">
                  {doc.title}
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};


const About = () => {
  const { permalink } = useParams();

  switch (permalink) {
    case "who-are-we":
      return <WhoAreWe />;
    case "history":
      return <History />;
    case "the-pregec-charter":
      return <Pregec />;
    default:
      return (
        <div>
          <Header />
          <SubHeader />
          <NotFound />
          <Footer />
        </div>
      );
  }
};

export default About;
