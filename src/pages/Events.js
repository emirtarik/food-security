import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import Header from "./Header";
import SubHeader from "./SubHeader";
import Footer from "./Footer";
import eventPageData from "../data/eventPageData.json";
import ICalendarLink from "react-icalendar-link";
import { BASE_URL } from "../components/constant";
import { useTranslationHook } from "../i18n";
import { InfoHeader } from "./SubHeader";
import picPlaceholder from "../assets/picture-placeholder.png";
import moment from 'moment';
import "../styles/Events.css";

const UpcomingEventCard = ({ event }) => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);

  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  const eventData = event[currentLanguage];

  return (
    <div className="event-card new-style" style={{ margin: "50px" }}>
      <div className="event-card-image-container" style={{ padding: "20px" }}>
        <img
          src={eventData.img ? `${BASE_URL}${eventData.img}` : picPlaceholder}
          alt={eventData.title}
          className="event-image-big"
        />
      </div>
      <div
        className="event-card-content new-style-content"
        role="button"
        onClick={() => window.location.href = `/event-and-opportunities/event/${event.year}/${event.permalink}`}
        style={{ cursor: 'pointer' }}
      >
        <p className="event-date">
          {t("from")} {event.date_start} {t("to")} {event.date_end}
        </p>
        <h3 className="event-place">
          {eventData.place} <br /> {eventData.type}
        </h3>
        <div className="rectangle-long"></div>
        <p className="event-title">{eventData.title}</p>
        <div className="event-actions">
          <ICalendarLink
            event={{
              title: eventData.title,
              startTime: formatDateForICal(event.date_start),
              endTime: formatDateForICal(event.date_end),
              description: eventData.excerpt,
              location: eventData.place,
              url: event.permalink,
            }}
            className="btn btn-white"
          >
            {t("Ical")}
          </ICalendarLink>
          <a href={`/event-and-opportunities/event/${event.year}/${event.permalink}`} className="more">
            {t("more")} <span className="more-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
  
};

const EventCard = ({ event }) => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);

  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  const eventData = event[currentLanguage];

  return (
    <div className="event-card past-event-card">
      <a href={`/event-and-opportunities/event/${event.year}/${event.permalink}`} className="event-card-link">
        <div className="event-card-image-container-mini">
          <img
            className="event-image-mini"
            src={eventData.img ? `${BASE_URL}${eventData.img}` : picPlaceholder}
            alt={eventData.title}
          />
          <div className="event-hover-content-mini">
            <p className="event-date-mini">
              {t("from")} {event.date_start} {t("to")} {event.date_end}
            </p>
            <h3 className="event-place-mini">
              {eventData.place} <br /> {eventData.type}
            </h3>
            <div className="rectangle-long-mini"></div>
            <p className="event-title-mini">{eventData.title}</p>
          </div>
        </div>
      </a>
      <div className="event-card-footer">
        <a href={`/event-and-opportunities/event/${event.year}/${event.permalink}`} className="past-more">
          {t("more2")} <span className="more-arrow">→</span>
        </a>
      </div>
    </div>
  );
};




export const Events = ({ data, searchQuery, showICalendarLink, showMoreLink }) => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);

  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  const currentDate = moment(); // Current date and time
  const filteredDocuments = data.filter((result) => {
    if (!searchQuery || searchQuery.trim() === "") {
      return true; // Include all documents
    }
    return result.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const upcomingEvents = data.filter(event => moment(formatDateForICal(event.date_start)).isAfter(currentDate));
  const pastEvents = data.filter(event => moment(formatDateForICal(event.date_start)).isBefore(currentDate));

  return (
    <section id="calendar-results" className="container pb-5">
      {/* Upcoming Events */}
      <div className="event-section">
        <h2 className="upcoming-events">{t("UpcomingEvents")}</h2>
        <div className="rectangle"></div>
        <div className="new-event-grid">
        {upcomingEvents.map((event) => (
          <UpcomingEventCard key={event.ID} event={event} />
        ))}
        </div>
      </div>
  
      {/* Past Events */}
      <div className="event-section">
        <h2 className="past-events">{t("PastEvents")}</h2>
        <div className="rectangle" style={{ marginBottom: '70px' }} ></div>
        <div className="event-grid">
          {pastEvents.map((event) => (
            <EventCard key={event.ID} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default function EventsSection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [availableYears, setAvailableYears] = useState([]);
  function updateURL() {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", searchQuery);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  } 

  useEffect(() => {
    const years = new Set(eventPageData.map(event => formatDateForICal(event.date_start).substring(0, 4)));
    setAvailableYears([...years]);
    updateURL();
  }, [searchQuery]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const path = useLocation().pathname;
  const { IntroElement, DescriptionElement } = InfoHeader(path);

  const filteredEvents = selectedYear === "All Years" ? 
    eventPageData : 
    eventPageData.filter(event => formatDateForICal(event.date_start).substring(0, 4) === selectedYear);

  return (
    <div>
      <Header />
      <SubHeader />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginTop: '20px' }}>
        <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <select onChange={(e) => handleYearChange(e.target.value)} value={selectedYear} style={{ marginTop: '10px' }}>
          <option value="All Years">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <Events
        data={filteredEvents}
        searchQuery={searchQuery}
        showICalendarLink={true}
        showMoreLink={true}
      />
      <Footer />
    </div>
  );
}

export function formatDateForICal(date) {
  const parts = date.split("/");
  if (parts.length === 3) {
    const year = parts[2];
    const month = parts[1];
    const day = parts[0];
    return `20${year}-${month}-${day}`;
  }
  return "";
}

export function formatMonth(dateString) {
  const datedisplay = new Date(dateString);
  const options = { month: "long", locale: "en-US" };
  return datedisplay.toLocaleDateString(undefined, options);
}
