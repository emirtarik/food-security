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
  // Initialize filters with "All" as default for new dropdowns
  const [filters, setFilters] = useState({
    donor: 'All',
    status: 'All',
    fundingAgency: '',
    implementingAgency: '',
    recipient: 'All',
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
    const donors = new Set(projects.map(p => p.donor).filter(Boolean));
    return ["All", ...Array.from(donors).sort()];
  }, [projects]);

  const recipientOptions = useMemo(() => {
    const recipients = new Set(projects.map(p => p.recipient).filter(Boolean));
    return ["All", ...Array.from(recipients).sort()];
  }, [projects]);

  const startYearOptions = useMemo(() => {
    const years = new Set(projects.map(p => p.start ? new Date(p.start).getFullYear() : null).filter(Boolean));
    return ["All", ...Array.from(years).sort((a, b) => a - b)];
  }, [projects]);

  const endYearOptions = useMemo(() => {
    const years = new Set(projects.map(p => p.end ? new Date(p.end).getFullYear() : null).filter(Boolean));
    return ["All", ...Array.from(years).sort((a, b) => a - b)];
  }, [projects]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const filteredProjects = useMemo(() => {
    let tempProjects = [...projects];

    // Updated filtering logic for dropdowns
    if (filters.donor && filters.donor !== "All") {
      tempProjects = tempProjects.filter(p => p.donor === filters.donor);
    }
    if (filters.status && filters.status !== "All") {
      tempProjects = tempProjects.filter(p => p.status === filters.status);
    }
    if (filters.fundingAgency) {
      tempProjects = tempProjects.filter(p => p.fundingAgency?.toLowerCase().includes(filters.fundingAgency.toLowerCase()));
    }
    if (filters.implementingAgency) {
      tempProjects = tempProjects.filter(p => p.implementingAgency?.toLowerCase().includes(filters.implementingAgency.toLowerCase()));
    }
    if (filters.recipient && filters.recipient !== "All") {
      tempProjects = tempProjects.filter(p => p.recipient === filters.recipient);
    }
    if (filters.startYear && filters.startYear !== "All") {
      const startYearVal = parseInt(filters.startYear);
      tempProjects = tempProjects.filter(p => p.start && new Date(p.start).getFullYear() >= startYearVal);
    }
    if (filters.endYear && filters.endYear !== "All") {
      const endYearVal = parseInt(filters.endYear);
      tempProjects = tempProjects.filter(p => p.end && new Date(p.end).getFullYear() <= endYearVal);
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
    return tempProjects;
  }, [projects, filters]);

  return (
    <div>
      <Header />
      <SubHeader /> {/* Assuming Projects page might have a SubHeader, adjust as needed */}
      <div className="projects-page-container">
        <MapViewProjects projects={filteredProjects} />
        <div className="filters-container">
          <div className="filter-item">
            <label htmlFor="donor">Donor:</label>
            <select id="donor" value={filters.donor} onChange={(e) => handleFilterChange('donor', e.target.value)}>
              {donorOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="status">Status:</label>
            <select id="status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="All">All</option>
              <option value="Planned">Planned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-item">
            <label htmlFor="fundingAgency">Funding Agency:</label>
            <input type="text" id="fundingAgency" value={filters.fundingAgency} onChange={(e) => handleFilterChange('fundingAgency', e.target.value)} />
          </div>
          <div className="filter-item">
            <label htmlFor="implementingAgency">Implementing Agency:</label>
            <input type="text" id="implementingAgency" value={filters.implementingAgency} onChange={(e) => handleFilterChange('implementingAgency', e.target.value)} />
          </div>
          <div className="filter-item">
            <label htmlFor="recipient">Recipient:</label>
            <select id="recipient" value={filters.recipient} onChange={(e) => handleFilterChange('recipient', e.target.value)}>
              {recipientOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
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
          <h2>Projects</h2>
          {loading ? (
            <p>Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <p>No projects found matching your criteria.</p>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map(project => (
                <ProjectCard project={project} key={project.id} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
