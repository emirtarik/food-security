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
  { name: 'donor', label: 'Bailleur', type: 'text' },
  { name: 'title', label: 'Titre', type: 'text' },
  { name: 'img', label: "URL de l'image", type: 'url' },
  { name: 'status', label: 'Statut', type: 'select', options: ['En cours', 'Terminé', 'Planifié'] },
  { name: 'fundingAgency', label: 'Agence de financement', type: 'text' },
  { name: 'implementingAgency', label: 'Agence de mise en œuvre', type: 'text' },
  { name: 'start', label: 'Année de début', type: 'number' },
  { name: 'end', label: 'Année de fin', type: 'number' },
  { name: 'currency', label: 'Devise', type: 'text' },
  { name: 'budget', label: 'Budget (devise locale)', type: 'number' },
  { name: 'budgetUSD', label: 'Budget (USD)', type: 'number' },
  { name: 'nationalContribution', label: 'Contribution nationale (devise locale)', type: 'number' },
  { name: 'nationalContributionUSD', label: 'Contribution nationale (USD)', type: 'number' },
  { name: 'link', label: 'Lien vers le projet', type: 'url' },
  { name: 'comments', label: 'Commentaires', type: 'textarea' },
];

function ProjectDataInput({ country, onSubmit }) {
  const emptyCategories = useMemo(() => (
    CATEGORY_FIELDS.reduce((acc, label) => { acc[label] = false; return acc; }, {})
  ), []);

  const initialFormState = projectFields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, { zone: [], categories: emptyCategories, typeProjectSelections: [] }); // Add zone (multi), categories, and project types
  
  const TYPE_PROJECT_OPTIONS = ['Humanitaire', 'Développement', 'Paix / protection'];

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
    // Require at least one zone selected
    if (!Array.isArray(formData.zone) || formData.zone.length === 0) {
      alert("Veuillez sélectionner au moins une zone (région Admin1).");
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
        <div className="section-card">
          <h4 className="section-title">Localisation du projet</h4>
          <p className="section-subtitle">Sélectionnez toutes les régions Admin1 (zones) couvertes par ce projet.</p>

          {loadingAdmin1 && <small className="muted">Chargement des régions…</small>}
          {!loadingAdmin1 && !admin1Error && admin1Options.length === 0 && country && (
            <small className="muted">Aucune région trouvée pour {country}. Vérifiez le fichier de données.</small>
          )}
          {admin1Error && <small className="error">{admin1Error}</small>}

          <div className="form-group">
            <label>Zones (régions Admin1)</label>
            <div className="category-grid">
              {admin1Options.map(level => (
                <label key={level} className="category-item">
                  <input
                    type="checkbox"
                    checked={Array.isArray(formData.zone) && formData.zone.includes(level)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => {
                        const current = Array.isArray(prev.zone) ? prev.zone : [];
                        if (checked) {
                          return { ...prev, zone: [...new Set([...current, level])] };
                        }
                        return { ...prev, zone: current.filter(v => v !== level) };
                      });
                    }}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group categories-group">
          <label>Type de soutien</label>
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

        <div className="form-group categories-group">
          <label>Type de projet</label>
          <div className="category-grid">
            {TYPE_PROJECT_OPTIONS.map(option => (
              <label key={option} className="category-item">
                <input
                  type="checkbox"
                  checked={Array.isArray(formData.typeProjectSelections) && formData.typeProjectSelections.includes(option)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => {
                      const current = Array.isArray(prev.typeProjectSelections) ? prev.typeProjectSelections : [];
                      if (checked) {
                        return { ...prev, typeProjectSelections: [...new Set([...current, option])] };
                      }
                      return { ...prev, typeProjectSelections: current.filter(v => v !== option) };
                    });
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h4 className="section-title">Détails du projet</h4>
          <div className="form-group">
            <label htmlFor="title">Titre</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Titre du projet"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="donor">Bailleur</label>
            <input
              type="text"
              id="donor"
              name="donor"
              value={formData.donor}
              onChange={handleChange}
              placeholder="ex. UE, Banque mondiale, …"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fundingAgency">Agence de financement</label>
            <input
              type="text"
              id="fundingAgency"
              name="fundingAgency"
              value={formData.fundingAgency}
              onChange={handleChange}
              placeholder="Organisation gérant les fonds"
            />
          </div>
          <div className="form-group">
            <label htmlFor="implementingAgency">Agence de mise en œuvre</label>
            <input
              type="text"
              id="implementingAgency"
              name="implementingAgency"
              value={formData.implementingAgency}
              onChange={handleChange}
              placeholder="Organisation réalisant les activités"
            />
          </div>
          <div className="form-group">
            <label htmlFor="img">URL de l'image</label>
            <input
              type="url"
              id="img"
              name="img"
              value={formData.img}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Statut</label>
              <select
              id="status"
              name="status"
              value={formData.status}
                onChange={handleChange}
              >
              <option value="">Sélectionnez un statut...</option>
              {['En cours','Terminé','Planifié'].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
          </div>
        </div>

        <div className="section-card">
          <h4 className="section-title">Calendrier</h4>
          <div className="form-group">
            <label htmlFor="start">Année de début</label>
            <input
              type="number"
              id="start"
              name="start"
              value={formData.start}
              onChange={handleChange}
              placeholder="AAAA"
              min="1900"
              max="2100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="end">Année de fin</label>
            <input
              type="number"
              id="end"
              name="end"
              value={formData.end}
              onChange={handleChange}
              placeholder="AAAA"
              min="1900"
              max="2100"
            />
          </div>
        </div>

        <div className="section-card">
          <h4 className="section-title">Financements</h4>
          <div className="form-group">
            <label htmlFor="currency">Devise</label>
            <input
              type="text"
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="ex. XOF"
            />
          </div>
          <div className="form-group">
            <label htmlFor="budget">Budget (devise locale)</label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="budgetUSD">Budget (USD)</label>
            <input
              type="number"
              id="budgetUSD"
              name="budgetUSD"
              value={formData.budgetUSD}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nationalContribution">Contribution nationale (devise locale)</label>
            <input
              type="number"
              id="nationalContribution"
              name="nationalContribution"
              value={formData.nationalContribution}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nationalContributionUSD">Contribution nationale (USD)</label>
            <input
              type="number"
              id="nationalContributionUSD"
              name="nationalContributionUSD"
              value={formData.nationalContributionUSD}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="section-card">
          <h4 className="section-title">Références</h4>
          <div className="form-group">
            <label htmlFor="link">Lien vers le projet</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="comments">Commentaires</label>
              <textarea
              id="comments"
              name="comments"
              value={formData.comments}
                onChange={handleChange}
                rows="3"
              placeholder="Notes sur le projet..."
              />
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Soumettre le projet'}
        </button>
      </form>
    </div>
  );
}

export default ProjectDataInput;
