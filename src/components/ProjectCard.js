import React from 'react';
import picPlaceholder from '../assets/picture-placeholder.png';
import { BASE_URL } from './constant';
import '../styles/ProjectCard.css';

const ProjectCard = ({ project }) => {
  if (!project) {
    return null;
  }

  // Handle potential BOM character in donor key and provide defaults
  const donor = project['\uFEFFdonor'] || project.donor || "N/A";
  const {
    title = "No Title Available",
    status = "N/A",
    recipient = "N/A",
    fundingAgency = "N/A",
    img,
    start = "",
    end = "",
    budgetUSD,
    comments = "",
    link
  } = project;

  const imageUrl = img ? `${BASE_URL}${img}` : picPlaceholder;

  const formattedBudget = budgetUSD ?
    `$${parseInt(budgetUSD).toLocaleString()} USD` : "N/A";

  const displayComments = comments && comments.length > 100 ? `${comments.substring(0, 100)}...` : comments;

  const cardContent = (
    <>
      <div className={`project-card-image-container ${!img ? 'no-image-fallback' : ''}`}>
        {img ? (
          <img src={imageUrl} alt={title} className="project-image" />
        ) : (
          <span className="project-image-placeholder-text">No Image Available</span>
        )}
      </div>
      <div className="project-card-content">
        <h3 className="project-title">{title}</h3>

        <p className="project-meta-item"><strong>Donor:</strong> {donor}</p>
        <p className="project-meta-item"><strong>Status:</strong> {status}</p>
        <p className="project-meta-item"><strong>Recipient:</strong> {recipient}</p>
        <p className="project-meta-item"><strong>Funding Agency:</strong> {fundingAgency}</p>

        {(start || end) && (
          <p className="project-duration">
            <strong>Duration:</strong> {start || "N/A"} - {end || "N/A"}
          </p>
        )}

        <p className="project-budget"><strong>Budget:</strong> {formattedBudget}</p>

        {displayComments && (
          <p className="project-comments" title={comments}>
            <strong>Comments:</strong> {displayComments}
          </p>
        )}

        <div className="project-card-footer">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="project-learn-more">
              Learn More
            </a>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="project-card">
      {cardContent}
    </div>
  );
};

export default ProjectCard;
