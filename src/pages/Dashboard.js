// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { apiClient } from '../apiClient';
import SummaryTable from '../components/SummaryTable';
import SummaryGraphs from '../components/SummaryGraphs';
import PerformanceTable from '../components/PerformanceTable';
// Removed CHTable import as it's no longer needed
import ActionPlans from '../components/ActionPlans'; // Import the ActionPlans component
import QuestionComments from '../components/QuestionComments'; // Import the QuestionComments component
import '../styles/Dashboard.css';

function Dashboard({ setIsLoggedIn, setRole, setCountry }) {

  const location = useLocation(); 
  const navigate = useNavigate(); 

  const submittedResponses = location.state?.submittedResponses || {};
  const initialCountry = location.state?.country || localStorage.getItem('country');
  const role = location.state?.role || localStorage.getItem('role');

  const [country, setSelectedCountry] = useState(initialCountry);
  const [year, setYear] = useState(''); 
  const [month, setMonth] = useState(''); 
  const [availableCountries, setAvailableCountries] = useState([]); 
  const [availableMonths, setAvailableMonths] = useState([]); 
  const [storedResponses, setStoredResponses] = useState(submittedResponses || {}); 
  const [averageScore, setAverageScore] = useState(0); 
  const [sectionAverages, setSectionAverages] = useState({}); 
  const [subsectionAverages, setSubsectionAverages] = useState({}); 
  const [apiPerformanceScore, setApiPerformanceScore] = useState();
  const [apiFinancingNeed, setApiFinancingNeed] = useState();
  const [apiFinancingMobilized, setApiFinancingMobilized] = useState();
  const [noData, setNoData] = useState(false); 

  // New states for savedActionPlans and questionComments
  const [savedActionPlans, setSavedActionPlans] = useState({});
  const [questionComments, setQuestionComments] = useState({}); // State to hold comments for each question

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('country');
    localStorage.removeItem('role');

    setIsLoggedIn(false);
    setRole(null);
    setCountry(null);

    navigate('/login');
  };

  useEffect(() => {
    const fetchAvailableCountries = async () => {
      try {
        const { data } = await apiClient.get('/available-countries');
        setAvailableCountries(data);
      } catch (error) {
        console.error('Error fetching available countries:', error);
      }
    };

    fetchAvailableCountries();
  }, []);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        if (year && country) {
          const { data } = await apiClient.get('/available-months', {
            params: { country, year },
          });
          setAvailableMonths(data);
          setMonth(data[0] || ''); 
        } else {
          setAvailableMonths([]);
          setMonth('');
        }
      } catch (error) {
        console.error('Error fetching available months:', error);
      }
    };

    if (country && year) {
      fetchAvailableMonths();
    }
  }, [country, year]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (year && month && country) {
          const { data } = await apiClient.get('/dashboard-responses', {
            params: {
              country,
              year,
              month,
            },
          });

          const {responses, savedActionPlans: fetchedSavedActionPlans, questionComments: fetchedQuestionComments, performanceScore: rawPerfScore, financingNeed: rawFinNeed, financingMobilized: rawFinMobilized} = data;          
          console.log('Fetched responses:', responses); // Log fetched responses to check if data is received correctly
          console.log('Fetched metrics:', {performanceScore: rawPerfScore, financingNeed:   rawFinNeed, financingMobilized: rawFinMobilized});
          if (responses && Object.keys(responses).length > 0) {
            setStoredResponses(responses);
            setSavedActionPlans(fetchedSavedActionPlans || {});
            setQuestionComments(fetchedQuestionComments || {}); // Set questionComments
            setApiPerformanceScore(rawPerfScore != null ? Number(rawPerfScore) : undefined);
            setApiFinancingNeed(rawFinNeed != null ? Number(rawFinNeed) : undefined);
            setApiFinancingMobilized(rawFinMobilized != null ? Number(rawFinMobilized) : undefined);
            setNoData(false);
          } else {
            setNoData(true);
            setStoredResponses({});
            setSavedActionPlans({});
            setQuestionComments({});
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setNoData(true);
          setStoredResponses({});
          setSavedActionPlans({});
          setQuestionComments({});
        } else {
          console.error('Error fetching dashboard responses:', error);
        }
      }
    };

    if (country && year && month) {
      fetchDashboardData();
    }
  }, [country, year, month]);

  useEffect(() => {
    if (storedResponses && Object.keys(storedResponses).length > 0) {
      const subsectionScores = {};

      // Iterate through indexed responses and group by subsection based on the first two digits of the index
      Object.keys(storedResponses).forEach((indexKey) => {
        const score = storedResponses[indexKey];
        if (typeof score === 'number') {
          // Extract subsection identifier from the first two digits of the index key
          const subsectionNumber = indexKey.substring(0, 2);

          // Initialize subsection array if it doesn't exist
          if (!subsectionScores[subsectionNumber]) {
            subsectionScores[subsectionNumber] = [];
          }

          // Add the score to the appropriate subsection
          subsectionScores[subsectionNumber].push(score);
        }
      });

      console.log('Mapped subsection scores:', subsectionScores); // Log mapped subsection scores to check if data is mapped correctly

      // Calculate averages for each subsection and section
      const calculatedSectionAverages = {};
      const calculatedSubsectionAverages = {};

      Object.keys(subsectionScores).forEach((subsection) => {
        const scores = subsectionScores[subsection];
        const sectionNumber = subsection.charAt(0);
        const sectionKey = `section${sectionNumber}`;

        if (!calculatedSubsectionAverages[sectionKey]) {
          calculatedSubsectionAverages[sectionKey] = {};
        }

        if (scores.length > 0) {
          const average = scores.reduce((a, b) => a + b, 0) / scores.length;
          calculatedSubsectionAverages[sectionKey][subsection] = average.toFixed(1);
        } else {
          calculatedSubsectionAverages[sectionKey][subsection] = '0.0';
        }
      });

      // Calculate section averages from subsection averages
      Object.keys(calculatedSubsectionAverages).forEach((section) => {
        const subsections = calculatedSubsectionAverages[section];
        const subsectionScores = Object.values(subsections).map(Number);
        if (subsectionScores.length > 0) {
          const sectionAverage =
            subsectionScores.reduce((a, b) => a + b, 0) / subsectionScores.length;
          calculatedSectionAverages[section] = sectionAverage.toFixed(1);
        } else {
          calculatedSectionAverages[section] = '0.0';
        }
      });

      console.log('Calculated section averages:', calculatedSectionAverages); // Log calculated section averages
      console.log('Calculated subsection averages:', calculatedSubsectionAverages); // Log calculated subsection averages

      // Calculate overall average from section averages (not individual questions)
      // This ensures the overall score is the average of section averages
      const sectionScores = Object.values(calculatedSectionAverages).map(Number).filter(score => !isNaN(score) && score > 0);
      
      let overallAverage = 0;
      if (sectionScores.length > 0) {
        const sectionSum = sectionScores.reduce((sum, score) => sum + score, 0);
        const avgOnScale0to5 = sectionSum / sectionScores.length;
        // Convert from 0-5 scale to 0-100 scale
        overallAverage = avgOnScale0to5 * 20;
      }

      setSectionAverages(calculatedSectionAverages);
      setSubsectionAverages(calculatedSubsectionAverages);
      setAverageScore(overallAverage);
    } else {
      // Reset averages if no data is present
      setAverageScore(0);
      setSectionAverages({
        section1: {},
        section2: {},
        section3: {},
        section4: {},
      });
      setSubsectionAverages({
        section1: {},
        section2: {},
        section3: {},
        section4: {},
      });
    }
  }, [storedResponses]);

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="flag-container">
          <img src={`/flags/${country?.toLowerCase().replace(' ', '-')}.svg`} alt={`${country} flag`} className="country-flag" />
        </div>
        <div className="title-container">
          <h2>DASHBOARD</h2>
          <h4>{country}</h4>
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
          <button className="logout-button" onClick={handleLogout}>Logout</button>
          <img src="logo128.png" alt="RPCA Logo" className="institution-logo" />
        </div>
      </div>

      {/* Time Selector */}
      <div className="time-selector-container">
        <label>
          Sélectionnez un pays :
          <select value={country} onChange={(e) => setSelectedCountry(e.target.value)}>
            <option value="">Sélectionnez un pays</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sélectionnez l'année :
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Sélectionnez l'année</option>
            {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
  
        <label>
          Sélectionnez le mois :
          <select value={month} onChange={(e) => setMonth(e.target.value)} disabled={!year || availableMonths.length === 0}>
            <option value="">Sélectionnez le mois</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Data Display */}
      {noData ? (
        <p>No submitted data found for the selected country, year, and month.</p>
      ) : (
        <div className="dashboard-grid">
          {/* Charts Container */}
          <div className="charts-container">
            <SummaryGraphs averageScore={averageScore} sectionAverages={sectionAverages} storedResponses={storedResponses} />
          </div>
          
          {/* Tables and Performance Container */}
          <div className="tables-performance-container">
            {/* Table Performance Wrapper */}
            <div className="table-performance-wrapper">
              <div className="table-container">
                <SummaryTable sectionAverages={sectionAverages} subsectionAverages={subsectionAverages} />
                
                {/* ********** Integrated ActionPlans Component ********** */}
                <ActionPlans savedActionPlans={savedActionPlans} />
                {/* ********** End of ActionPlans Component ********** */}
                
                {/* ********** Integrated QuestionComments Component ********** */}
                <QuestionComments questionComments={questionComments} />
                {/* ********** End of QuestionComments Component ********** */}
              </div>
            </div>
            
            {/* Performance Table Container */}
            <div className="performance-table-container">
              <PerformanceTable 
                country={country}
                performanceScore={apiPerformanceScore}
                financingNeed={apiFinancingNeed}
                financingMobilized={apiFinancingMobilized}
              />
            </div>
          </div>
        </div>
      )}

      {/* Removed CHTable as per the requirement */}
    </div>
  );
}

export default Dashboard;
