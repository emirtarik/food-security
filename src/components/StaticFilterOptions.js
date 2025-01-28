import React, { useState } from "react";
import PropTypes from "prop-types";
import "../styles/StaticFilterOptions.css";
import Downshift from "downshift";
import { useTranslationHook } from "../i18n";

const StaticFilterOptions = ({
  title,
  options,
  selectedOptions,
  setSelectedOptions,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  const handleSelection = (selectedItem) => {
    if (!selectedItem) return;

    setSelectedOptions((prevSelectedOptions) => {
      if (prevSelectedOptions.includes(selectedItem)) {
        return prevSelectedOptions.filter((option) => option !== selectedItem);
      } else {
        return [...prevSelectedOptions, selectedItem];
      }
    });
    setInputValue(""); // Clear the input value when an item is selected
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const filteredOptions = options.filter(
    (option) =>
      !selectedOptions.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelectAll = () => {
    const allOptions = options.filter(
      (option) => !selectedOptions.includes(option)
    );
    setSelectedOptions([...selectedOptions, ...allOptions]);
  };

  const handleClearAll = () => {
    setSelectedOptions([]);
  };

  return (
    <div className="search-dropdown">
      <Downshift
        inputValue={inputValue}
        onChange={(selection) => handleSelection(selection)}
        selectedItem={null}
        itemToString={(item) => (item ? item : "")}
        isOpen={isMenuOpen}
        onOuterClick={() => setIsMenuOpen(false)}
      >
        {({
          getInputProps,
          getToggleButtonProps,
          getMenuProps,
          getItemProps,
          isOpen,
          inputValue,
          highlightedIndex,
          toggleMenu,
        }) => (
          <div>
            <input
              {...getInputProps({
                placeholder:
                  selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : `${title}`,
                onChange: handleInputChange,
              })}
              className="form-control"
              onClick={() => {
                toggleMenu();
                setIsMenuOpen(!isMenuOpen);
              }}
            />
            {isOpen ? (
              <div className="dropdown-menu form-control" {...getMenuProps()}>
                <div
                  className="select-all-button"
                  onClick={() => handleSelectAll()}
                >{t("Select all")}</div>
                <div
                  className="clear-all-button"
                  onClick={() => handleClearAll()}
                >{t("Clear all")}</div>
                {filteredOptions.map((item, index) => (
                  <div
                    key={item}
                    {...getItemProps({
                      index,
                      item,
                      style: {
                        backgroundColor:
                          highlightedIndex === index ? "#bde4ff" : "white",
                      },
                    })}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Downshift>
    </div>
  );
};

StaticFilterOptions.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelectedOptions: PropTypes.func.isRequired,
};

export default StaticFilterOptions;
