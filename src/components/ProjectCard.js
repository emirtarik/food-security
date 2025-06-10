import React from 'react';
import picPlaceholder from '../assets/picture-placeholder.png'; // Adjust path if necessary
import { BASE_URL } from './constant'; // Assuming this is the correct path
import '../styles/ProjectCard.css'; // Will be created

const ProjectCard = ({ project }) => {
  if (!project) {
    return null; // Or some fallback UI
  }

  const {
    title = "No Title",
    status = "No Status",
    recipient = "No Recipient",
    fundingAgency = "No Funding Agency",
    img
  } = project;

  const imageUrl = img ? `${BASE_URL}${img}` : picPlaceholder;

  return (
    <div className="project-card">
      <div className="project-card-image-container">
        <img src={imageUrl} alt={title} className="project-image" />
      </div>
      <div className="project-card-content">
        <h3 className="project-title">{title}</h3>
        <p className="project-status">Status: {status}</p>
        <p className="project-recipient">Recipient: {recipient}</p>
        <p className="project-funding-agency">Funding Agency: {fundingAgency}</p>
      </div>
    </div>
  );
};

export default ProjectCard;
