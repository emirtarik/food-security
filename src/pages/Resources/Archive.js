// src/pages/Resources/Archive.js

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import SubHeader from "../SubHeader";
import SearchBox from "../../components/SearchBox";
import postData from "../../data/postData.json";
import { useTranslationHook } from "../../i18n";
import arrow from "../../assets/arow.png";
import "../../styles/Archive.css";

const ArchiveSection = ({ posts, searchQuery }) => {
  const { t } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  // Filter posts for the search results section.
  const filteredPosts = posts.filter((post) => {
    const title = post.en?.title || "";
    const date = post.en?.date || "";
    return (
      searchQuery &&
      (title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Group all posts by year.
  const postsByYear = {};
  posts.forEach((post) => {
    const year = new Date(post.en.date).getFullYear();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  });

  // Get a sorted list of years in descending order.
  const years = Object.keys(postsByYear).sort((a, b) => b - a);

  // State to handle the expansion of each year group (default is collapsed).
  const [expandedYears, setExpandedYears] = useState({});

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const handlePostClick = (post) => {
    navigate(post.permalink);
  };

  return (
    <section className="archive-section container pb-5">
      <header className="archive-header text-center">
        <h2 className="archive-title">{t("Archive")}</h2>
      </header>

      {/* Display search results when a search query is active */}
      {searchQuery && (
        <div className="search-results">
          <h3 className="text-center my-3">{t("Search results")}</h3>
          <div className="row">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <div
                  key={post.ID}
                  className="col-md-4 archive-item"
                  onClick={() => handlePostClick(post)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="archive-post">
                    <p className="archive-post-date">{post.en.date}</p>
                    <p className="archive-post-title">{post.en.title}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center w-100">{t("No results found")}</p>
            )}
          </div>
        </div>
      )}

      {/* Display grouped posts by year with foldable sections */}
      {years.map((year) => (
        <div key={year} className="year-group my-4">
          <h3
            className="year-title"
            onClick={() => toggleYear(year)}
            style={{ cursor: "pointer" }}
          >
            {year}{" "}
            <img
              src={arrow}
              alt="Toggle arrow"
              className="arrow-icon"
              style={{
                transform: expandedYears[year]
                  ? "rotate(270deg)"
                  : "rotate(180deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </h3>
          {expandedYears[year] && (
            <div className="row">
              {postsByYear[year].map((post) => (
                <div
                  key={post.ID}
                  className="col-md-4 archive-item"
                  onClick={() => handlePostClick(post)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="archive-post">
                    <p className="archive-post-date">{post.en.date}</p>
                    <p className="archive-post-title">{post.en.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default function Archive() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslationHook(["misc"]);
  const [searchQuery, setSearchQuery] = useState("");

  // Update searchQuery state whenever the URL search parameters change.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") || "");
  }, [location.search]);

  // Update the URL when the search text changes.
  const updateSearch = (query) => {
    setSearchQuery(query);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", query);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="archive-page">
      <Header />
      <SubHeader />
      <div className="search-container text-center">
        <SearchBox searchQuery={searchQuery} setSearchQuery={updateSearch} />
      </div>
      <ArchiveSection posts={postData.posts} searchQuery={searchQuery} />
      <Footer />
    </div>
  );
}