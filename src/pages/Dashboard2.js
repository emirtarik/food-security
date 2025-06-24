import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CountryMapView from '../components/CountryMapView';
import ProjectDataInput from '../components/ProjectDataInput'; // Import the new component
import projectsData from '../data/projects.json'; // For future use
import '../styles/Dashboard2.css';

// Mock data for CountryMapView - replace with actual data fetching or props later
const mockMapData = []; // Or some default structure if CountryMapView requires it
const mockCurrentPeriod = "October-2024"; // Example, make this dynamic later
const mockOtherPeriod = "June-2024"; // Example, make this dynamic later


function Dashboard2({ setIsLoggedIn: appSetIsLoggedIn, setRole: appSetRole, setCountry: appSetCountry }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Props from navigation state (from ModuleSelection.js) or localStorage
  const initialRole = location.state?.role || localStorage.getItem('role');
  const initialCountry = location.state?.country || localStorage.getItem('country');

  const [role, setRole] = useState(initialRole);
  const [country, setCountry] = useState(initialCountry);

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
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
          <img src="/logo128.png" alt="RPCA Logo" className="institution-logo" />
        </div>
      </div>

      <div className="dashboard2-content">
        <div className="country-specific-interface">
          <h3>Country Specific Interface for {country}</h3>
          <p>
            This section will display country-specific information for Module 2.
          </p>
          <ProjectDataInput /> {/* Render the new component here */}
        </div>

        <div className="country-map-view-container">
          <h3>Country Map View</h3>
          <CountryMapView
            country={country}
            currentPeriod={mockCurrentPeriod} // Replace with actual data/prop
            otherPeriod={mockOtherPeriod}   // Replace with actual data/prop
            data={mockMapData}           // Replace with actual data/prop
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard2;
