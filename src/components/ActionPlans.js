// src/components/ActionPlans.js

import React from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx'; // For Excel functionality
import { saveAs } from 'file-saver'; // For saving files
import { sectionMapping } from '../mappings';
import '../styles/ActionPlans.css'; // Import the updated CSS

function ActionPlans({ savedActionPlans }) {
  // Helper function to parse questionKey into section
  const parseQuestionKey = (key) => {
    const keyStr = key.toString();
    if (keyStr.length < 1) {
      console.warn(`Invalid question key format: ${key}`);
      return { section: 'Unknown' };
    }
    const section = keyStr.charAt(0);
    return { section };
  };

  // Helper function to group action plans by section
  const groupActionPlans = (savedActionPlans) => {
    const grouped = {};

    Object.entries(savedActionPlans).forEach(([questionKey, plans]) => {
      const { section } = parseQuestionKey(questionKey);

      // Use the mapping to get the section title
      const sectionData = sectionMapping[`section${section}`];
      if (!sectionData) {
        console.warn(`No mapping found for section${section}`);
        return;
      }

      const sectionTitle = sectionData.title;

      if (!grouped[sectionTitle]) {
        grouped[sectionTitle] = [];
      }

      // Append all plans to the section
      grouped[sectionTitle].push(...plans);
    });

    return grouped;
  };

  // Function to handle Excel download for Saved Action Plans
  const handleDownloadExcel = () => {
    if (!savedActionPlans || Object.keys(savedActionPlans).length === 0) {
      alert('No saved action plans to download.');
      return;
    }

    const groupedPlans = groupActionPlans(savedActionPlans);
    const excelData = [];

    // Iterate over each section
    Object.entries(groupedPlans).forEach(([section, plans]) => {
      // Add Section Header with numbering
      const sectionNumber = Object.keys(sectionMapping).find(
        key => sectionMapping[key].title === section
      )?.replace('section', '') || '';
      excelData.push([`${sectionNumber}. ${section}`]);

      // Add Column Headers
      excelData.push([
        'Offers or Requests',
        'Period Month',
        'Period Year',
        'Budget Amount',
        'Budget Currency',
        'Responsible'
      ]);

      // Add each action plan under the section
      plans.forEach((plan) => {
        excelData.push([
          plan.offerRequest,
          plan.month,      // Separate month
          plan.year,       // Separate year
          plan.budget,     // Separate budget amount
          plan.currency,   // Separate currency
          plan.responsible,
        ]);
      });

      // Add an empty row for spacing
      excelData.push([]);
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Saved Action Plans');

    // Write workbook and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'Saved_Action_Plans_Grouped.xlsx');

    // Optional: Notify user of successful download
    alert('Excel file downloaded successfully.');
  };

  // Group the action plans
  const groupedPlans = groupActionPlans(savedActionPlans);

  return (
    <div className="saved-action-plans-container">
      <div className="saved-action-plans-header">
        <h4>Actions recommandées</h4>
        <button type="button" onClick={handleDownloadExcel} className="download-excel-button">
          Télécharger Excel
        </button>
      </div>

      {Object.keys(groupedPlans).length === 0 ? (
        <p>Aucun action recommandée n'a encore été enregistré.</p>
      ) : (
        // Iterate through grouped plans by section
        Object.entries(groupedPlans).map(([section, plans]) => (
          <div key={section} className="section-group">
            {/* Section Title with Numbering */}
            <h5>{`${
              Object.keys(sectionMapping).find(key => sectionMapping[key].title === section)?.replace('section', '') || ''
            }. ${section}`}</h5>

            <div className="table-wrapper">
              <table className="action-plan-table">
                <thead>
                  <tr>
                    <th scope="col">Offers or Requests</th>
                    <th scope="col">Period Month</th>
                    <th scope="col">Period Year</th>
                    <th scope="col">Budget Amount</th>
                    <th scope="col">Budget Currency</th>
                    <th scope="col">Responsible</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={index}>
                      <td>{plan.offerRequest}</td>
                      <td>{plan.month}</td>
                      <td>{plan.year}</td>
                      <td>{plan.budget}</td>
                      <td>{plan.currency}</td>
                      <td>{plan.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

ActionPlans.propTypes = {
  savedActionPlans: PropTypes.object.isRequired,
};

export default ActionPlans;
