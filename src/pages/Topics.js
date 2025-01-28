import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import topicsData from "../data/topicsData.json";
import postData from "../data/postData.json";
import { BASE_URL } from "../components/constant.js";
import DynamicPost from "../components/DynamicPost.js";
import "../styles/Topics.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import IconBreadcrumbsWrapper from "../components/IconBreadcrumbs";
import { useLocation } from "react-router-dom";
import { InfoHeader } from "./SubHeader";
import { useTranslationHook } from "../i18n";

export const Topics = ({ results, onPostSelect }) => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  // Re-render whenever `currentLanguage` changes
  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  return (
    <section id="doc-results" className="container list-articles">
      {results.length > 0 && (
        <div className="row">
          {results.map((result) => {
            const topicContent = result[currentLanguage] || result["en"];
            const { img, title, permalink } = topicContent;
            return (
              <div key={result.id} className="list-articles col-md-4">
                <article className="nopad mb-3">
                  <div className="thumb">
                    <img
                      src={`${BASE_URL}${img.medium}`}
                      alt={title}
                      className="img-fluid"
                    />
                    <div className="screen">
                      <p className="text-left">{title}</p>
                      <a
                        href={`#`}
                        onClick={(e) => {
                          e.preventDefault();
                          onPostSelect(permalink);
                          navigate(permalink);
                        }}
                      >
                        <ArrowForwardIcon sx={{ fontSize: 40 }} />
                      </a>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default function TopicList() {
  const path = useLocation().pathname;
  const { IntroElement, DescriptionElement } = InfoHeader(path);
  const { t, currentLanguage } = useTranslationHook(["misc"]);

  // State for the selected permalink, initially set to null
  const [selectedPermalink, setSelectedPermalink] = useState(null);

  // Re-render whenever `currentLanguage` changes
  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  // This function updates the permalink state
  const handlePostSelect = (permalink) => {
    setSelectedPermalink(permalink);
  };

  return (
    <div>
      <Header />
      <IconBreadcrumbsWrapper routeTitle={"Topics"} />
      <div className="row">
        <div className="col-md-12" style={{ color: "#243d54" }}>
          {IntroElement}
          {DescriptionElement}
        </div>
      </div>

      {/* The regular list of topics */}
      <Topics results={topicsData} onPostSelect={handlePostSelect} />

      {/* Conditional DynamicPost usage */}
      {selectedPermalink && (
        <DynamicPost
          data={postData.posts} // Ensure it's an array
          category="topics"
          permalinkOverride={selectedPermalink}
        />
      )}

      <Footer />
    </div>
  );
}
