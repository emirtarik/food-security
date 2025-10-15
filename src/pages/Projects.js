import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header.js';
import SubHeader from './SubHeader.js';
import Footer from './Footer.js';
import MapViewProjects from '../components/MapViewProjects.js';
import ProjectCard from '../components/ProjectCard.js';
import projectDataPlaceholder from '../data/projects.json';
import '../styles/Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(''); // '', 'startYear', 'endYear', 'budget'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const itemsPerPage = 20;
  
  // Initialize filters with "All" as default for new dropdowns
  const [filters, setFilters] = useState({
    donors: ['EU'], // Pre-select EU to show EU projects on first load
    fundingAgency: '',
    implementingAgency: '',
    recipientCountries: [], // Changed to array for multi-select
    startYear: 'All',
    endYear: 'All',
    budgetUSD: 'All',
  });

  useEffect(() => {
    // Handle potential BOM character in donor key
    const cleanedProjects = projectDataPlaceholder.map(p => ({
      ...p,
      donor: p['\uFEFFdonor'] || p.donor,
    }));
    setProjects(cleanedProjects);
    setLoading(false);
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

  const startYearOptions = useMemo(() => {
    const years = [];
    for (let year = 1970; year <= 2030; year++) {
      years.push(year);
    }
    return ["All", ...years];
  }, []);

  const endYearOptions = useMemo(() => {
    const years = [];
    for (let year = 1970; year <= 2030; year++) {
      years.push(year);
    }
    return ["All", ...years];
  }, []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

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
    if (filters.fundingAgency) {
      tempProjects = tempProjects.filter(p => p.fundingAgency?.toLowerCase().includes(filters.fundingAgency.toLowerCase()));
    }
    if (filters.implementingAgency) {
      tempProjects = tempProjects.filter(p => p.implementingAgency?.toLowerCase().includes(filters.implementingAgency.toLowerCase()));
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
    if (filters.startYear && filters.startYear !== "All") {
      const startYearVal = parseInt(filters.startYear);
      tempProjects = tempProjects.filter(p => {
        // Handle both year numbers and date strings
        const projectStartYear = typeof p.start === 'number' ? p.start : 
                                  p.start ? new Date(p.start).getFullYear() : null;
        return projectStartYear && projectStartYear >= startYearVal;
      });
    }
    if (filters.endYear && filters.endYear !== "All") {
      const endYearVal = parseInt(filters.endYear);
      tempProjects = tempProjects.filter(p => {
        // Handle both year numbers and date strings
        const projectEndYear = typeof p.end === 'number' ? p.end : 
                                p.end ? new Date(p.end).getFullYear() : null;
        return projectEndYear && projectEndYear <= endYearVal;
      });
    }
    // Ensure budgetUSD filter also checks for "All" or specific value
    if (filters.budgetUSD && filters.budgetUSD !== "All") {
      switch (filters.budgetUSD) {
        case "<1M USD":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD === 'number' && p.budgetUSD < 1000000);
          break;
        case "1M<5M USD":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD === 'number' && p.budgetUSD >= 1000000 && p.budgetUSD < 5000000);
          break;
        case "5M<10M USD":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD === 'number' && p.budgetUSD >= 5000000 && p.budgetUSD < 10000000);
          break;
        case "10M<100M USD":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD === 'number' && p.budgetUSD >= 10000000 && p.budgetUSD < 100000000);
          break;
        case ">100M USD":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD === 'number' && p.budgetUSD >= 100000000);
          break;
        case "Other":
          tempProjects = tempProjects.filter(p => typeof p.budgetUSD !== 'number' || p.budgetUSD === null);
          break;
        default:
          break;
      }
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
        <MapViewProjects 
          projects={filteredProjects} 
          filters={filters}
          setFilters={setFilters}
          donorOptions={donorOptions}
          recipientCountryOptions={recipientCountryOptions}
        />
        <div className="filters-container">
          <div className="filter-item">
            <label htmlFor="fundingAgency">Funding Agency:</label>
            <input type="text" id="fundingAgency" value={filters.fundingAgency} onChange={(e) => handleFilterChange('fundingAgency', e.target.value)} />
          </div>
          <div className="filter-item">
            <label htmlFor="implementingAgency">Implementing Agency:</label>
            <input type="text" id="implementingAgency" value={filters.implementingAgency} onChange={(e) => handleFilterChange('implementingAgency', e.target.value)} />
          </div>
          <div className="filter-item">
            <label htmlFor="startYear">Start Year:</label>
            <select id="startYear" value={filters.startYear} onChange={(e) => handleFilterChange('startYear', e.target.value)}>
              {startYearOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="endYear">End Year:</label>
            <select id="endYear" value={filters.endYear} onChange={(e) => handleFilterChange('endYear', e.target.value)}>
              {endYearOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="budgetUSD">Budget (USD):</label>
            <select id="budgetUSD" value={filters.budgetUSD} onChange={(e) => handleFilterChange('budgetUSD', e.target.value)}>
              <option value="All">All</option>
              <option value="<1M USD">&lt;1M USD</option>
              <option value="1M<5M USD">1M &lt; 5M USD</option>
              <option value="5M<10M USD">5M &lt; 10M USD</option>
              <option value="10M<100M USD">10M &lt; 100M USD</option>
              <option value=">100M USD">&gt;100M USD</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
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
