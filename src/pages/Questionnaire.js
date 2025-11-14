// src/components/Questionnaire.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslationHook } from '../i18n';
import { apiClient } from '../apiClient';
import ActionPlans from '../components/ActionPlans'; // Import the ActionPlans component
import Questions from '../components/Questions'; // Import the Questions component
import QuestionComments from '../components/QuestionComments'; // Import the QuestionComments component
import dataFr from '../data/questionnaireData.json'; // French version
import dataEn from '../data/questionnaireData.en.json'; // English version
import { sectionMapping } from '../mappings'; // Import sectionMapping
import '../styles/Questionnaire.css';

// Utility function to flatten questionComments
const flattenQuestionComments = (dataFetched) => {
    const flattenedComments = {};

    Object.keys(dataFetched).forEach((sectionKey) => {
        const sectionData = dataFetched[sectionKey];
        
        // Aggregate comments if present
        if (sectionData.comments) {
            Object.keys(sectionData.comments).forEach((qKey) => {
                flattenedComments[qKey] = sectionData.comments[qKey];
            });
        }

        // Aggregate questionComments if present
        if (sectionData.questionComments) {
            Object.keys(sectionData.questionComments).forEach((qKey) => {
                flattenedComments[qKey] = sectionData.questionComments[qKey];
            });
        }
    });

    return flattenedComments;
};

