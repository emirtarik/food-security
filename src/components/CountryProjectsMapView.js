// src/components/CountryProjectsMapView.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import '../styles/MapView.css';
import '../styles/CountryMapView.css';
import '../styles/CountryProjectsMapView.css';
import { countryNameToISO3, countryBoundingBoxes } from '../utils/mapCoordinates';

mapboxgl.accessToken = 'pk.eyJ1IjoibWttZCIsImEiOiJjajBqYjJpY2owMDE0Mndsbml0d2V1ZXczIn0.el8wQmA-TSJp2ggX8fJ1rA';

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

function computeCentroid(coords) {
  try {
    const flat = Array.isArray(coords[0][0][0]) ? coords.flat(2) : coords[0];
    let x = 0, y = 0, n = 0;
    flat.forEach(([lng, lat]) => { x += lng; y += lat; n += 1; });
    if (n === 0) return null;
    return [x / n, y / n];
  } catch (_) {
    return null;
  }
}

function parseCategories(row) {
  try {
    if (!row || !row.categoriesJson) return {};
    if (typeof row.categoriesJson === 'object') return row.categoriesJson;
    return JSON.parse(row.categoriesJson);
  } catch {
    return {};
  }
}

function createMarkerSVG(shape, color) {
  const size = 24;
  const center = size / 2;
  
  let path = '';
  switch (shape) {
    case 'circle':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${center}" cy="${center}" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>`;
    
    case 'square':
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>`;
    
    case 'triangle':
      path = `M${center},4 L20,20 L4,20 Z`;
      break;
    
    case 'diamond':
      path = `M${center},4 L20,${center} L${center},20 L4,${center} Z`;
      break;
    
    case 'pentagon':
      path = `M${center},4 L20,10 L17,20 L7,20 L4,10 Z`;
      break;
    
    case 'hexagon':
      path = `M${center},4 L20,8 L20,16 L${center},20 L4,16 L4,8 Z`;
      break;
    
    case 'star':
      path = `M${center},2 L14,9 L22,9 L16,14 L18,22 L${center},17 L6,22 L8,14 L2,9 L10,9 Z`;
      break;
    
    case 'octagon':
      path = `M8,4 L16,4 L20,8 L20,16 L16,20 L8,20 L4,16 L4,8 Z`;
      break;
    
    default:
      return createMarkerSVG('circle', color);
  }
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`;
}

function getPrimaryCategory(project) {
  const cats = parseCategories(project);
  for (const field of CATEGORY_FIELDS) {
    if (cats[field] === true) return field;
  }
  return null;
}

function CountryProjectsMapView({ country }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [admin1Centroids, setAdmin1Centroids] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [donorFilter, setDonorFilter] = useState('');
  const [admin1Filter, setAdmin1Filter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState({}); // {label: true}

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

  useEffect(() => {
    if (!country) return;
    let cancel = false;
    async function load() {
      try {
        const pr = await fetch(`${apiBase}/projects?country=${encodeURIComponent(country)}`, { credentials: 'include' });
        const pdata = await pr.json();
        if (!cancel) setProjects(Array.isArray(pdata) ? pdata : []);
      } catch (e) {
        console.error('Failed loading projects', e);
        if (!cancel) setProjects([]);
      }

      try {
        const gr = await fetch('/data/combined.geojson');
        const gj = await gr.json();
        const map = {};
        gj.features.forEach(f => {
          const props = f.properties || {};
          if (props.admin0Name !== country || !props.admin1Name) return;
          const g = f.geometry;
          if (!g) return;
          let c = null;
          if (g.type === 'Polygon' || g.type === 'MultiPolygon') c = computeCentroid(g.coordinates);
          else if (g.type === 'Point') c = g.coordinates;
          if (c) map[props.admin1Name] = c;
        });
        if (!cancel) setAdmin1Centroids(map);
      } catch (e) {
        console.error('Failed loading geojson', e);
        if (!cancel) setAdmin1Centroids({});
      }
    }
    load();
    return () => { cancel = true; };
  }, [country, apiBase]);

  useEffect(() => {
    if (!mapContainerRef.current || !country) return;
    const countryISO3 = countryNameToISO3[country];
    const bbox = countryISO3 ? countryBoundingBoxes[countryISO3] : null;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mkmd/cm6p4kq7i00ty01sa3iz31788',
      center: [0, 0],
      zoom: 2
    });
    mapRef.current = map;
    map.on('load', () => {
      setIsLoaded(true);
      if (bbox) map.fitBounds(bbox, { padding: 30, duration: 0 });
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } setIsLoaded(false); };
  }, [country]);

  const selectedCategories = useMemo(() => Object.keys(categoryFilter).filter(k => categoryFilter[k]), [categoryFilter]);

  const filtered = useMemo(() => {
    const hasCategoryFilter = selectedCategories.length > 0;
    return projects.filter(p => {
      if (statusFilter && (p.status || '') !== statusFilter) return false;
      if (donorFilter && (p.donor || '') !== donorFilter) return false;
      if (admin1Filter && (p.admin1 || '') !== admin1Filter) return false;
      if (hasCategoryFilter) {
        const cats = parseCategories(p);
        // include if ANY selected category is true
        const any = selectedCategories.some(label => cats[label] === true);
        if (!any) return false;
      }
      return true;
    });
  }, [projects, statusFilter, donorFilter, admin1Filter, selectedCategories]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const existing = map.__projectMarkers || [];
    existing.forEach(m => m.remove());

    const markers = [];
    filtered.forEach(p => {
      const coord = admin1Centroids[p.admin1];
      if (!coord) return;
      
      // Get primary category to determine icon
      const primaryCategory = getPrimaryCategory(p);
      const color = primaryCategory ? CATEGORY_COLORS[primaryCategory] : '#007bff';
      const shape = primaryCategory ? CATEGORY_SHAPES[primaryCategory] : 'circle';
      
      const el = document.createElement('div');
      el.className = 'project-marker-custom';
      el.innerHTML = createMarkerSVG(shape, color);
      el.style.cursor = 'pointer';
      
      const marker = new mapboxgl.Marker(el).setLngLat(coord).setPopup(
        new mapboxgl.Popup({ offset: 8, className: 'project-tooltip' }).setHTML(`
          <div class="title">${p.title || 'Project'}</div>
          ${primaryCategory ? `<div class="row"><span class="key">Category:</span><span class="val">${primaryCategory}</span></div>` : ''}
          <div class="row"><span class="key">Admin1:</span><span class="val">${p.admin1 || '—'}</span></div>
          <div class="row"><span class="key">Status:</span><span class="val">${p.status || '—'}</span></div>
          <div class="row"><span class="key">Donor:</span><span class="val">${p.donor || '—'}</span></div>
        `)
      ).addTo(map);
      markers.push(marker);
    });
    map.__projectMarkers = markers;
  }, [filtered, admin1Centroids, isLoaded]);

  const statusOptions = useMemo(() => Array.from(new Set(projects.map(p => p.status).filter(Boolean))), [projects]);
  const donorOptions = useMemo(() => Array.from(new Set(projects.map(p => p.donor).filter(Boolean))), [projects]);
  const admin1Options = useMemo(() => Array.from(new Set(projects.map(p => p.admin1).filter(Boolean))).sort(), [projects]);

  return (
    <div className="country-map-view">
      <div className="country-map-title">
        {country} – Projects Map
        <div className="country-projects-toolbar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={donorFilter} onChange={(e) => setDonorFilter(e.target.value)}>
            <option value="">All Donors</option>
            {donorOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={admin1Filter} onChange={(e) => setAdmin1Filter(e.target.value)}>
            <option value="">All Regions</option>
            {admin1Options.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="country-projects-categories">
          {CATEGORY_FIELDS.map(label => (
            <label key={label} className="category-checkbox-label">
              <input
                type="checkbox"
                checked={!!categoryFilter[label]}
                onChange={(e) => setCategoryFilter(prev => ({ ...prev, [label]: e.target.checked }))}
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
      <div ref={mapContainerRef} className="country-map-container-inner" />
    </div>
  );
}

export default CountryProjectsMapView;


