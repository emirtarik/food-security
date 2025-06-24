import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ModuleSelection.css'; // We'll create this CSS file next

function ModuleSelection({ role, country }) {
  const navigate = useNavigate();

  const handleModule1Click = () => {
    // Navigate to Questionnaire.js, passing role and country
    // The role from props should be 'master'
    navigate(`/questionnaire/${role}`, { state: { role, country } });
  };

  const handleModule2Click = () => {
    // Navigate to Dashboard2.js, passing role and country
    navigate('/dashboard2', { state: { role, country } });
  };

  return (
    <div className="module-selection-container">
      <h2>Select C-GOVSAN Module</h2>
      <div className="module-buttons">
        <button onClick={handleModule1Click} className="module-button">
          C-GOVSAN Module 1
        </button>
        <button onClick={handleModule2Click} className="module-button">
          C-GOVSAN Module 2
        </button>
      </div>
      {/* Display role and country for verification during development if needed */}
      {/* <p>Role: {role}, Country: {country}</p> */}
    </div>
  );
}

export default ModuleSelection;