function Questionnaire({ onSubmit, role, country, setIsLoggedIn, setRole, setCountry }) {

    const { section } = useParams(); // Get the section from the URL
    const navigate = useNavigate();
    const { t, currentLanguage, changeLanguage } = useTranslationHook("questionnaire");
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
    
    // Load the appropriate questionnaire data based on language
    const data = currentLanguage === 'en' ? dataEn : dataFr;
    
    useEffect(() => {
        setSelectedLanguage(currentLanguage);
    }, [currentLanguage]);

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
        setSelectedLanguage(lang);
    };
    
    const [responses, setResponses] = useState({});
    const [comments, setComments] = useState('');
    const [questionComments, setQuestionComments] = useState({}); // State to hold comments for each question
    const [showCommentBox, setShowCommentBox] = useState({}); // State to track visibility of comment boxes
    const [year, setYear] = useState(''); // Initially empty
    const [month, setMonth] = useState(''); // Initially empty
    const [isQuestionnaireVisible, setIsQuestionnaireVisible] = useState(false); // Whether to show the questionnaire
    const [existingDataLoaded, setExistingDataLoaded] = useState(false); // Whether existing data is loaded
    const [isSubmitted, setIsSubmitted] = useState(false); // Track if questionnaire was submitted

    // New states for additional questions
    const [performanceScore, setPerformanceScore] = useState(0);
    const [financingNeed, setFinancingNeed] = useState(0);
    const [financingMobilized, setFinancingMobilized] = useState(0);

    // Introduce a new state for per-question action plans
    const [actionPlansPerQuestion, setActionPlansPerQuestion] = useState({});

    // New state for saved action plans
    const [savedActionPlans, setSavedActionPlans] = useState({});

    // New states to track completeness for master users
    const [isComplete, setIsComplete] = useState(false);
    const [missingSections, setMissingSections] = useState([]);

    // Determine sectionIndex based on role (only for non-master users)
    const sectionIndex =
        role !== 'master'
            ? section === 'section1'
                ? 0
                : section === 'section2'
                    ? 1
                    : section === 'section3'
                        ? 2
                        : section === 'section4'
                            ? 3
                            : null
            : null; // Master users access all sections

    // Define currency options
    const currencyOptions = [
        { value: 'USD', label: 'USD - US Dollar' },
        { value: 'EUR', label: 'EUR - Euro' },
        { value: 'MRU', label: 'MRU - Mauritanian Ouguiya' },
        { value: 'XOF', label: 'XOF - West African CFA Franc' },
        { value: 'GMD', label: 'GMD - Gambian Dalasi' },
        { value: 'GNF', label: 'GNF - Guinean Franc' },
        { value: 'SLL', label: 'SLL - Sierra Leonean Leone' },
        { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
        { value: 'NGN', label: 'NGN - Nigerian Naira' },
        { value: 'XAF', label: 'XAF - Central African CFA Franc' },
    ];

    // Define marks for Slider
    const marks = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' },
    ];

    // Add handlers for per-question action plans

    // Add a new action plan for a specific question
    const handleAddActionPlan = (questionKey) => {
        setActionPlansPerQuestion((prev) => {
            const existingPlans = prev[questionKey] || [];
            return {
                ...prev,
                [questionKey]: [
                    ...existingPlans,
                    {
                        offerRequest: '',
                        year: '',
                        month: '',
                        budget: '',
                        currency: 'USD',
                        responsible: '',
                        isSaved: false,
                    }, // Added isSaved flag
                ],
            };
        });
    };

    // Handle changes in any of the Action Plan inputs for a specific question
    const handleActionPlanChange = (questionKey, index, field, value) => {
        setActionPlansPerQuestion((prev) => {
            const existingPlans = prev[questionKey] || [];
            const updatedPlans = existingPlans.map((plan, idx) =>
                idx === index ? { ...plan, [field]: value } : plan
            );
            return {
                ...prev,
                [questionKey]: updatedPlans,
            };
        });
    };

    // Handle deleting an action plan for a specific question
    const handleDeleteActionPlan = (questionKey, index) => {
        setActionPlansPerQuestion((prev) => {
            const existingPlans = prev[questionKey] || [];
            const updatedPlans = existingPlans.filter((_, idx) => idx !== index);
            return {
                ...prev,
                [questionKey]: updatedPlans,
            };
        });

        // Also remove from savedActionPlans if it was saved
        setSavedActionPlans((prev) => {
            const existingSaved = prev[questionKey] || [];
            const updatedSaved = existingSaved.filter((_, idx) => idx !== index);
            return {
                ...prev,
                [questionKey]: updatedSaved,
            };
        });
    };

    // Add handler for saving an action plan (both new and edited)
    const handleSaveActionPlan = (questionKey, index) => {
        setActionPlansPerQuestion((prev) => {
            const existingPlans = prev[questionKey] || [];
            const planToSave = existingPlans[index];

            // Validate the action plan fields before saving
            if (
                !planToSave.offerRequest ||
                !planToSave.year ||
                !planToSave.month ||
                !planToSave.budget ||
                !planToSave.currency ||
                !planToSave.responsible
            ) {
                alert(t('fillAllFields') || 'Please fill all fields before saving the action plan.');
                return prev;
            }

            // Update the isSaved flag
            const updatedPlans = existingPlans.map((plan, idx) =>
                idx === index ? { ...plan, isSaved: true } : plan
            );

            return {
                ...prev,
                [questionKey]: updatedPlans,
            };
        });

        setSavedActionPlans((prev) => {
            const existingSaved = prev[questionKey] || [];
            const planToSave = actionPlansPerQuestion[questionKey][index];
            const updatedSaved = [...existingSaved];

            if (actionPlansPerQuestion[questionKey][index].isSaved) {
                // If the plan was already saved, update it
                updatedSaved[index] = planToSave;
            } else {
                // If it's a new save, append it
                updatedSaved.push(planToSave);
            }

            return {
                ...prev,
                [questionKey]: updatedSaved,
            };
        });
    };

    // Add handler for editing an action plan
    const handleEditActionPlan = (questionKey, index) => {
        setActionPlansPerQuestion((prev) => {
            const existingPlans = prev[questionKey] || [];
            const updatedPlans = existingPlans.map((plan, idx) =>
                idx === index ? { ...plan, isSaved: false } : plan
            );
            return {
                ...prev,
                [questionKey]: updatedPlans,
            };
        });

        // Optionally, remove the action plan from savedActionPlans to allow re-saving
        setSavedActionPlans((prev) => {
            const existingSaved = prev[questionKey] || [];
            const updatedSaved = existingSaved.filter((_, idx) => idx !== index);
            return {
                ...prev,
                [questionKey]: updatedSaved,
            };
        });
    };

    // Reset form state when the user changes the year or month
    useEffect(() => {
        if (year || month) {
            // Reset the form and relevant states when year or month changes
            setResponses({});
            setComments('');
            setPerformanceScore(0);
            setFinancingNeed(0);
            setFinancingMobilized(0);
            // Reset per-question action plans instead of general action plan
            setActionPlansPerQuestion({});
            // Reset saved action plans
            setSavedActionPlans({});
            setIsSubmitted(false);
            setIsQuestionnaireVisible(false); // Hide the questionnaire until responses are loaded
            setExistingDataLoaded(false); // Reset data loading flag
            setIsComplete(false); // Reset completeness
            setMissingSections([]); // Reset missing sections
        }
    }, [year, month]);

    // Fetch existing responses when year and month are selected
    useEffect(() => {
        if (year && month) {
            const fetchExistingResponses = async () => {
                try {
                    let dataFetched;

                    if (role === 'master') {
                        // Fetch master responses
                        const response = await apiClient.get('/master-responses', {
                            params: { country, year, month },
                           });
                        dataFetched = response.data;
                        console.log('Fetched master data:', dataFetched);

                        // Flatten questionComments
                        const flattenedComments = flattenQuestionComments(dataFetched);
                        console.log('Flattened Question Comments:', flattenedComments); // Debugging

                        // Set the flattened questionComments
                        setQuestionComments(flattenedComments);

                        // Flatten responses, actionPlans, and savedActionPlans
                        const flattenedResponses = {};
                        const flattenedActionPlans = {};
                        const flattenedSavedActionPlans = {};

                        Object.keys(dataFetched).forEach((sectionKey) => {
                            const sectionData = dataFetched[sectionKey];
                            Object.keys(sectionData.responses).forEach((qKey) => {
                                // Assuming qKey is the same as question.index
                                flattenedResponses[qKey] = sectionData.responses[qKey];
                            });

                            Object.keys(sectionData.actionPlans).forEach((qKey) => {
                                flattenedActionPlans[qKey] = sectionData.actionPlans[qKey];
                            });

                            Object.keys(sectionData.savedActionPlans).forEach((qKey) => {
                                flattenedSavedActionPlans[qKey] = sectionData.savedActionPlans[qKey];
                            });
                        });

                        setResponses(flattenedResponses);
                        setComments(''); // Adjust if master has general comments
                        setActionPlansPerQuestion(flattenedActionPlans);
                        setSavedActionPlans(flattenedSavedActionPlans);

                        // *** Updated isComplete Logic Starts Here ***
                        const expectedSections = Object.keys(sectionMapping);
                        const fetchedSections = Object.keys(dataFetched);
                        const incompleteSections = expectedSections.filter((sectionKey) => {
                            return !dataFetched[sectionKey] || dataFetched[sectionKey].submitted !== true;
                        });

                        if (incompleteSections.length === 0) {
                            setIsComplete(true);
                        } else {
                            setIsComplete(false);
                            setMissingSections(
                                incompleteSections.map((key) => sectionMapping[key]?.title || key)
                            );
                        }
                        // *** Updated isComplete Logic Ends Here ***

                        setIsSubmitted(false); // Ensure master users can edit
                        setIsQuestionnaireVisible(true);
                        setExistingDataLoaded(true);
                    } else {
                        // Fetch regular responses
                        const response = await apiClient.get('/responses', {
                            params: { country, year, month, role },
                        });
                        dataFetched = response.data;
                        console.log('Fetched existing data:', dataFetched);

                        if (dataFetched.responses) {
                            setResponses(dataFetched.responses || {});
                            setComments(dataFetched.comments || '');
                            setPerformanceScore(dataFetched.performanceScore || 0);
                            setFinancingNeed(dataFetched.financingNeed || 0);
                            setFinancingMobilized(dataFetched.financingMobilized || 0);
                            setActionPlansPerQuestion(dataFetched.actionPlanPerQuestion || {});
                            setSavedActionPlans(dataFetched.savedActionPlans || {});
                            setQuestionComments(dataFetched.questionComments || {});
                            setIsSubmitted(dataFetched.submitted === true);
                            setIsQuestionnaireVisible(true);
                        } else {
                            console.log('No existing submission found, prompting to start a new one.');
                            const userWantsNew = window.confirm(
                                `${t('noExistingData')} ${year} ${t(`months.${month}`) || month}. ${t('startNewQuestionnaire')}`
                            );
                            if (userWantsNew) {
                                setIsQuestionnaireVisible(true); // Show a fresh questionnaire
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching existing responses:', error);
                    setIsSubmitted(false);
                }
            };

            fetchExistingResponses();
        }
    }, [country, year, month, role]);

    // Initialize default responses for master users or single section for others
    useEffect(() => {
        if (!existingDataLoaded) {
            if (role === 'master') {
                // Initialize responses for all sections
                const initialResponses = {};
                data.forEach((sectionData) => {
                    sectionData.subsections.forEach((sub) => {
                        sub.questions.forEach((question) => {
                            const key = question.index; // Use question.index as the key
                            if (!(key in responses)) {
                                // Avoid overwriting existing responses
                                initialResponses[key] = 1; // Set default value to 1
                            }
                        });
                    });
                });
                console.log('Setting initial responses for master user (no saved data):', initialResponses);
                setResponses((prev) => ({ ...initialResponses, ...prev }));
            } else {
                if (sectionIndex !== null && Object.keys(responses).length === 0 && !isSubmitted) {
                    // Initialize responses for specific section only if not submitted
                    const initialResponses = {};
                    data[sectionIndex].subsections.forEach((sub) => {
                        sub.questions.forEach((question) => {
                            const key = question.index; // Use question.index as the key
                            initialResponses[key] = 1; // Set default value to 1
                        });
                    });
                    console.log('Setting initial responses (no saved data):', initialResponses);
                    setResponses(initialResponses);
                } else {
                    console.log('Skipping initial response setup because submitted or responses exist');
                }
            }
            setExistingDataLoaded(true);
        }
    }, [sectionIndex, existingDataLoaded, responses, role, isSubmitted, data]);

    useEffect(() => {
        console.log('Current States:');
        console.log('performanceScore:', performanceScore, typeof performanceScore);
        console.log('financingNeed:', financingNeed, typeof financingNeed);
        console.log('financingMobilized:', financingMobilized, typeof financingMobilized);
    }, [performanceScore, financingNeed, financingMobilized]);

    const handleSliderChange = (key, value) => {
        if (!isSubmitted) {
            setResponses((prevResponses) => ({
                ...prevResponses,
                [key]: value,
            }));
        }
    };

    const handleCommentsChange = (e) => {
        if (!isSubmitted) {
            setComments(e.target.value);
        }
    };

    const handleQuestionCommentChange = (key, value) => {
        if (!isSubmitted) {
            setQuestionComments((prevComments) => ({
                ...prevComments,
                [key]: value,
            }));
        }
    };

    const handlePerformanceScoreChange = (e) => {
        if (!isSubmitted) {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) value = 0;
            value = Math.max(0, Math.min(value, 100));
            setPerformanceScore(value);
            console.log('Updated performanceScore:', value);
        }
    };

    const handleFinancingNeedChange = (e) => {
        if (!isSubmitted) {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) value = 0;
            value = Math.max(0, value);
            setFinancingNeed(value);
            console.log('Updated financingNeed:', value);
        }
    };

    const handleFinancingMobilizedChange = (e) => {
        if (!isSubmitted) {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) value = 0;
            value = Math.max(0, Math.min(value, 100));
            setFinancingMobilized(value);
            console.log('Updated financingMobilized:', value);
        }
    };

    const handleSave = async () => {
        if (isSubmitted) return;

        try {
            const saveData = {
                country,
                role,
                responses,
                comments,
                questionComments,
                actionPlanPerQuestion: actionPlansPerQuestion,
                savedActionPlans,
                year,
                month,
                submitted: false,
            };

            // Add master-specific fields if role is master
            if (role === 'master') {
                saveData.performanceScore = parseFloat(performanceScore);
                saveData.financingNeed = parseFloat(financingNeed);
                saveData.financingMobilized = parseFloat(financingMobilized);
            }

            // Remove undefined fields
            Object.keys(saveData).forEach(
                (key) => saveData[key] === undefined && delete saveData[key]
            );

            console.log('Saving Data:', JSON.stringify(saveData, null, 2));

            const endpoint = role === 'master' ? '/submit-master' : '/submit';
            await apiClient.post(endpoint, saveData);

            alert(t('saveSuccess'));
        } catch (error) {
            if (error.response) {
                console.error('Error saving questionnaire:', error.response.data);
                alert(`${t('saveError')} ${error.response.data}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                alert(t('noServerResponse'));
            } else {
                console.error('Error setting up request:', error.message);
                alert(`${t('error')} ${error.message}`);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!year || !month) {
            alert(t('selectYearMonth'));
            return;
        }

        // Example: Validate performanceScore, financingNeed, and financingMobilized if role is master
        if (role === 'master') {
            if (!performanceScore || isNaN(parseFloat(performanceScore))) {
                alert(t('validPerformanceScore'));
                return;
            }
            if (!financingNeed || isNaN(parseFloat(financingNeed))) {
                alert(t('validFinancingNeed'));
                return;
            }
            if (!financingMobilized || isNaN(parseFloat(financingMobilized))) {
                alert(t('validFinancingMobilized'));
                return;
            }
        }

        const confirmSubmit = window.confirm(t('submitConfirm'));

        if (!confirmSubmit) return;

        // Prepare Submission Data
        let submissionData = {
            country,
            role,
            responses,
            comments,
            questionComments,
            actionPlanPerQuestion: actionPlansPerQuestion,
            savedActionPlans,
            year,
            month,
            submitted: true,
        };

        // Add master-specific fields if role is master
        if (role === 'master') {
            submissionData = {
                ...submissionData,
                performanceScore: parseFloat(performanceScore),
                financingNeed: parseFloat(financingNeed),
                financingMobilized: parseFloat(financingMobilized),
            };
        }

        console.log('Submitting Data:', JSON.stringify(submissionData, null, 2));

        try {
            const endpoint = role === 'master' ? '/submit-master' : '/submit';
            const response = await apiClient.post(endpoint, submissionData);

            console.log('Submission Response:', response.data);

            if (onSubmit) {
                onSubmit(submissionData);
            }

            alert(t('submitSuccess'));
            navigate('/dashboard');
        } catch (error) {
            if (error.response) {
                // Server responded with a status other than 2xx
                console.error('Error submitting questionnaire:', error.response.data);
                alert(`${t('submitError')} ${error.response.data}`);
            } else if (error.request) {
                // No response received from server
                console.error('No response received:', error.request);
                alert(t('noServerResponse'));
            } else {
                // Error setting up the request
                console.error('Error setting up request:', error.message);
                alert(`${t('error')} ${error.message}`);
            }
        }
    };

    // Retain the handleLogout function as provided by the user
    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('country');

        setIsLoggedIn(false);
        setRole(null);
        setCountry(null);

        navigate('/login');
    };

    const handleSkipToDashboard = () => {
        console.log('Skip to Dashboard button clicked');

        console.log('Navigating to /dashboard with role:', role);

        navigate('/dashboard', {
            state: {
                role: role,
                country: country,
                // Do not pass 'submittedResponses'
            },
        });
    };

    // Function to show comment box
    const handleShowCommentBox = (key) => {
        if (!isSubmitted) {
            setShowCommentBox((prevShow) => ({
                ...prevShow,
                [key]: true,
            }));
        }
    };

    // Updated getQuestionText Function Using question.index
    const getQuestionText = (key) => {
        for (const section of data) {
            for (const sub of section.subsections) {
                for (const question of sub.questions) {
                    if (question.index === key) {
                        return question.text;
                    }
                }
            }
        }
        return 'Question inconnue';
    };

    // Function to render description levels
    const renderDescriptionLevels = (description) => {
        return (
            <ul className="description-list">
                {Object.keys(description).map((level, index) => (
                    <li key={index} className="description-item">
                        {description[level]}
                    </li>
                ))}
            </ul>
        );
    };

    // Function to get available years based on questionnaire's year and month
    const getAvailableYears = () => {
        const selectedYear = parseInt(year, 10);
        const currentYear = selectedYear || new Date().getFullYear();
        const endYear = currentYear + 5; // Allowing 5 years into the future
        const years = [];
        for (let y = currentYear; y <= endYear; y++) {
            years.push(y);
        }
        return years;
    };

    // Function to get available months based on questionnaire's year and month
    const getAvailableMonths = (actionPlanYear) => {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        if (actionPlanYear === parseInt(year, 10)) {
            const startMonthIndex = months.indexOf(month) !== -1 ? months.indexOf(month) : 0;
            return months.slice(startMonthIndex);
        }
        return months;
    };

    if (!role) {
        return <div>Loading...</div>;
    }

    return (
        <div className="questionnaire-container">
            <div className="questionnaire-actions">
                <div className="language-switch">
                    <ul className="nav nav-lang justify-content-end mb-0">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${selectedLanguage === 'fr' ? 'selected' : ''}`}
                                onClick={() => handleLanguageChange("fr")}
                            >
                                FR
                            </button>
                        </li>
                        <li className="nav-item">|</li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${selectedLanguage === 'en' ? 'selected' : ''}`}
                                onClick={() => handleLanguageChange("en")}
                            >
                                EN
                            </button>
                        </li>
                    </ul>
                </div>
                <button type="button" onClick={handleLogout} className="logout-button">
                    {t('logout')}
                </button>
                {role === 'master' && (
                    <button type="button" onClick={handleSkipToDashboard} className="skip-dashboard-button">
                        {t('accessDashboard')}
                    </button>
                )}
            </div>

            <div className="questionnaire-header">
                <div className="flag-container">
                    <img
                        src={`/flags/${country.toLowerCase().replace(' ', '-')}.svg`}
                        alt={`${country} flag`}
                        className="country-flag"
                    />
                </div>
                <div className="title-container">
                    <h3 className="questionnaire-title">
                        {role === 'master' ? t('titleMaster') : `${t('title')} - ${data[sectionIndex]?.title || ''}`}
                    </h3>
                    <h4 className="questionnaire-title">{country}</h4>
                </div>
                <div className="logo-container">
                    <img src="/logo128.png" alt="RPCA Logo" className="institution-logo" />
                </div>
            </div>

            <div className="time-selector-container">
                <label>{t('selectYear')}</label>
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">{t('year')}</option>
                    {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>

                <label>{t('selectMonth')}</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)}>
                    <option value="">{t('month')}</option>
                    {[
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                    ].map((m, index) => (
                        <option key={index} value={m}>
                            {t(`months.${m}`) || m}
                        </option>
                    ))}
                </select>
            </div>

            {/* Messages for Master Users */}
            {role === 'master' && isQuestionnaireVisible && (
                <div className="message-container">
                    {isComplete ? (
                        <div className="completion-message-container">
                            <p>{t('completeMessage')}</p>
                        </div>
                    ) : (
                        <div className="incompletion-message-container">
                            <p>{t('incompleteMessage')}</p>
                            {missingSections.length > 0 && (
                                <ul>
                                    {missingSections.map((section, idx) => (
                                        <li key={idx}>{section} {t('missingSection')}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Existing Submitted Message for Non-Master Users */}
            {isSubmitted && role !== 'master' ? (
                <div>
                    <div className="submitted-message-container">
                        <p>{t('submittedMessage')}</p>
                    </div>

                    <div className="dashboard-skip-container">
                        <button type="button" onClick={handleSkipToDashboard} className="dashboard-skip-button">
                            {t('accessDashboard')}
                        </button>
                    </div>
                </div>
            ) : (
                isQuestionnaireVisible && (
                    <div>
                        <Questions
                            role={role}
                            data={data}
                            country={country}
                            sectionIndex={sectionIndex}
                            responses={responses}
                            showCommentBox={showCommentBox}
                            questionComments={questionComments}
                            isSubmitted={isSubmitted}
                            handleSliderChange={handleSliderChange}
                            handleShowCommentBox={handleShowCommentBox}
                            handleQuestionCommentChange={handleQuestionCommentChange}
                            handleAddActionPlan={handleAddActionPlan}
                            handleSaveActionPlan={handleSaveActionPlan}
                            handleEditActionPlan={handleEditActionPlan}
                            handleDeleteActionPlan={handleDeleteActionPlan}
                            actionPlansPerQuestion={actionPlansPerQuestion}
                            savedActionPlans={savedActionPlans}
                            handleActionPlanChange={handleActionPlanChange}
                            getAvailableYears={getAvailableYears}
                            getAvailableMonths={getAvailableMonths}
                            renderDescriptionLevels={renderDescriptionLevels}
                            performanceScore={performanceScore}
                            handlePerformanceScoreChange={handlePerformanceScoreChange}
                            financingNeed={financingNeed}
                            handleFinancingNeedChange={handleFinancingNeedChange}
                            financingMobilized={financingMobilized}
                            handleFinancingMobilizedChange={handleFinancingMobilizedChange}
                            currencyOptions={currencyOptions}
                            marks={marks}
                            isComplete={isComplete} // Pass isComplete to Questions
                            missingSections={missingSections} // Pass missingSections to Questions
                        />

                        {/* ********** Integrated ActionPlans Component ********** */}
                        <ActionPlans savedActionPlans={savedActionPlans} />
                        {/* ********** End of ActionPlans Component ********** */}

                        {/* ********** Integrated QuestionComments Component ********** */}
                        <QuestionComments questionComments={questionComments} />
                        {/* ********** End of QuestionComments Component ********** */}

                        {/* Save and Submit buttons */}
                        {!isSubmitted && (
                            <div className="button-container">
                                <button type="button" onClick={handleSave} className="submit-button">
                                    {t('save')}
                                </button>
                                <button type="button" onClick={handleSubmit} className="submit-button">
                                    {t('submit')}
                                </button>
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
}

export default Questionnaire;
