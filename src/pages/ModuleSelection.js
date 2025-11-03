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
      <h2>Séléctionnez le module C-GOVSAN</h2>
      <div className="module-buttons">
        <button onClick={handleModule1Click} className="module-button">
          Module 1 : Instrument d'analyse de la capacité de prévention et de gestion des crises alimentaires et nutritionnelles
        </button>
        <button onClick={handleModule2Click} className="module-button">
          Module 2 : Suivi de la performance de la réponse aux crises alimentaires
        </button>
      </div>
      {/* Display role and country for verification during development if needed */}
      {/* <p>Role: {role}, Country: {country}</p> */}
    </div>
  );
}

export default ModuleSelection;
