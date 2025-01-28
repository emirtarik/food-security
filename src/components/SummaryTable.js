import React from 'react';
import '../styles/SummaryTable.css'; // Add some basic CSS for the bars

// Define the order in which sections should appear
const sectionOrder = [
  'Système d\'information et d\'analyse',
  'Programme et plan de réponse SAN',
  'Système de financement de la SAN',
  'Dispositif de gouvernance'
];

// Function to calculate the average score and determine the stage
function calculateStage(avg) {
  if (avg < 1.1) return { label: 'Inexistant', stage: 0 };
  if (avg < 2) return { label: 'Embryonnaire', stage: 1 };
  if (avg < 3) return { label: 'Emergent', stage: 2 };
  if (avg < 4) return { label: 'Consolidé', stage: 3 };
  return { label: 'Mature', stage: 4 };
}

function SummaryTable({ subsectionAverages }) {
  // Logging to check if subsectionAverages are defined
  console.log("Subsection Averages:", subsectionAverages);

  // Mapping for overriding section and subsection titles
  const sectionMapping = {
    'section1': {
      title: 'Système d\'information et d\'analyse',
      subsections: {
        '11': 'Information et analyse sur la situation',
        '12': 'Information et analyse pour élaborer la réponse'
      }
    },
    'section2': {
      title: 'Programme et plan de réponse SAN',
      subsections: {
        '21': 'Programmes SAN et Plan National de Réponse',
        '22': 'Nutrition',
        '23': 'Protection sociale',
        '24': 'Agriculture',
        '25': 'Elevage'
      }
    },
    'section3': {
      title: 'Système de financement de la SAN',
      subsections: {
        '31': 'Politiques et instruments de financement',
        '32': 'Types et disponibilité de financement'
      }
    },
    'section4': {
      title: 'Dispositif de gouvernance',
      subsections: {
        '41': 'Dispositif national de prévention et de gestion',
        '42': 'Coordination et concertation pour la réponse',
        '43': 'Suivi évaluation et redevabilité'
      }
    }
  };

  return (
    <div>
      <table className="summary-table">
        <thead>
          <tr>
            <th className="section">Champs d'analyse</th>
            <th className="sub-section">Section</th>
            <th className="score" colSpan="5">
              <div className="stage-header">
                <div className="stage-header-cell">Inexistant</div>
                <div className="stage-header-cell">Embryonnaire</div>
                <div className="stage-header-cell">Emergent</div>
                <div className="stage-header-cell">Consolidé</div>
                <div className="stage-header-cell">Mature</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sectionOrder.map((sectionName, sIndex) => {
            const sectionKey = Object.keys(sectionMapping).find(key => sectionMapping[key].title === sectionName);
            if (!sectionKey || !subsectionAverages[sectionKey]) return null; // Skip if section key is not found or no data

            const subsections = Object.keys(sectionMapping[sectionKey].subsections);
            return (
              <React.Fragment key={sIndex}>
                {subsections.map((subSectionKey, subIndex) => {
                  const avgScore = subsectionAverages[sectionKey]?.[subSectionKey];
                  if (avgScore === undefined) return null;
                  const { label, stage } = calculateStage(avgScore);

                  return (
                    <tr key={subIndex} className={subIndex === 0 ? 'first-subsection' : ''}>
                      {subIndex === 0 && (
                        <td className="section" rowSpan={subsections.length}>
                          {sectionName}
                        </td>
                      )}
                      <td className="sub-section">{sectionMapping[sectionKey].subsections[subSectionKey]}</td>
                      <td className="score">
                        <div className="stage-bar">
                          <div
                            className={`stage-fill stage-${stage}`}
                            style={{ width: `${(avgScore / 5) * 100}%` }}
                          ></div>

                          {/* Stage markers */}
                          <div className="stage-markers">
                            <div className="stage-marker" style={{ left: '20%' }}></div> {/* Embryonnaire */}
                            <div className="stage-marker" style={{ left: '40%' }}></div> {/* Emergent */}
                            <div className="stage-marker" style={{ left: '60%' }}></div> {/* Consolidé */}
                            <div className="stage-marker" style={{ left: '80%' }}></div> {/* Mature */}
                          </div>
                          
                          <div className="stage-text">{`${avgScore} - ${label}`}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Add empty row to create vertical spacing between sections */}
                <tr className="section-spacing">
                  <td colSpan="3"></td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SummaryTable;
