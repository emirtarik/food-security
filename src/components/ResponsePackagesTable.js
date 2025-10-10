import React, { useState } from 'react';
import '../styles/ResponsePackagesTable.css';

const CATEGORIES = [
  'Assistance alimentaire',
  'Nutrition',
  "Appui aux moyens d'existence",
  'Soutien au marché'
];

const TYPE_ZONE_OPTIONS = [
  'Zone à crise recurrente',
  'Zone à crise saisonnière',
  'Zone à crise cyclique',
  'Zone à crise sporadique'
];

const PHASE_OPTIONS = [
  'Phase 2',
  'Phase 3-5',
  'Sinistré / choc',
  'Autre'
];

const SHOCK_TYPE_OPTIONS = [
  'Insécurité',
  'Sécheresse',
  'Innondation',
  'Inflation',
  'Autre'
];

const BENEF_TYPE_OPTIONS = [
  'Résident',
  'Retourné',
  'Déplacé',
  'Refugié',
  'Autre'
];

const RESPONSE_PACKAGE_OPTIONS = [
  'Food For Work',
  'Cash For Work',
  'Distribition Gratuite Ciblée de vivres',
  "Distribition Gratuite Ciblée d'argent",
  'Vente des céréales à prix modéré (subventionné)'
];

const PERIOD_OPTIONS = [
  'Délai optimal (<= 3 mois)',
  'Réponse tardive [4, 6 mois[',
  'Réponse tardive (> 6 mois)'
];

function ResponsePackagesTable({ defaultCategory = CATEGORIES[0], onChange }) {
  const emptyRow = {
    category: defaultCategory,
    typeZone: '',
    phase: '',
    shockType: '',
    benefType: '',
    responsePackage: '',
    valuePerBenef: '',
    period: ''
  };

  const [rows, setRows] = useState([emptyRow]);
  const [category, setCategory] = useState(defaultCategory);

  const emitChange = (nextRows) => {
    setRows(nextRows);
    if (onChange) {
      onChange(nextRows);
    }
  };

  const handleFieldChange = (index, field, value) => {
    const next = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    emitChange(next);
  };

  const addRow = () => emitChange([...rows, { ...emptyRow, category }]);
  const removeRow = (index) => emitChange(rows.filter((_, i) => i !== index));

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    // Do not mutate existing rows; only future rows will use this category
  };

  return (
    <div className="rp-table-container">
      <div className="rp-controls">
        <label>
          Catégorie:
          <select value={category} onChange={handleCategoryChange}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <button type="button" className="rp-add" onClick={addRow}>+ Ajouter une ligne</button>
      </div>

      <div className="rp-table-scroll">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Type Zone</th>
              <th>Phase actuelle zone / choc</th>
              <th>Type de choc</th>
              <th>Type Bénéf</th>
              <th>Paquet de réponse</th>
              <th>Valeur / bénef</th>
              <th>Période</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="rp-category-cell">
                  <span className="rp-category-pill" title={row.category}>{row.category}</span>
                </td>
                <td>
                  <select value={row.typeZone} onChange={(e) => handleFieldChange(idx, 'typeZone', e.target.value)}>
                    <option value="">—</option>
                    {TYPE_ZONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <select value={row.phase} onChange={(e) => handleFieldChange(idx, 'phase', e.target.value)}>
                    <option value="">—</option>
                    {PHASE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <select value={row.shockType} onChange={(e) => handleFieldChange(idx, 'shockType', e.target.value)}>
                    <option value="">—</option>
                    {SHOCK_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <select value={row.benefType} onChange={(e) => handleFieldChange(idx, 'benefType', e.target.value)}>
                    <option value="">—</option>
                    {BENEF_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <select value={row.responsePackage} onChange={(e) => handleFieldChange(idx, 'responsePackage', e.target.value)}>
                    <option value="">—</option>
                    {RESPONSE_PACKAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.valuePerBenef}
                    onChange={(e) => handleFieldChange(idx, 'valuePerBenef', e.target.value)}
                    placeholder="Ex: 25 000 CFA"
                  />
                </td>
                <td>
                  <select value={row.period} onChange={(e) => handleFieldChange(idx, 'period', e.target.value)}>
                    <option value="">—</option>
                    {PERIOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="rp-actions">
                  <button type="button" className="rp-remove" onClick={() => removeRow(idx)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResponsePackagesTable;


