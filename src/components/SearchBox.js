import React from "react";
import { useTranslationHook } from "../i18n";


const SearchBox = ({ searchQuery, setSearchQuery }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook('misc');

  return (
    <form>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          id="keyword"
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="input-group-btn">
          <button type="submit" className="btn btn-primary">
          {t("reset")}
          </button>
        </span>
      </div>
    </form>
  );
};

export default SearchBox;
