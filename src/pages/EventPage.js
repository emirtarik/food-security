import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventPageData from '../data/eventPageData.json';
import NotFound from "./NotFound";
import Header from "./Header";
import Footer from "./Footer";
import ICalendarLink from "react-icalendar-link";
import { BASE_URL } from "../components/constant";
import { useTranslationHook } from "../i18n";
import picPlaceholder from "../assets/picture-placeholder.png";
import arrowIcon from "../assets/arow.png";
import "../styles/EventPage.css";

const SimpleSubHeader = () => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const navigate = useNavigate();

  return (
    <div className="row">
      <div className="col-md-12" style={{ color: "#243d54" }}>
        <button onClick={() => navigate('/event-and-opportunities/event?search=')} className="btn btn-link" style={{ padding: "10px", marginTop: "3px"}}>
          &larr; {t("Back to events")}
        </button>
      </div>
    </div>
  );
};

const EventCardPage = ({ event }) => {
  const { t, currentLanguage } = useTranslationHook(["misc"]);

  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  const eventData = event[currentLanguage] || event["en"]; // Fallback to English if current language data is unavailable

  return (
    <div className="event-card new-style">
      <div className="event-card-image-container" style={{ padding: "20px" }}>
        <img
          src={eventData.img ? `${BASE_URL}${eventData.img}` : picPlaceholder}
          alt={eventData.title}
          className="event-image-big"
        />
      </div>
      <div className="event-card-content new-style-content">
        <p className="event-date">
          {t("from")} {event.date_start} {t("to")} {event.date_end}
        </p>
        <h3 className="event-place">
          {eventData.place} {/* <br /> {eventData.type} */}
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
        </div>
      </div>
    </div>
  );
};

const EventPage = ({ category, permalinkOverride }) => {
  const { permalink: urlPermalink } = useParams();
  const { t, currentLanguage } = useTranslationHook(["misc"]);
  const permalink = permalinkOverride || urlPermalink;

  // Access the events array directly from the imported eventPageData
  const data = eventPageData;

  // Find the event using the permalink
  const event = data.find((event) => event.permalink === permalink);

  // State to manage which section is currently open
  const [openSection, setOpenSection] = useState(
    event?.sections ? event.sections[0]?.id : null
  );

  // Re-render whenever currentLanguage changes
  useEffect(() => {
    console.log("Language change detected, re-rendering component");
  }, [currentLanguage]);

  if (!event) {
    console.warn("Event not found for permalink:", permalink);
    return <NotFound />;
  }

  // Retrieve the correct language content or fallback to English
  const eventData = event[currentLanguage] || event["en"];
  console.log("Event data being used:", eventData);

  // Deconstruct the properties from eventData
  const { img, place, title, type, excerpt, sections } = eventData;
  const { date_start, date_end } = event;

  const handleSectionClick = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  return (
    <main>
      <Header />
      <SimpleSubHeader />
      <section className="container page-detail" id="event-page">
        {type && <p className="type">{type}</p>}
        <div className="rectangle"></div>
        {date_start && date_end && <p className="date"> {t("from")} {date_start} {t("to")} {date_end}</p>}
        <div className="row">
          <div className="col-sm-12">
            <EventCardPage event={event} /> {/* Pass event as prop */}
            <div className="mt-4"></div>
            {place && <p className="place" style={{marginTop: "100px"}}>{place}</p>}
            {excerpt && (
              <div className="excerpt-text" style={{marginTop: "30px"}}>
                {excerpt.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
              </div>
            )}
            {sections && (
                <div className="row" style={{ marginTop: "100px" }}>
                  <div className="col-sm-3">
                    <div className="sticky-top">
                      <h2>{t("summary")}</h2>
                      <ul className="list-group" id="navbar-summary">
                        {sections.map((section) => (
                          <li key={section.id} className={`list-group-item ${openSection === section.id ? "open" : ""}`}>
                            <a href={`#${section.id}`} onClick={() => handleSectionClick(section.id)}>
                              {section.title}
                              <span className="indicator">
                                <img src={arrowIcon} alt="indicator" className={openSection === section.id ? "open" : ""} />
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
                      <div key={section.id} className="bl" id={section.id} style={{ display: openSection === section.id ? 'block' : 'none' }}>
                        <h2>{section.title}</h2>
                        {section.content &&
                          section.content
                            .split("\n")
                            .map((line, index) => <p key={index}>{line}</p>)}
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
                                <p className="document-author">{document.author}</p>
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
      <Footer />
    </main>
  );
};

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

export default EventPage;
