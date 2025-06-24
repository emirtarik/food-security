// src/App.js

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import FourOFour from './pages/404';
import Loading from './components/Loading';
import TooltipTest from './components/TooltipTest'; // Adjust the path accordingly
import MapView from './components/MapView'; // New import for the MapView component

const LazyAnalysis = lazy(() => import('./pages/Analysis'));
const LazyProjects = lazy(() => import('./pages/Projects'));
const LazyToolkit = lazy(() => import('./pages/Toolkit'));
const LazyInstuments = lazy(() => import('./pages/Toolkits/SetofInstruments'));
const LazyCGovSAN = lazy(() => import('./pages/Toolkits/CGovSAN'));
const LazyResources = lazy(() => import('./pages/Resources'));
const LazyArchive = lazy(() => import('./pages/Resources/Archive'));  // NEW: Import Archive page
const LazyDocuments = lazy(() => import('./pages/Resources/Documents'));
const LazyDocumentDetail = lazy(() => import('./pages/Resources/DocumentDetail'));
const LazyMaps = lazy(() => import('./pages/Resources/MapStatic'));
const LazyVideos = lazy(() => import('./pages/Resources/Videos'));
const LazyTopics = lazy(() => import('./pages/Topics'));
const LazyEvents = lazy(() => import('./pages/Events'));
const LazyOpportunities = lazy(() => import('./pages/Opportunity'));
const LazyPosts = lazy(() => import('./pages/Posts'));
const LazyAbout = lazy(() => import('./pages/About'));
const LazyPartners = lazy(() => import('./pages/Partners'));
const LazyEventPage = lazy(() => import('./pages/EventPage'));
const LazyLogin = lazy(() => import('./pages/Login'));
const LazyDashboard = lazy(() => import('./pages/Dashboard'));
const LazyQuestionnaire = lazy(() => import('./pages/Questionnaire')); // Import the Questionnaire page

