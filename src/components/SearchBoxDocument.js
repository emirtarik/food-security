import React from "react";
import StaticFilterOptions from "./StaticFilterOptions";

export function extractCountries(data) {
  const countriesArray = [];
  data.forEach((item) => {
    const countriesString = item.content?.Countries || "";
    const countriesList = countriesString.split(",");

    countriesList.forEach((country) => {
      const trimmedCountry = country.trim();
      if (trimmedCountry) {
        countriesArray.push(trimmedCountry);
      }
    });
  });
  return [...new Set(countriesArray)]; // Remove duplicates
}

export function extractThemes(data) {
  const themesArray = [];
  data.forEach((item) => {
    const themesString = item.content?.Themes || "";
    const themesList = themesString.split(",");

    themesList.forEach((theme) => {
      const trimmedTheme = theme.trim();
      if (trimmedTheme) {
        themesArray.push(trimmedTheme);
      }
    });
  });
  return [...new Set(themesArray)]; // Remove duplicates
}

export function extractScales(data) {
  const scalesArray = [];
  data.forEach((item) => {
    const scalesString = item.content?.Scale || "";
    const scalesList = scalesString.split(",");

    scalesList.forEach((scale) => {
      const trimmedScale = scale.trim();
      if (trimmedScale) {
        scalesArray.push(trimmedScale);
      }
    });
  });
  return [...new Set(scalesArray)]; // Remove duplicates
}

export function extractLangs(data) {
  const langsArray = [];
  data.forEach((item) => {
    const langsString = item.content?.Langs || "";
    const langsList = langsString.split(",");

    langsList.forEach((lang) => {
      const trimmedLang = lang.trim();
      if (trimmedLang) {
        langsArray.push(trimmedLang);
      }
    });
  });
  return [...new Set(langsArray)]; // Remove duplicates
}

const SearchBoxDocument = ({
  jsonData,
  selectedLocations,
  setSelectedLocations,
  selectedThemes,
  setSelectedThemes,
  selectedScales,
  setSelectedScales,
  selectedLangs,
  setSelectedLangs,
}) => {
  const countries = extractCountries(jsonData);
  const themes = extractThemes(jsonData);
  const scales = extractScales(jsonData);
  const langs = extractLangs(jsonData);

  return (
    <div className="search-container">
      <div>
        <div className="row" style={{ gap: '1rem', marginLeft: "0px", marginTop: "20px" }}>
          <div>
            <StaticFilterOptions
              title="Location"
              options={countries}
              selectedOptions={selectedLocations}
              setSelectedOptions={setSelectedLocations}
            />
          </div>
          <div>
            <StaticFilterOptions
              title="Theme"
              options={themes}
              selectedOptions={selectedThemes}
              setSelectedOptions={setSelectedThemes}
            />
          </div>
          <div>
            <StaticFilterOptions
              title="Scale"
              options={scales}
              selectedOptions={selectedScales}
              setSelectedOptions={setSelectedScales}
            />
          </div>
          <div>
            <StaticFilterOptions
              title="Languages"
              options={langs}
              selectedOptions={selectedLangs}
              setSelectedOptions={setSelectedLangs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBoxDocument;
