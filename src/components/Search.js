import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchBox from "./SearchBox";
import SearchBoxLocation from "./SearchBoxLocation";
import SearchBoxPartner from "./SearchBoxPartner";
import SearchBoxStatus from "./SearchBoxStatus";
import SearchBoxTopic from "./SearchBoxTopic";
import SearchBoxTarget from "./SearchBoxTarget";
import SearchBoxProjectTypes from "./SearchBoxProjectType";
import "../styles/Search.css";

const Search = ({
  searchQuery,
  setSearchQuery,
  selectedPartner,
  setSelectedPartner,
  selectedLocations,
  setSelectedLocations,
  selectedStatus,
  setSelectedStatus,
  selectedTopics,
  setSelectedTopics,
  selectedTargets,
  setSelectedTargets,
  selectedProjectTypes,
  setselectedProjectTypes,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const updateURL = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", searchQuery);
    searchParams.set("Partner", selectedPartner.join(","));
    searchParams.set("Locations", selectedLocations.join(","));
    searchParams.set("Status", selectedStatus.join(","));
    searchParams.set("Topics", selectedTopics.join(","));
    searchParams.set("Targets", selectedTargets.join(","));
    searchParams.set("ProjectTypes", selectedProjectTypes.join(","));

    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  useEffect(() => {
    // Call the updateURL function whenever filters change
    updateURL();
  }, [
    searchQuery,
    selectedPartner,
    selectedLocations,
    selectedStatus,
    selectedTopics,
    selectedTargets,
    selectedProjectTypes,
  ]);

  return (
    <div>
      <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <p></p>
      <div className="search-container">
        <div className="col-lg-10">
          <div className="row">
            <div className="col-md-4 col-xl">
              <SearchBoxLocation
                className="form-control select-filter"
                selectedLocations={selectedLocations}
                setSelectedLocations={setSelectedLocations}
              />
            </div>
            <div className="col-md-4 col-xl">
              <SearchBoxPartner
                className="form-control select-filter"
                selectedPartner={selectedPartner}
                setSelectedPartner={setSelectedPartner}
              />
            </div>
            <div className="col-md-4 col-xl">
              <SearchBoxStatus
                className="form-control select-filter"
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
            </div>
            <div className="col-md-4 col-xl">
              <SearchBoxTopic
                className="form-control select-filter"
                selectedTopics={selectedTopics}
                setSelectedTopics={setSelectedTopics}
              />
            </div>
            <div className="col-md-4 col-xl">
              <SearchBoxTarget
                className="form-control select-filter"
                selectedTargets={selectedTargets}
                setSelectedTargets={setSelectedTargets}
              />
            </div>
            <div className="col-md-4 col-xl">
              <SearchBoxProjectTypes
                className="form-control select-filter"
                selectedProjectTypes={selectedProjectTypes}
                setselectedProjectTypes={setselectedProjectTypes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
