import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import postData from '../data/postData.json';
import NotFound from "../pages/NotFound";
import { BASE_URL } from "../components/constant";
import { useTranslationHook } from "../i18n";
import picPlaceholder from "../assets/picture-placeholder.png";
import arrowIcon from "../assets/arow.png";
import "../styles/DynamicPost.css";
import { marked } from 'marked';
import { fetchAndConvertMarkdown, fixFileLinks } from '../utils/markdown';

const SimpleSubHeader = () => {
  const { t } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  // Navigate to topics page
  const handleBackToTopics = () => {
    navigate("/topics");
  };

  // Navigate to archive page
  const handleBackToArchive = () => {
    navigate("/resources/archive");
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#243d54', // blue background
        padding: '10px'
      }}
    >
      <button
        onClick={handleBackToTopics}
        className="btn btn-link"
        style={{ color: "#fff" }}  // white text for contrast
      >
        &larr; {t("Back to topics")}
      </button>
      <button
        onClick={handleBackToArchive}
        className="btn btn-link"
        style={{ color: "#fff" }}  // white text for contrast
      >
        {t("More in Archive")} &rarr;
      </button>
    </div>
  );
};

const DynamicPost = ({ category, permalinkOverride }) => {
  const { permalink: urlPermalink } = useParams();
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const permalink = permalinkOverride || urlPermalink;

  // Retrieve the post data
  const data = postData.posts;
  const post = data.find((p) => p.permalink === `/post/${permalink}`);
  // Derive postContent only if the post is valid.
  const postContent = post ? (post[currentLanguage] || post["en"]) : null;

  // Initialize state hooks unconditionally.
  const [openSection, setOpenSection] = useState(null);
  const [postHtml, setPostHtml] = useState(null);
  const [sectionHtml, setSectionHtml] = useState({});

  // Set the initial open section when postContent is available.
  useEffect(() => {
    if (postContent && postContent.sections && postContent.sections.length > 0) {
      setOpenSection(postContent.sections[0].id || null);
    }
  }, [currentLanguage, postContent]);

  // Load and process post content (Markdown conversion or plain HTML)
  useEffect(() => {
    const loadContent = async () => {
      if (!postContent) return;
      if (postContent.isMarkdown) {
        if (postContent.markdownPath) {
          const html = await fetchAndConvertMarkdown(postContent.markdownPath);
          setPostHtml(html);
        } else {
          const html = marked(postContent.content || '');
          setPostHtml(fixFileLinks(html));
        }
      } else {
        setPostHtml(fixFileLinks(postContent.content));
      }
    };
    loadContent();
  }, [postContent]);

  // Load and process section content when available.
  useEffect(() => {
    const loadSections = async () => {
      if (!postContent || !postContent.sections) return;
      const updates = {};
      for (const section of postContent.sections) {
        if (postContent.isMarkdown && section.isMarkdown) {
          if (section.markdownPath) {
            updates[section.id] = await fetchAndConvertMarkdown(section.markdownPath);
          } else {
            const html = marked(section.content || '');
            updates[section.id] = fixFileLinks(html);
          }
        } else {
          updates[section.id] = fixFileLinks(section.content);
        }
      }
      setSectionHtml(updates);
    };
    loadSections();
  }, [postContent]);

  // If there's no post, render NotFound after the hooks have been defined.
  if (!post) {
    console.warn("Post not found for permalink:", `/post/${permalink}`);
    return <NotFound />;
  }

  const { img, flag, date, title, sections } = postContent;

  // Handler to toggle section display
  const handleSectionClick = (sectionId) => {
    setOpenSection(prev => (prev === sectionId ? null : sectionId));
  };

  return (
    <main>
      <SimpleSubHeader />
      <section className="container page-detail" id="event-page">
        {title && <p className="event-title">{title}</p>}
        <div className="rectangle"></div>
        {date && <p className="event-date">{date}</p>}
        <div className="row">
          <div className="col-sm-12">
            <div className="post-wrapper">
              <div className="post-image-container">
                <img
                  src={img ? `${BASE_URL}${img}` : picPlaceholder}
                  alt={title}
                  className="post-image"
                />
              </div>
              {postHtml && (
                <div
                  className="post-content post-html-content"
                  dangerouslySetInnerHTML={{ __html: postHtml }}
                />
              )}
            </div>
            {sections && sections.length > 0 && (
              <div className="row" style={{ marginTop: "100px" }}>
                <div className="col-sm-3">
                  <div className="sticky-top">
                    <h2>{t("summary")}</h2>
                    <ul className="list-group" id="navbar-summary">
                      {sections.map((section) => (
                        <li
                          key={section.id}
                          className={`list-group-item ${openSection === section.id ? "open" : ""}`}
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
                                className={openSection === section.id ? "open" : ""}
                              />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-sm-9" data-spy="scroll" data-target="#navbar-summary">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="bl"
                      id={section.id}
                      style={{ display: openSection === section.id ? "block" : "none" }}
                    >
                      <h2>{section.title}</h2>
                      {sectionHtml[section.id] && (
                        <div
                          className="section-content post-html-content"
                          dangerouslySetInnerHTML={{ __html: sectionHtml[section.id] }}
                        />
                      )}
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
                                  href={`{document.link}`}
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
      {flag && (
        <div className="post-flag-logo" style={{ textAlign: "center", marginTop: "40px" }}>
          <img
            src={`${BASE_URL}${flag}`}
            alt="Flag logo"
            className="flag-logo"
          />
        </div>
      )}
    </main>
  );
};

export default DynamicPost;