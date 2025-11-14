// src/components/Questions.js

import React, { useMemo } from 'react';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PropTypes from 'prop-types';
import { useTranslationHook } from '../i18n';
import PerformanceTable from './PerformanceTable'; // Import the PerformanceTable component
import '../styles/Questions.css'; // Ensure you have appropriate styling

function Questions({
  role,
  data,
  country,
  sectionIndex,
  responses,
  showCommentBox,
  questionComments,
  isSubmitted,
  handleSliderChange,
  handleShowCommentBox,
  handleQuestionCommentChange,
  handleAddActionPlan,
  handleSaveActionPlan,
  handleEditActionPlan,
  handleDeleteActionPlan,
  actionPlansPerQuestion,
  savedActionPlans,
  handleActionPlanChange,
  getAvailableYears,
  getAvailableMonths,
  renderDescriptionLevels,
  performanceScore,
  handlePerformanceScoreChange,
  financingNeed,
  handleFinancingNeedChange,
  financingMobilized,
  handleFinancingMobilizedChange,
  currencyOptions,
  marks,
  isComplete, // New prop
  missingSections, // New prop
}) {
  const { t } = useTranslationHook("questionnaire");
  console.log('Questions Component Props:', { performanceScore, financingNeed, financingMobilized });

  // 1. Flatten the questions into an ordered list
  const orderedQuestionKeys = useMemo(() => {
    const keys = [];
    if (role === 'master') {
      data.forEach((section) => {
        section.subsections.forEach((sub) => {
          sub.questions.forEach((q) => {
            keys.push(q.index);
          });
        });
      });
    } else {
      const sectionData = data[sectionIndex];
      if (sectionData) {
        sectionData.subsections.forEach((sub) => {
          sub.questions.forEach((q) => {
            keys.push(q.index);
          });
        });
      }
    }
    return keys;
  }, [role, data, sectionIndex]);

  // 2. Helper function to determine if a question should be enabled
  const isQuestionEnabled = (currentQuestionKey) => {
    const currentIndex = orderedQuestionKeys.indexOf(currentQuestionKey);
    if (currentIndex === -1) return false;

    for (let i = 0; i < currentIndex; i++) {
      const prevKey = orderedQuestionKeys[i];
      const prevValue = responses[prevKey];
      const hasActionPlan = savedActionPlans[prevKey]?.length > 0;
      if (prevValue <= 3 && !hasActionPlan) {
        return false;
      }
    }
    return true;
  };

  return (
    <>
      {role === 'master' && (
        <>
          {/* Additional Questions Container for Master Users */}
          <div className="additional-questions-container">
            <h4>{t('additionalQuestions')}</h4>

            <div className="additional-question">
              <label>{t('performanceScoreLabel')}</label>
              <input
                type="number"
                step="0.1"
                value={performanceScore}
                onChange={handlePerformanceScoreChange}
                disabled={isSubmitted}
              />
              <span>%</span>
            </div>

            <div className="additional-question">
              <label>{t('financingNeedLabel')}</label>
              <input
                type="number"
                value={financingNeed}
                onChange={handleFinancingNeedChange}
                disabled={isSubmitted}
              />
            </div>

            <div className="additional-question">
              <label>{t('financingMobilizedLabel')}</label>
              <input
                type="number"
                value={financingMobilized}
                onChange={handleFinancingMobilizedChange}
                disabled={isSubmitted}
              />
              <span>%</span>
            </div>
          </div>

          {/* Integrate PerformanceTable Component */}
          <PerformanceTable 
            country={country}
            performanceScore={performanceScore} 
            financingNeed={financingNeed} 
            financingMobilized={financingMobilized} 
          />
        </>
      )}

      {/* Render all sections for master users or a single section for regular users */}
      {role === 'master' ? (
        // Render all sections with Accordion for master users
        data.map((sectionData, sectionIdx) => {
          const isSectionMissing = missingSections.includes(sectionData.title);

          return (
            <Accordion
              key={sectionIdx}
              defaultExpanded={false}
              className={isSectionMissing ? 'missing-section' : ''}
              disabled={isSectionMissing} // Disable the accordion if section is missing
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${sectionIdx}-content`}
                id={`panel${sectionIdx}-header`}
              >
                <h5 className="subsection-title">{sectionData.title}</h5>
              </AccordionSummary>
              <AccordionDetails>
                {isSectionMissing ? (
                  <p>{t('sectionMissing')}</p>
                ) : (
                  sectionData.subsections.map((sub, subIndex) => (
                    <div key={subIndex} className="subsection-container">
                      <h6 className="subsection-title">{sub.title}</h6>
                      {sub.questions.map((question, qIndex) => {
                        const key = question.index; // Use question.index as the key
                        // Extract question number (last digit of index)
                        const questionNumber = key.slice(-1);

                        // Determine if the question should be enabled
                        const enabled = isQuestionEnabled(key);
                        const requiresActionPlan = responses[key] <= 3;
                        const hasActionPlan = savedActionPlans[key]?.length > 0;
                        const sliderTouched = responses[key] !== undefined;

                        return (
                          <div
                            key={qIndex}
                            className={`question-container ${!enabled ? 'locked-question' : ''} ${requiresActionPlan ? 'requires-action-plan' : ''}`}
                          >
                            <div className="question-content">
                              {/* Display question number before the question text */}
                              <Tooltip title={question.tooltip || ''} arrow placement="bottom" disablePortal={false} >
                                <HelpOutlineIcon className="question-tooltip-icon" />
                              </Tooltip>
                              <span className="question-text">
                                  {questionNumber}. {question.text}
                              </span>
                              <div className="slider-container">
                                <Slider
                                  value={responses[key] !== undefined ? responses[key] : 1}
                                  min={1}
                                  max={5}
                                  marks={marks}
                                  step={1}
                                  onChange={(e, value) => handleSliderChange(key, value)}
                                  className="slider"
                                  disabled={isSubmitted || !enabled}
                                />
                              </div>
                            </div>
                            <div className="description-container">{renderDescriptionLevels(question.description)}</div>
                            {/* Comments Section */}
                            <div className="question-comment-container">
                              {!showCommentBox[key] && (
                                <button
                                  type="button"
                                  onClick={() => handleShowCommentBox(key)}
                                  className="add-comment-button"
                                  disabled={!enabled || isSubmitted}
                                >
                                  {t('comments')}
                                </button>
                              )}
                              {showCommentBox[key] && (
                                <textarea
                                  value={questionComments[key] || ''}
                                  onChange={(e) => handleQuestionCommentChange(key, e.target.value)}
                                  placeholder={t('commentPlaceholder')}
                                  className="comment-textarea"
                                  disabled={isSubmitted || !enabled}
                                />
                              )}
                            </div>

                            {/* Per-Question Action Plan Section */}
                            <div className="per-question-action-plan-container">
                              <h5>{t('recommendedActions')}</h5>
                              {actionPlansPerQuestion[key]?.map((plan, index) => (
                                <div key={index} className="action-plan-row">
                                  <div className="input-container">
                                    <input
                                      type="text"
                                      value={plan.offerRequest}
                                      placeholder={t('offersOrRequests')}
                                      onChange={(e) => handleActionPlanChange(key, index, 'offerRequest', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    />
                                  </div>

                                  <div className="input-container period-container">
                                    <select
                                      value={plan.year}
                                      onChange={(e) => handleActionPlanChange(key, index, 'year', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    >
                                      <option value="">{t('year')}</option>
                                      {getAvailableYears().map((y) => (
                                        <option key={y} value={y}>
                                          {y}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={plan.month}
                                      onChange={(e) => handleActionPlanChange(key, index, 'month', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    >
                                      <option value="">{t('month')}</option>
                                      {getAvailableMonths(parseInt(plan.year, 10)).map((m, mIndex) => (
                                        <option key={mIndex} value={m}>
                                          {t(`months.${m}`) || m}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="input-container budget-container">
                                    <input
                                      type="number"
                                      value={plan.budget}
                                      placeholder={t('budget')}
                                      onChange={(e) => handleActionPlanChange(key, index, 'budget', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    />
                                    <select
                                      value={plan.currency}
                                      onChange={(e) => handleActionPlanChange(key, index, 'currency', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    >
                                      <option value="">{t('selectCurrency')}</option>
                                      {currencyOptions.map((currency) => (
                                        <option key={currency.value} value={currency.value}>
                                          {currency.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="input-container">
                                    <input
                                      type="text"
                                      value={plan.responsible}
                                      placeholder={t('responsible')}
                                      onChange={(e) => handleActionPlanChange(key, index, 'responsible', e.target.value)}
                                      disabled={isSubmitted || plan.isSaved || !enabled}
                                      required={requiresActionPlan}
                                    />
                                  </div>

                                  {/* Save Button */}
                                  {!plan.isSaved && !isSubmitted && (
                                    <button
                                      type="button"
                                      className="save-row-button"
                                      onClick={() => handleSaveActionPlan(key, index)}
                                      disabled={!enabled}
                                    >
                                      {t('saveAction')}
                                    </button>
                                  )}

                                  {/* Edit Button */}
                                  {plan.isSaved && !isSubmitted && (
                                    <button
                                      type="button"
                                      className="edit-row-button"
                                      onClick={() => handleEditActionPlan(key, index)}
                                      disabled={!enabled}
                                    >
                                      {t('edit')}
                                    </button>
                                  )}

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    className="delete-row-button"
                                    onClick={() => handleDeleteActionPlan(key, index)}
                                    disabled={isSubmitted}
                                  >
                                    -
                                  </button>
                                </div>
                              ))}

                              {/* Add Action Plan Button */}
                              {!isSubmitted && (
                                <button
                                  type="button"
                                  onClick={() => handleAddActionPlan(key)}
                                  className="add-row-button"
                                  disabled={!enabled} // Removed the locking based on the score
                                >
                                  {t('add')}
                                </button>
                              )}

                              {/* Action Plan Prompt Message */}
                              {requiresActionPlan && sliderTouched && !hasActionPlan && (
                                <p className="action-plan-message">
                                  {t('actionPlanMessage')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        // Render single section for non-master users
        <>
          {data[sectionIndex]?.subsections.map((sub, subIndex) => (
            <div key={subIndex} className="subsection-container">
              <h5 className="subsection-title">{sub.title}</h5>
              {sub.questions.map((question, qIndex) => {
                const key = question.index; // Use question.index as the key
                // Extract question number (last digit of index)
                const questionNumber = key.slice(-1);

                // Determine if the question should be enabled
                const enabled = isQuestionEnabled(key);
                const requiresActionPlan = responses[key] <= 3;
                const hasActionPlan = savedActionPlans[key]?.length > 0;
                const sliderTouched = responses[key] !== undefined;

                return (
                  <div
                    key={qIndex}
                    className={`question-container ${!enabled ? 'locked-question' : ''} ${requiresActionPlan ? 'requires-action-plan' : ''}`}
                  >
                    <div className="question-content">
                      {/* Display question number before the question text */}
                      <Tooltip title={question.tooltip || ''} arrow placement="bottom" disablePortal={false} >
                        <HelpOutlineIcon className="question-tooltip-icon" />
                      </Tooltip>
                      <span className="question-text">
                          {questionNumber}. {question.text}
                      </span>
                      <div className="slider-container">
                        <Slider
                          value={responses[key] !== undefined ? responses[key] : 1}
                          min={1}
                          max={5}
                          marks={marks}
                          step={1}
                          onChange={(e, value) => handleSliderChange(key, value)}
                          className="slider"
                          disabled={isSubmitted || !enabled}
                        />
                      </div>
                    </div>
                    <div className="description-container">{renderDescriptionLevels(question.description)}</div>
                    {/* Comments Section */}
                    <div className="question-comment-container">
                      {!showCommentBox[key] && (
                        <button
                          type="button"
                          onClick={() => handleShowCommentBox(key)}
                          className="add-comment-button"
                          disabled={!enabled || isSubmitted}
                        >
                          {t('comments')}
                        </button>
                      )}
                      {showCommentBox[key] && (
                        <textarea
                          value={questionComments[key] || ''}
                          onChange={(e) => handleQuestionCommentChange(key, e.target.value)}
                          placeholder={t('commentPlaceholder')}
                          className="comment-textarea"
                          disabled={isSubmitted || !enabled}
                        />
                      )}
                    </div>

                    {/* Per-Question Action Plan Section */}
                    <div className="per-question-action-plan-container">
                      <h5>{t('recommendedAction')}</h5>
                      {actionPlansPerQuestion[key]?.map((plan, index) => (
                        <div key={index} className="action-plan-row">
                          <div className="input-container">
                            <input
                              type="text"
                              value={plan.offerRequest}
                              placeholder={t('offersOrRequests')}
                              onChange={(e) => handleActionPlanChange(key, index, 'offerRequest', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            />
                          </div>

                          <div className="input-container period-container">
                            <select
                              value={plan.year}
                              onChange={(e) => handleActionPlanChange(key, index, 'year', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            >
                              <option value="">{t('year')}</option>
                              {getAvailableYears().map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                            <select
                              value={plan.month}
                              onChange={(e) => handleActionPlanChange(key, index, 'month', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            >
                              <option value="">{t('month')}</option>
                              {getAvailableMonths(parseInt(plan.year, 10)).map((m, mIndex) => (
                                <option key={mIndex} value={m}>
                                  {t(`months.${m}`) || m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="input-container budget-container">
                            <input
                              type="number"
                              value={plan.budget}
                              placeholder={t('budget') || 'Budget'}
                              onChange={(e) => handleActionPlanChange(key, index, 'budget', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            />
                            <select
                              value={plan.currency}
                              onChange={(e) => handleActionPlanChange(key, index, 'currency', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            >
                              <option value="">{t('selectCurrency')}</option>
                              {currencyOptions.map((currency) => (
                                <option key={currency.value} value={currency.value}>
                                  {currency.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="input-container">
                            <input
                              type="text"
                              value={plan.responsible}
                              placeholder={t('responsible')}
                              onChange={(e) => handleActionPlanChange(key, index, 'responsible', e.target.value)}
                              disabled={isSubmitted || plan.isSaved || !enabled}
                              required={requiresActionPlan}
                            />
                          </div>

                          {/* Save Button */}
                          {!plan.isSaved && !isSubmitted && (
                            <button
                              type="button"
                              className="save-row-button"
                              onClick={() => handleSaveActionPlan(key, index)}
                              disabled={!enabled}
                            >
                              {t('saveAction')}
                            </button>
                          )}

                          {/* Edit Button */}
                          {plan.isSaved && !isSubmitted && (
                            <button
                              type="button"
                              className="edit-row-button"
                              onClick={() => handleEditActionPlan(key, index)}
                              disabled={!enabled}
                            >
                              {t('edit')}
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="delete-row-button"
                            onClick={() => handleDeleteActionPlan(key, index)}
                            disabled={isSubmitted}
                          >
                            -
                          </button>
                        </div>
                      ))}

                      {/* Add Action Plan Button */}
                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleAddActionPlan(key)}
                          className="add-row-button"
                          disabled={!enabled} // Removed locking based on the score
                        >
                          {t('add')}
                        </button>
                      )}

                      {/* Action Plan Prompt Message */}
                      {requiresActionPlan && sliderTouched && !hasActionPlan && (
                        <p className="action-plan-message">
                          {t('actionPlanMessage')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </>
  );
}

Questions.propTypes = {
  role: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  sectionIndex: PropTypes.number,
  responses: PropTypes.object.isRequired,
  showCommentBox: PropTypes.object.isRequired,
  questionComments: PropTypes.object.isRequired,
  isSubmitted: PropTypes.bool.isRequired,
  handleSliderChange: PropTypes.func.isRequired,
  handleShowCommentBox: PropTypes.func.isRequired,
  handleQuestionCommentChange: PropTypes.func.isRequired,
  handleAddActionPlan: PropTypes.func.isRequired,
  handleSaveActionPlan: PropTypes.func.isRequired,
  handleEditActionPlan: PropTypes.func.isRequired,
  handleDeleteActionPlan: PropTypes.func.isRequired,
  actionPlansPerQuestion: PropTypes.object.isRequired,
  savedActionPlans: PropTypes.object.isRequired,
  handleActionPlanChange: PropTypes.func.isRequired,
  getAvailableYears: PropTypes.func.isRequired,
  getAvailableMonths: PropTypes.func.isRequired,
  renderDescriptionLevels: PropTypes.func.isRequired,
  performanceScore: PropTypes.number.isRequired,
  handlePerformanceScoreChange: PropTypes.func.isRequired,
  financingNeed: PropTypes.number.isRequired,
  handleFinancingNeedChange: PropTypes.func.isRequired,
  financingMobilized: PropTypes.number.isRequired,
  handleFinancingMobilizedChange: PropTypes.func.isRequired,
  currencyOptions: PropTypes.array.isRequired,
  marks: PropTypes.array.isRequired,
  isComplete: PropTypes.bool.isRequired, // New Prop
  missingSections: PropTypes.array.isRequired, // New Prop
};

export default Questions;
