import React, { useState } from 'react';
import '../styles/ProjectDataInput.css';

const projectFields = [
  { name: 'donor', label: 'Donor', type: 'text' },
  { name: 'title', label: 'Title', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Current', 'Completed', 'Planned'] },
  { name: 'fundingAgency', label: 'Funding Agency', type: 'text' },
  { name: 'implementingAgency', label: 'Implementing Agency', type: 'text' },
  { name: 'recipient', label: 'Recipient Country', type: 'text' }, // Could be pre-filled or a dropdown
  { name: 'zone', label: 'Zone/Sub-region', type: 'text' },
  { name: 'start', label: 'Start Year', type: 'number' },
  { name: 'end', label: 'End Year', type: 'number' },
  { name: 'currency', label: 'Currency', type: 'text' },
  { name: 'budget', label: 'Budget (Local Currency)', type: 'number' },
  { name: 'budgetUSD', label: 'Budget (USD)', type: 'number' },
  { name: 'link', label: 'Link to Project', type: 'url' },
  { name: 'img', label: 'Image URL', type: 'url' }, // Simplified for now
  { name: 'comments', label: 'Comments', type: 'textarea' },
  { name: 'topic', label: 'Topic/Sector', type: 'text' },
];

function ProjectDataInput() {
  const initialFormState = projectFields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, { admin1: '' }); // Add admin1 to the initial state

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, here you would send the data to a backend server
    console.log('Project Data Submitted:', formData);
    // Optionally, reset form after submission
    // setFormData(initialFormState);
    alert('Project data logged to console. See console for details.');
  };

  // Placeholder admin1 levels - these would ideally be fetched based on user's country (admin0)
  const admin1Levels = ["Region A", "Region B", "Region C", "Region D"];

  return (
    <div className="project-data-input-container">
      <h3>Submit New Project Data</h3>
      <form onSubmit={handleSubmit} className="project-data-form">
        <div className="form-group">
          <label htmlFor="admin1">Admin1 Level (Region/Province)</label>
          <select
            id="admin1"
            name="admin1"
            value={formData.admin1}
            onChange={handleChange}
            required
          >
            <option value="">Select Admin1 Level...</option>
            {admin1Levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {projectFields.map(field => (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
              >
                <option value="">Select {field.label}...</option>
                {field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                rows="3"
              />
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.type === 'number' ? '0' : ''}
              />
            )}
          </div>
        ))}

        <button type="submit" className="submit-button">Submit Project Data</button>
      </form>
    </div>
  );
}

export default ProjectDataInput;