// NEW lazy imports for ModuleSelection and Dashboard2
const LazyModuleSelection = lazy(() => import('./pages/ModuleSelection'));
const LazyDashboard2 = lazy(() => import('./pages/Dashboard2'));

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // Track the user's role
  const [country, setCountry] = useState(null); // Track the user's country
  const [submittedResponses, setSubmittedResponses] = useState(null); // Store the submitted responses

  // Sync state with localStorage on component mount
  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    const storedCountry = localStorage.getItem('country');
    const storedRole = localStorage.getItem('role');

    setIsLoggedIn(loggedInStatus);
    setCountry(storedCountry);
    setRole(storedRole);
  }, []); // Only run on initial mount

  const handleLogin = (status, userRole, userCountry) => {
    setIsLoggedIn(status);
    setRole(userRole);
    setCountry(userCountry);

    // Save login state to localStorage
    localStorage.setItem('isLoggedIn', status ? 'true' : 'false');
    localStorage.setItem('country', userCountry);
    localStorage.setItem('role', userRole);
  };

  const handleQuestionnaireSubmit = (submissionData) => {
    console.log('Questionnaire submission data:', submissionData); // Debugging
    setSubmittedResponses(submissionData.responses); // Store the submitted questionnaire responses
  };

  return (
    <div>
      <Router basename="/">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* /login route: redirect masters to module-selection, others to their questionnaire */}
          <Route
            path="/login"
            element={
              isLoggedIn && role !== 'master' ? (
                <Navigate to={`/questionnaire/${role || 'section1'}`} replace />
              ) : isLoggedIn && role === 'master' ? (
                <Navigate to="/module-selection" replace />
              ) : (
                <Suspense fallback={<Loading />}>
                  <LazyLogin onLogin={handleLogin} />
                </Suspense>
              )
            }
          />

          {/* Protected questionnaire route */}
          <Route
            path="/questionnaire/:section"
            element={
              isLoggedIn ? (
                <Suspense fallback={<Loading />}>
                  <LazyQuestionnaire
                    role={role}
                    country={country}
                    onSubmit={handleQuestionnaireSubmit}
                    setIsLoggedIn={setIsLoggedIn}
                    setRole={setRole}
                    setCountry={setCountry}
                  />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Suspense fallback={<Loading />}>
                  <LazyDashboard
                    responses={submittedResponses}
                    role={role}
                    country={country}
                    setIsLoggedIn={setIsLoggedIn}
                    setRole={setRole}
                    setCountry={setCountry}
                  />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* NEW protected ModuleSelection route for master users */}
          <Route
            path="/module-selection"
            element={
              isLoggedIn && role === 'master' ? (
                <Suspense fallback={<Loading />}>
                  <LazyModuleSelection
                    role={role}
                    country={country}
                    setIsLoggedIn={setIsLoggedIn}
                    setRole={setRole}
                    setCountry={setCountry}
                  />
                </Suspense>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* NEW Dashboard2 route: master → Dashboard2, others → their questionnaire */}
          <Route
            path="/dashboard2"
            element={
              isLoggedIn && role === 'master' ? (
                <Suspense fallback={<Loading />}>
                  <LazyDashboard2
                    role={role}
                    country={country}
                    setIsLoggedIn={setIsLoggedIn}
                    setRole={setRole}
                    setCountry={setCountry}
                  />
                </Suspense>
              ) : isLoggedIn && role !== 'master' ? (
                <Navigate to={role ? `/questionnaire/${role}` : '/login'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Other public and protected routes */}
          <Route path="/analysis-and-response" element={<Suspense fallback={<Loading />}><LazyAnalysis /></Suspense>} />
          <Route path="/analysis" element={<Suspense fallback={<Loading />}><LazyAnalysis /></Suspense>} />
          <Route path="/analysis-and-response/analysis" element={<Navigate to="/analysis" />} />
          <Route path="/response" element={<Suspense fallback={<Loading />}><LazyProjects /></Suspense>} />
          <Route path="/analysis-and-response/response" element={<Navigate to="/response" />} />
          <Route path="/analysis-and-response/toolkit" element={<Suspense fallback={<Loading />}><LazyToolkit /></Suspense>} />
          <Route path="/analysis-and-response/toolkit/set-of-instruments" element={<Suspense fallback={<Loading />}><LazyInstuments /></Suspense>} />
          <Route path="/analysis-and-response/toolkit/c-gov-san" element={<Suspense fallback={<Loading />}><LazyCGovSAN /></Suspense>} />

          <Route path="/resources" element={<Suspense fallback={<Loading />}><LazyResources /></Suspense>} />
          <Route path="/resources/archive" element={
            <Suspense fallback={<Loading />}>
              <LazyArchive />
            </Suspense>
          } />
          <Route path="/resources/documents" element={<Suspense fallback={<Loading />}><LazyDocuments /></Suspense>} />
          <Route path="/documents/:bllink" element={<Suspense fallback={<Loading />}><LazyDocumentDetail /></Suspense>} />
          <Route path="/resources/maps" element={<Suspense fallback={<Loading />}><LazyMaps /></Suspense>} />
          <Route path="/resources/multimedia" element={<Suspense fallback={<Loading />}><LazyVideos /></Suspense>} />
          <Route path="/topics" element={<Suspense fallback={<Loading />}><LazyTopics /></Suspense>} />
          <Route path="/event-and-opportunities" element={<Suspense fallback={<Loading />}><LazyEvents /></Suspense>} />
          <Route path="/event-and-opportunities/event" element={<Suspense fallback={<Loading />}><LazyEvents /></Suspense>} />
          <Route path="/event-and-opportunities/opportunities" element={<Suspense fallback={<Loading />}><LazyOpportunities /></Suspense>} />
          <Route path="/about" element={<Navigate to="/about/who-are-we" />} />
          <Route path="/about/members" element={<Suspense fallback={<Loading />}><LazyPartners /></Suspense>} />
          <Route path="/about/:permalink" element={<Suspense fallback={<Loading />}><LazyAbout /></Suspense>} />
          <Route path="/post/:permalink" element={<Suspense fallback={<Loading />}><LazyPosts /></Suspense>} />
          <Route path="/event-and-opportunities/event/:year/:permalink" element={<Suspense fallback={<Loading />}><LazyEventPage /></Suspense>} />

          {/* TooltipTest and MapView */}
          <Route
            path="/tooltip-test"
            element={
              <Suspense fallback={<Loading />}>
                <TooltipTest />
              </Suspense>
            }
          />
          <Route path="/mapview" element={<MapView />} />

          {/* 404 fallback */}
          <Route path="*" element={<FourOFour />} />
        </Routes>
      </Router>
    </div>
  );
}
