import React, { useEffect, useMemo, useState } from 'react';
import '../styles/ProjectsSynergyTable.css';

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
  const size = 20;
  const center = size / 2;
  
  let path = '';
  switch (shape) {
    case 'circle':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="8" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`;
    
    case 'square':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="14" height="14" fill="${color}" stroke="white" stroke-width="1.5"/>
      </svg>`;
    
    case 'triangle':
      path = `M${center},3 L17,17 L3,17 Z`;
      break;
    
    case 'diamond':
      path = `M${center},3 L17,${center} L${center},17 L3,${center} Z`;
      break;
    
    case 'pentagon':
      path = `M${center},3 L17,8 L14,17 L6,17 L3,8 Z`;
      break;
    
    case 'hexagon':
      path = `M${center},3 L17,7 L17,13 L${center},17 L3,13 L3,7 Z`;
      break;
    
    case 'star':
      path = `M${center},2 L12,8 L18,8 L13,12 L15,18 L${center},14 L5,18 L7,12 L2,8 L8,8 Z`;
      break;
    
    case 'octagon':
      path = `M7,3 L13,3 L17,7 L17,13 L13,17 L7,17 L3,13 L3,7 Z`;
      break;
    
    default:
      return createMarkerSVG('circle', color);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
}

function ProjectsSynergyTable({ country }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // userSelections[projectKey][label] = true|false (only for boxes not locked by base data)
  const [userSelections, setUserSelections] = useState({});

  useEffect(() => {
    async function loadProjects() {
      if (!country) return;
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
        const res = await fetch(`${apiBase}/projects?country=${encodeURIComponent(country)}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        // initialize userSelections with empty maps for each project
        const initial = {};
        list.forEach(p => {
          const key = String(p.id || `${p.admin1}-${p.title}`);
          if (!initial[key]) initial[key] = {};
        });
        setUserSelections(initial);
      } catch (e) {
        console.error('Failed to load projects:', e);
        setError('Failed to load projects');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [country]);

  const parseCategories = (row) => {
    try {
      if (!row || !row.categoriesJson) return {};
      if (typeof row.categoriesJson === 'object') return row.categoriesJson;
      return JSON.parse(row.categoriesJson);
    } catch {
      return {};
    }
  };

  const onToggle = (projectKey, label, checked) => {
    setUserSelections(prev => ({
      ...prev,
      [projectKey]: { ...(prev[projectKey] || {}), [label]: checked }
    }));
  };

  const onSave = async (project) => {
    const key = String(project.id || `${project.admin1}-${project.title}`);
    const baseCats = parseCategories(project);
    const userCats = userSelections[key] || {};
    // Only send mutable selections (we'll merge on server, but keep payload small)
    const payload = { categories: userCats };
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
    try {
      const res = await fetch(`${apiBase}/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      // Update local state to reflect merged categories from server
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, categoriesJson: updated.categoriesJson } : p));
      // Clear local user selections after save
      setUserSelections(prev => ({ ...prev, [key]: {} }));
    } catch (e) {
      console.error('Failed to save categories:', e);
      alert('Failed to save categories');
    }
  };

  return (
    <div className="pst-container">
      <div className="pst-scroll">
        <table className="pst-table">
          <thead>
            <tr>
              <th className="pst-col-admin">Zone admin (N+1)</th>
              <th className="pst-col-project">Intervention / Projet</th>
              {CATEGORY_FIELDS.map(h => (
                <th key={h} className="pst-col-category">
                  <div className="category-header">
                    <div 
                      className="category-icon-header"
                      dangerouslySetInnerHTML={{ 
                        __html: createMarkerSVG(CATEGORY_SHAPES[h], CATEGORY_COLORS[h]) 
                      }}
                    />
                    <span className="category-name">{h}</span>
                  </div>
                </th>
              ))}
              <th className="pst-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3 + CATEGORY_FIELDS.length}>Chargement…</td></tr>
            )}
            {error && !loading && (
              <tr><td colSpan={3 + CATEGORY_FIELDS.length}>Erreur de chargement</td></tr>
            )}
            {!loading && !error && projects.length === 0 && (
              <tr><td colSpan={3 + CATEGORY_FIELDS.length}>Aucun projet trouvé</td></tr>
            )}
            {!loading && !error && projects.map((p) => {
              const baseCats = parseCategories(p);
              const key = String(p.id || `${p.admin1}-${p.title}`);
              const userCats = userSelections[key] || {};
              return (
                <tr key={key}>
                  <td>{p.admin1 || '—'}</td>
                  <td>{p.title || '—'}</td>
                  {CATEGORY_FIELDS.map(label => {
                    const locked = !!baseCats[label];
                    const checked = locked || !!userCats[label];
                    return (
                      <td key={label} className="pst-checkbox">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={(e) => onToggle(key, label, e.target.checked)}
                        />
                      </td>
                    );
                  })}
                  <td className="pst-actions">
                    {p.id ? (
                      <button type="button" className="pst-add" onClick={() => onSave(p)}>Save</button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectsSynergyTable;



