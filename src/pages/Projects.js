import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header.js';
import SubHeader from './SubHeader.js';
import Footer from './Footer.js';
import MapViewProjects from '../components/MapViewProjects.js';
import ProjectCard from '../components/ProjectCard.js';
import { Range, getTrackBackground } from 'react-range';
import Select from 'react-select';
import { useTranslationHook } from '../i18n';
import projectDataPlaceholder from '../data/projects.json';
import '../styles/Projects.css';

const Projects = () => {
  const { t } = useTranslationHook('analysis');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(''); // '', 'startYear', 'endYear', 'budget'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const itemsPerPage = 20;
  
  // Calculate initial bounds (will be updated after projects load)
  const [filters, setFilters] = useState({
    donors: ['EU'], // Pre-select EU to show EU projects on first load
    recipientCountries: [], // Changed to array for multi-select
    yearRange: [1970, 2030], // [min, max] for year range slider - will be updated
    budgetRange: [0, 100000000], // [min, max] for budget range slider - will be updated
  });

  useEffect(() => {
    // Handle potential BOM character in id key and clean up projects
    const cleanedProjects = projectDataPlaceholder.map(p => {
      const cleaned = { ...p };
      // Remove BOM id if present
      if (cleaned['\uFEFFid']) {
        cleaned.id = cleaned['\uFEFFid'];
        delete cleaned['\uFEFFid'];
      }
      // Ensure zone is treated as string (may be null)
      if (cleaned.zone && typeof cleaned.zone === 'string') {
        cleaned.zone = cleaned.zone.trim();
      }
      return cleaned;
    });
    setProjects(cleanedProjects);
    setLoading(false);
    
    // Update yearRange and budgetRange with actual bounds from data
    const years = [];
    const budgets = [];
    cleanedProjects.forEach(p => {
      const startYear = typeof p.start === 'number' ? p.start : 
                        p.start ? new Date(p.start).getFullYear() : null;
      const endYear = typeof p.end === 'number' ? p.end : 
                      p.end ? new Date(p.end).getFullYear() : null;
      if (startYear) years.push(startYear);
      if (endYear) years.push(endYear);
      if (typeof p.budgetUSD === 'number' && p.budgetUSD !== null) {
        budgets.push(p.budgetUSD);
      }
    });
    const updates = {};
    if (years.length > 0) {
      updates.yearRange = [Math.min(...years), Math.max(...years)];
    }
    if (budgets.length > 0) {
      updates.budgetRange = [Math.min(...budgets), Math.max(...budgets)];
    }
    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Generate unique options for dropdowns
  const donorOptions = useMemo(() => {
    const donors = new Set();
    projects.forEach(p => {
      const donor = p.donor?.trim();
      if (!donor) return;
      
      // Parse multiple donors from donor field
      // Split by common delimiters: semicolon, plus sign, comma
      const parsedDonors = donor
        .split(/[;+,]/) // Split by semicolon, plus, or comma
        .map(d => d.trim()) // Trim whitespace
        .filter(d => d.length > 0); // Remove empty strings
      
      parsedDonors.forEach(d => donors.add(d));
    });
    
    return Array.from(donors).sort();
  }, [projects]);

  const recipientCountryOptions = useMemo(() => {
    const countries = new Set();
    projects.forEach(p => {
      const recipient = p.recipient?.trim();
      if (!recipient) return;
      
      // Parse multiple countries from recipient field
      // Split by common delimiters: semicolon, plus sign, comma
      const parsedCountries = recipient
        .split(/[;+,]/) // Split by semicolon, plus, or comma
        .map(country => country.trim()) // Trim whitespace
        .filter(country => country.length > 0); // Remove empty strings
      
      parsedCountries.forEach(country => countries.add(country));
    });
    
    return Array.from(countries).sort();
  }, [projects]);

  // Calculate min/max years and budget from projects for range sliders
  const yearBounds = useMemo(() => {
    const years = [];
    projects.forEach(p => {
      const startYear = typeof p.start === 'number' ? p.start : 
                        p.start ? new Date(p.start).getFullYear() : null;
      const endYear = typeof p.end === 'number' ? p.end : 
                      p.end ? new Date(p.end).getFullYear() : null;
      if (startYear) years.push(startYear);
      if (endYear) years.push(endYear);
    });
    if (years.length === 0) return [1970, 2030];
    return [Math.min(...years), Math.max(...years)];
  }, [projects]);

  const budgetBounds = useMemo(() => {
    const budgets = projects
      .map(p => p.budgetUSD)
      .filter(b => typeof b === 'number' && b !== null);
    if (budgets.length === 0) return [0, 100000000];
    return [Math.min(...budgets), Math.max(...budgets)];
  }, [projects]);


  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const filteredProjects = useMemo(() => {
    let tempProjects = [...projects];

    // Updated filtering logic for dropdowns
    if (filters.donors && filters.donors.length > 0) {
      tempProjects = tempProjects.filter(p => {
        const donor = p.donor?.trim();
        if (!donor) return false;
        
        // Parse donors from the project's donor field
        const projectDonors = donor
          .split(/[;+,]/)
          .map(d => d.trim().toLowerCase())
          .filter(d => d.length > 0);
        
        // Check if ALL selected donors appear in this project's donor list (AND logic)
        return filters.donors.every(selectedDonor => 
          projectDonors.includes(selectedDonor.toLowerCase())
        );
      });
    }
    if (filters.recipientCountries && filters.recipientCountries.length > 0) {
      tempProjects = tempProjects.filter(p => {
        const recipient = p.recipient?.trim();
        if (!recipient) return false;
        
        // Parse countries from the project's recipient field
        const projectCountries = recipient
          .split(/[;+,]/)
          .map(country => country.trim().toLowerCase())
          .filter(country => country.length > 0);
        
        // Check if ALL selected countries appear in this project's recipient list (AND logic)
        return filters.recipientCountries.every(selectedCountry => 
          projectCountries.includes(selectedCountry.toLowerCase())
        );
      });
    }
    // Year range filter - projects must have start or end year within the range
    if (filters.yearRange && Array.isArray(filters.yearRange) && filters.yearRange.length === 2) {
      const [minYear, maxYear] = filters.yearRange;
      tempProjects = tempProjects.filter(p => {
        const projectStartYear = typeof p.start === 'number' ? p.start : 
                                  p.start ? new Date(p.start).getFullYear() : null;
        const projectEndYear = typeof p.end === 'number' ? p.end : 
                                p.end ? new Date(p.end).getFullYear() : null;
        
        // Project is included if its start year OR end year falls within the range
        // Or if the project spans the range (start before min, end after max)
        const startInRange = projectStartYear && projectStartYear >= minYear && projectStartYear <= maxYear;
        const endInRange = projectEndYear && projectEndYear >= minYear && projectEndYear <= maxYear;
        const spansRange = projectStartYear && projectEndYear && projectStartYear <= minYear && projectEndYear >= maxYear;
        
        return startInRange || endInRange || spansRange;
      });
    }
    // Budget range filter
    if (filters.budgetRange && Array.isArray(filters.budgetRange) && filters.budgetRange.length === 2) {
      const [minBudget, maxBudget] = filters.budgetRange;
      tempProjects = tempProjects.filter(p => {
        if (typeof p.budgetUSD !== 'number' || p.budgetUSD === null) return false;
        return p.budgetUSD >= minBudget && p.budgetUSD <= maxBudget;
      });
    }

    // Apply sorting
    if (sortBy) {
      tempProjects.sort((a, b) => {
        let aValue, bValue;

        if (sortBy === 'startYear') {
          aValue = typeof a.start === 'number' ? a.start : (a.start ? new Date(a.start).getFullYear() : 0);
          bValue = typeof b.start === 'number' ? b.start : (b.start ? new Date(b.start).getFullYear() : 0);
        } else if (sortBy === 'endYear') {
          aValue = typeof a.end === 'number' ? a.end : (a.end ? new Date(a.end).getFullYear() : 0);
          bValue = typeof b.end === 'number' ? b.end : (b.end ? new Date(b.end).getFullYear() : 0);
        } else if (sortBy === 'budget') {
          aValue = a.budgetUSD || 0;
          bValue = b.budgetUSD || 0;
        }

        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return tempProjects;
  }, [projects, filters, sortBy, sortOrder]);

  // Paginated projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);


  return (
    <div>
      <Header />
      <SubHeader /> {/* Assuming Projects page might have a SubHeader, adjust as needed */}
      <div className="projects-page-container">
        {/* All Filters Above Map */}
        <div className="filters-container">
          <div className="filter-item">
            <label htmlFor="donors" className="filter-label">{t('Donors')}:</label>
            <Select
              id="donors"
              isMulti
              options={donorOptions.map(donor => ({ value: donor, label: donor }))}
              value={filters.donors.map(donor => ({ value: donor, label: donor }))}
              onChange={(selectedOptions) => {
                const selected = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                setFilters(prev => ({ ...prev, donors: selected }));
                setCurrentPage(1);
              }}
              placeholder={t('SelectDonors')}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          <div className="filter-item">
            <label htmlFor="recipientCountries" className="filter-label">{t('RecipientCountries')}:</label>
            <Select
              id="recipientCountries"
              isMulti
              options={recipientCountryOptions.map(country => ({ value: country, label: country }))}
              value={filters.recipientCountries.map(country => ({ value: country, label: country }))}
              onChange={(selectedOptions) => {
                const selected = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                setFilters(prev => ({ ...prev, recipientCountries: selected }));
                setCurrentPage(1);
              }}
              placeholder={t('SelectCountries')}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          <div className="filter-item filter-item-range">
            <label className="filter-label">{t('YearRange')}: {filters.yearRange[0]} - {filters.yearRange[1]}</label>
            <div className="range-slider-wrapper">
              <Range
                values={filters.yearRange}
                step={1}
                min={yearBounds[0]}
                max={yearBounds[1]}
                onChange={(values) => {
                  setFilters(prev => ({ ...prev, yearRange: values }));
                  setCurrentPage(1);
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '6px',
                      width: '100%',
                      background: getTrackBackground({
                        values: filters.yearRange,
                        colors: ['#ddd', '#007bff', '#ddd'],
                        min: yearBounds[0],
                        max: yearBounds[1],
                      }),
                      borderRadius: '3px',
                    }}
                  >
                    {children}
                  </div>
                )}
                renderThumb={({ props, isDragged }) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '20px',
                      width: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      border: '2px solid white',
                      boxShadow: isDragged ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      outline: 'none',
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="filter-item filter-item-budget">
            <label className="filter-label">{t('BudgetRange')}: ${Math.round(filters.budgetRange[0]).toLocaleString()} - ${Math.round(filters.budgetRange[1]).toLocaleString()}</label>
            <div className="range-slider-wrapper">
              <Range
                values={filters.budgetRange}
                step={1000}
                min={budgetBounds[0]}
                max={budgetBounds[1]}
                onChange={(values) => {
                  setFilters(prev => ({ ...prev, budgetRange: values }));
                  setCurrentPage(1);
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '6px',
                      width: '100%',
                      background: getTrackBackground({
                        values: filters.budgetRange,
                        colors: ['#ddd', '#007bff', '#ddd'],
                        min: budgetBounds[0],
                        max: budgetBounds[1],
                      }),
                      borderRadius: '3px',
                    }}
                  >
                    {children}
                  </div>
                )}
                renderThumb={({ props, isDragged }) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: '20px',
                      width: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#007bff',
                      border: '2px solid white',
                      boxShadow: isDragged ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      outline: 'none',
                    }}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <MapViewProjects 
          projects={filteredProjects} 
          filters={filters}
          setFilters={setFilters}
          donorOptions={donorOptions}
          recipientCountryOptions={recipientCountryOptions}
        />
        <div className="projects-list-container">
          <div className="projects-list-header">
            <h2>Projects ({filteredProjects.length} total)</h2>
            <div className="sort-controls">
              <label>Sort by:</label>
              <button 
                className={`sort-btn ${sortBy === 'startYear' ? 'active' : ''}`}
                onClick={() => handleSort('startYear')}
              >
                Start Year {sortBy === 'startYear' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'endYear' ? 'active' : ''}`}
                onClick={() => handleSort('endYear')}
              >
                End Year {sortBy === 'endYear' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                className={`sort-btn ${sortBy === 'budget' ? 'active' : ''}`}
                onClick={() => handleSort('budget')}
              >
                Budget {sortBy === 'budget' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              {sortBy && (
                <button 
                  className="sort-btn clear-sort"
                  onClick={() => setSortBy('')}
                >
                  Clear Sort
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <p>Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <p>No projects found matching your criteria.</p>
          ) : (
            <>
              <div className="projects-grid">
                {paginatedProjects.map(project => (
                  <ProjectCard project={project} key={project.id} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
