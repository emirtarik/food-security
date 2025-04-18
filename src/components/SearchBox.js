// src/components/SearchBox.js

import React, { useState, useEffect } from "react";
import { useTranslationHook } from "../i18n";

const SearchBox = ({ searchQuery, setSearchQuery }) => {
  const { t } = useTranslationHook("misc");
  
  // Local state for the input field
  const [inputValue, setInputValue] = useState(searchQuery);

  // If parent searchQuery changes, update the local state.
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // When form is submitted, update parent's searchQuery.
  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(inputValue);
  };

  // Reset both local and parent state.
  const handleReset = (e) => {
    e.preventDefault();
    setInputValue("");
    setSearchQuery("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          id="keyword"
          placeholder={t("search")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="input-group-append">
          <button type="submit" className="btn btn-primary">
            {t("search")}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            {t("reset")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBox;