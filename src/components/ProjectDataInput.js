import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ProjectDataInput.css';

// Match the category set used in ProjectsSynergyTable
const CATEGORY_FIELDS = [
  'Assistance alimentaire',
  'Nutrition',
  'Accès aux intrants agricoles',
  "Accès à l'aliment bétail",
  'Entrepreneuriat',
  'Santé animale',
  'Infrastructures et transport',
  'Soutien au marché',
  'Paix sociale et protection'
];

const CATEGORY_COLORS = {
  'Assistance alimentaire': '#FF6B6B',
  'Nutrition': '#4ECDC4',
  'Accès aux intrants agricoles': '#95E1D3',
  "Accès à l'aliment bétail": '#F38181',
  'Entrepreneuriat': '#AA96DA',
  'Santé animale': '#FCBAD3',
  'Infrastructures et transport': '#FFA726',
  'Soutien au marché': '#A8D8EA',
  'Paix sociale et protection': '#FFAAA6'
};

const CATEGORY_SHAPES = {
  'Assistance alimentaire': 'circle',
  'Nutrition': 'square',
  'Accès aux intrants agricoles': 'triangle',
  "Accès à l'aliment bétail": 'diamond',
  'Entrepreneuriat': 'pentagon',
  'Santé animale': 'hexagon',
  'Infrastructures et transport': 'star',
  'Soutien au marché': 'octagon',
  'Paix sociale et protection': 'circle'
};

function createMarkerSVG(shape, color) {
  const size = 18;
  const center = size / 2;
  
  let path = '';
  switch (shape) {
    case 'circle':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="7" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`;
    
    case 'square':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="12" height="12" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`;
    
    case 'triangle':
      path = `M${center},3 L15,15 L3,15 Z`;
      break;
    
    case 'diamond':
      path = `M${center},3 L15,${center} L${center},15 L3,${center} Z`;
      break;
    
    case 'pentagon':
      path = `M${center},3 L15,7 L13,15 L5,15 L3,7 Z`;
      break;
    
    case 'hexagon':
      path = `M${center},3 L15,6 L15,12 L${center},15 L3,12 L3,6 Z`;
      break;
    
    case 'star':
      path = `M${center},2 L11,7 L16,7 L12,11 L14,16 L${center},13 L5,16 L7,11 L2,7 L7,7 Z`;
      break;
    
    case 'octagon':
      path = `M6,3 L12,3 L15,6 L15,12 L12,15 L6,15 L3,12 L3,6 Z`;
      break;
    
    default:
      return createMarkerSVG('circle', color);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
}

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

function ProjectDataInput({ country, onSubmit }) {
  const emptyCategories = useMemo(() => (
    CATEGORY_FIELDS.reduce((acc, label) => { acc[label] = false; return acc; }, {})
  ), []);

  const initialFormState = projectFields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, { admin1: '', categories: emptyCategories }); // Add admin1 and categories to the initial state

  const [formData, setFormData] = useState(initialFormState);
  const [admin1Options, setAdmin1Options] = useState([]);
  const [loadingAdmin1, setLoadingAdmin1] = useState(false);
  const [admin1Error, setAdmin1Error] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) {
      console.warn('[ProjectDataInput] onSubmit prop not provided');
      return;
    }
    try {
      setSubmitting(true);
      const ok = await onSubmit(formData);
      if (ok) {
        // setFormData(initialFormState); // keep values for now; uncomment to reset
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Load admin1 list from combined.geojson based on provided country
  useEffect(() => {
    async function loadAdmin1() {
      setLoadingAdmin1(true);
      setAdmin1Error(null);
      try {
        console.log('[ProjectDataInput] Loading admin1 for country:', country);
        const res = await fetch('/data/combined.geojson');
        const gj = await res.json();
        const set = new Set();
        gj.features.forEach(f => {
          const props = f.properties || {};
          if (props.admin0Name === country && props.admin1Name) {
            set.add(props.admin1Name);
          }
        });
        const list = Array.from(set).sort();
        console.log('[ProjectDataInput] Loaded admin1 options:', list);
        setAdmin1Options(list);
      } catch (e) {
        console.error('[ProjectDataInput] Failed to load admin1 list:', e);
        setAdmin1Error('Failed to load regions');
        setAdmin1Options([]);
      } finally {
        setLoadingAdmin1(false);
      }
    }
    if (country) loadAdmin1();
  }, [country]);

  return (
    <div className="project-data-input-container">
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
            {admin1Options.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {loadingAdmin1 && <small className="muted">Loading regions…</small>}
          {!loadingAdmin1 && !admin1Error && admin1Options.length === 0 && country && (
            <small className="muted">No regions found for {country}. Check data file.</small>
          )}
          {admin1Error && <small className="error">{admin1Error}</small>}
        </div>

        <div className="form-group categories-group">
          <label>Project Categories</label>
          <div className="category-grid">
            {CATEGORY_FIELDS.map(label => (
              <label key={label} className="category-item">
                <input
                  type="checkbox"
                  checked={!!formData.categories[label]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    categories: { ...prev.categories, [label]: e.target.checked }
                  }))}
                />
                <div 
                  className="category-icon-inline"
                  dangerouslySetInnerHTML={{ 
                    __html: createMarkerSVG(CATEGORY_SHAPES[label], CATEGORY_COLORS[label]) 
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
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

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Project Data'}
        </button>
      </form>
    </div>
  );
}

export default ProjectDataInput;
