import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CountryProjectsMapView from '../components/CountryProjectsMapView';
import ProjectDataInput from '../components/ProjectDataInput'; // Import the new component
import ResponsePackagesTable from '../components/ResponsePackagesTable';
import ProjectsSynergyTable from '../components/ProjectsSynergyTable';
import '../styles/Dashboard2.css';

// Mock data for CountryMapView - replace with actual data fetching or props later
const mockMapData = []; // Or some default structure if CountryMapView requires it
const mockCurrentPeriod = "November-2024"; // Example, make this dynamic later
const mockOtherPeriod = "June-2024"; // Example, make this dynamic later


function Dashboard2({ setIsLoggedIn: appSetIsLoggedIn, setRole: appSetRole, setCountry: appSetCountry }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Props from navigation state (from ModuleSelection.js) or localStorage
  const initialRole = location.state?.role || localStorage.getItem('role');
  const initialCountry = location.state?.country || localStorage.getItem('country');

  const [role, setRole] = useState(initialRole);
  const [country, setCountry] = useState(initialCountry);
  // Tabs for submission forms only
  const [activeSubmissionTab, setActiveSubmissionTab] = useState('projectSubmission');

  // Effect to ensure role and country are synced with App.js state if available
  // and also to handle direct navigation / refresh scenarios using localStorage.
  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedCountry = localStorage.getItem('country');

    if (storedRole) setRole(storedRole);
    if (storedCountry) setCountry(storedCountry);

    // If App.js setters are provided, ensure they are updated (e.g. on first load via this page)
    if (appSetRole && storedRole) appSetRole(storedRole);
    if (appSetCountry && storedCountry) appSetCountry(storedCountry);

  }, [appSetRole, appSetCountry]);


  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
    // Ensure only 'master' role can access this page directly (as per requirements)
    // However, App.js routing should primarily handle this. This is a safeguard.
    if (role !== 'master') {
      // console.warn("Dashboard2 accessed by non-master role. Redirecting.");
      // navigate('/login'); // Or to an appropriate page
    }
  }, [navigate, role]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('country');

    if (appSetIsLoggedIn) appSetIsLoggedIn(false);
    if (appSetRole) appSetRole(null);
    if (appSetCountry) appSetCountry(null);

    navigate('/login');
  };

  if (!role || !country) {
    return <div>Loading user data or redirecting...</div>;
  }

  return (
    <div className="dashboard2-container">
      <div className="dashboard2-header">
        <div className="flag-container">
          {country && (
            <img
              src={`/flags/${country.toLowerCase().replace(/\s+/g, '-')}.svg`}
              alt={`${country} flag`}
              className="country-flag"
            />
          )}
        </div>
        <div className="title-container">
          <h2>C-GOVSAN Module 2 Dashboard</h2>
          <h4>{country} (Role: {role})</h4>
        </div>
        <div className="logo-container">
          <button 
            className="module-selection-button" 
            onClick={() => navigate('/module-selection')}
            style={{
              marginRight: '10px',
              padding: '8px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Module Selection
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
          <img src="/logo128.png" alt="RPCA Logo" className="institution-logo" />
        </div>
      </div>

      <div className="dashboard2-content">
        <div className="dashboard2-main">
          <div className="country-map-view-container">
            <h3>Projects Map</h3>
            <CountryProjectsMapView country={country} />
          </div>

          <div className="info-panels">
            <div className="info-card">
              <h4>Summary Dashboard</h4>
              <p className="muted">Draft: KPIs and charts derived from submissions (Battery/Speedometer, Dashboard (2)).</p>
            </div>
            <div className="info-card">
              <h4>Parameters</h4>
              <p className="muted">Read-only reference parameters from the workbook (e.g., working days, group sizes). Later: admin override.</p>
            </div>
          </div>
        </div>

        <div className="submissions-section">
          <div className="tab-container">
            <button 
              className={`tab-button ${activeSubmissionTab === 'projectSubmission' ? 'active-tab' : ''}`} 
              onClick={() => setActiveSubmissionTab('projectSubmission')}
            >
              1. Project Submission
            </button>
            <button 
              className={`tab-button ${activeSubmissionTab === 'consensusSynergy' ? 'active-tab' : ''}`} 
              onClick={() => setActiveSubmissionTab('consensusSynergy')}
            >
              2. Consensus et synergie Rép
            </button>
          </div>

          <div className="tab-content">
            {activeSubmissionTab === 'projectSubmission' && (
              <div className="country-specific-interface">
                <ProjectDataInput
                  country={country}
                  onSubmit={async (formData) => {
                    const payload = {
                      country,
                      admin1: formData.admin1,
                      donor: formData.donor || null,
                      title: formData.title,
                      status: formData.status || null,
                      fundingAgency: formData.fundingAgency || null,
                      implementingAgency: formData.implementingAgency || null,
                      recipient: formData.recipient || null,
                      zone: formData.zone || null,
                      start: formData.start ? Number(formData.start) : null,
                      end: formData.end ? Number(formData.end) : null,
                      currency: formData.currency || null,
                      budget: formData.budget !== '' && formData.budget != null ? Number(formData.budget) : null,
                      budgetUSD: formData.budgetUSD !== '' && formData.budgetUSD != null ? Number(formData.budgetUSD) : null,
                      link: formData.link || null,
                      img: formData.img || null,
                      comments: formData.comments || null,
                      topic: formData.topic || null,
                      categories: formData.categories || {},
                      createdBy: localStorage.getItem('username') || null
                    };

                    try {
                      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
                      const res = await fetch(`${apiBase}/projects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                      });
                      if (!res.ok) {
                        const msg = await res.text();
                        alert(`Failed to submit project: ${msg}`);
                        return false;
                      }
                      alert('Project submitted successfully.');
                      return true;
                    } catch (err) {
                      console.error('Project submit error:', err);
                      alert('Network or server error while submitting the project.');
                      return false;
                    }
                  }}
                />
              </div>
            )}

            {activeSubmissionTab === 'consensusSynergy' && (
              <div className="country-specific-interface">
                <div className="section-header">
                  <h3>2.1 Critères d'élaboration des paquets de réponse</h3>
                </div>
                <ResponsePackagesTable />
                <div style={{ height: 24 }} />
                <div className="section-header">
                  <h3>2.2 Interventions et projets en cours</h3>
                </div>
                <ProjectsSynergyTable country={country} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard2;
