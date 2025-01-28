import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import postData from '../data/postData.json';
import NotFound from "../pages/NotFound";
import ICalendarLink from "react-icalendar-link";
import { BASE_URL } from "../components/constant";
import { useTranslationHook } from "../i18n";
import picPlaceholder from "../assets/picture-placeholder.png";
import arrowIcon from "../assets/arow.png";
import "../styles/DynamicPost.css";

const SimpleSubHeader = () => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  const handleBackToTopics = () => {
    navigate("/topics");
  };

  return (
    <div className="row">
      <div className="col-md-12" style={{ color: "#243d54" }}>
        <button
          onClick={handleBackToTopics}
          className="btn btn-link"
          style={{ padding: "10px", marginTop: "3px" }}
        >
          &larr; {t("Back to topics")}
        </button>
      </div>
    </div>
  );
};

const DynamicPost = ({ category, permalinkOverride }) => {
  const { permalink: urlPermalink } = useParams();
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const navigate = useNavigate();
  const permalink = permalinkOverride || urlPermalink;

  // Access the `posts` array directly from the imported `postData`
  const data = postData.posts;

  // Debugging: log the current language
  console.log("Current language:", currentLanguage);

  // Find the post using the permalink
  const post = data.find((post) => post.permalink === `/post/${permalink}`);

  // State to manage which section is currently open
  const [openSection, setOpenSection] = useState(null);

  // Re-render whenever currentLanguage changes
  useEffect(() => {
    console.log("Language change detected, re-rendering component");
    if (post && post[currentLanguage]?.sections) {
      setOpenSection(post[currentLanguage].sections[0]?.id || null);
    } else if (post && post["en"]?.sections) {
      setOpenSection(post["en"].sections[0]?.id || null);
    }
  }, [currentLanguage, post]);

  if (!post) {
    console.warn("Post not found for permalink:", `/post/${permalink}`);
    return <NotFound />;
  }

  // Retrieve the correct language content or fallback to English
  const postContent = post[currentLanguage] || post["en"];
  console.log("Post content being used:", postContent);

  // Deconstruct the properties from postContent
  const { img, date, title, content, sections } = postContent;

  const handleSectionClick = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  /**
   * Helper function to parse content lines and render appropriate HTML elements.
   * Supports:
   * - Headings starting with "## " as <h3>
   * - Bullet lists starting with "- " as <ul><li>
   * - Paragraphs as <p>
   */
  const renderContent = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let listItems = [];

    lines.forEach((line, index) => {
      if (line.startsWith("## ")) {
        // If there are pending list items, flush them as a <ul>
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="content-list">
              {listItems.map((item, idx) => (
                <li key={`li-${idx}`}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
        }

        // Render as h3
        elements.push(
          <h3 key={`h3-${index}`} className="content-heading">
            {line.replace("## ", "")}
          </h3>
        );
      } else if (line.startsWith("- ")) {
        // Collect list items
        listItems.push(line.replace("- ", ""));
      } else if (line.trim() === "") {
        // Ignore empty lines or you can choose to add <br /> if needed
        // If there are pending list items, flush them as a <ul>
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="content-list">
              {listItems.map((item, idx) => (
                <li key={`li-${idx}`}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
        }
      } else {
        // If there are pending list items, flush them as a <ul>
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="content-list">
              {listItems.map((item, idx) => (
                <li key={`li-${idx}`}>{item}</li>
              ))}
            </ul>
          );
          listItems = [];
        }

        // Render as paragraph
        elements.push(<p key={`p-${index}`}>{line}</p>);
      }
    });

    // After processing all lines, check if there are remaining list items
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-final`} className="content-list">
          {listItems.map((item, idx) => (
            <li key={`li-final-${idx}`}>{item}</li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <>
      <main>
        <SimpleSubHeader />
        <section className="container page-detail" id="event-page">
          {title && <p className="event-title">{title}</p>}
          <div className="rectangle"></div>
          {date && <p className="event-date">{date}</p>}
          <div className="row">
            <div className="col-sm-12">
              <div className="event-card-image-container">
                <img
                  src={img ? `${BASE_URL}${img}` : picPlaceholder}
                  alt={img}
                  className="event-image-big"
                />
              </div>
              <div className="mt-4"></div>
              {content && (
                <div className="excerpt-text-container">
                  <div className="excerpt-text">
                    {renderContent(content)}
                  </div>
                </div>
              )}
              {sections && (
                <div className="row" style={{ marginTop: "100px" }}>
                  <div className="col-sm-3">
                    <div className="sticky-top">
                      <h2>{t("summary")}</h2>
                      <ul className="list-group" id="navbar-summary">
                        {sections.map((section) => (
                          <li
                            key={section.id}
                            className={`list-group-item ${
                              openSection === section.id ? "open" : ""
                            }`}
                          >
                            <a
                              href={`#${section.id}`}
                              onClick={() => handleSectionClick(section.id)}
                            >
                              {section.title}
                              <span className="indicator">
                                <img
                                  src={arrowIcon}
                                  alt="indicator"
                                  className={
                                    openSection === section.id ? "open" : ""
                                  }
                                />
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div
                    className="col-sm-9"
                    data-spy="scroll"
                    data-target="#navbar-summary"
                  >
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="bl"
                        id={section.id}
                        style={{
                          display:
                            openSection === section.id ? "block" : "none",
                        }}
                      >
                        <h2>{section.title}</h2>
                        {section.content &&
                          renderContent(section.content)}
                        {section.image && (
                          <img
                            src={section.image}
                            className="alignnone size-medium wp-image-6034"
                            alt=""
                            width="800"
                            height="354"
                          />
                        )}
                        {section.documents && (
                          <div>
                            <ul>
                              {section.documents.map((document, index) => (
                                <li key={index} className="document-item">
                                  <a
                                    href={`${BASE_URL}${document.link}`}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    className="document-title"
                                  >
                                    {document.title} &rarr;
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default DynamicPost;
