// src/components/QuestionComments.js

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslationHook } from '../i18n';
import { sectionMapping } from '../mappings'; // Correctly import sectionMapping
import '../styles/QuestionComments.css'; // Import the CSS for styling

function QuestionComments({ questionComments }) {
  const { t } = useTranslationHook("questionnaire");
  
  // Helper function to parse questionKey into section
  const parseQuestionKey = (key) => {
    const keyStr = key.toString();
    if (keyStr.length < 1) {
      console.warn(`Invalid question key format: ${key}`);
      return { sectionNumber: 'Unknown' };
    }
    const sectionNumber = keyStr.charAt(0); // Extract the first digit
    return { sectionNumber };
  };

  // Helper function to group comments by section
  const groupCommentsBySection = (comments) => {
    const grouped = {};

    Object.entries(comments).forEach(([questionKey, comment]) => {
      const { sectionNumber } = parseQuestionKey(questionKey);
      const sectionKey = `section${sectionNumber}`;
      const sectionTitle = sectionMapping[sectionKey]?.title || 'Unknown Section';

      if (!grouped[sectionTitle]) {
        grouped[sectionTitle] = [];
      }

      grouped[sectionTitle].push({
        questionKey,
        comment,
      });
    });

    return grouped;
  };

  const groupedComments = groupCommentsBySection(questionComments);
  console.log('Grouped Comments:', groupedComments); // Debugging

  return (
    <div className="question-comments-container">
      <div className="saved-action-plans-header">
        <h4>{t('questionCommentsTitle')}</h4>
      </div>
      {Object.keys(groupedComments).length === 0 ? (
        <p>{t('noCommentsSaved')}</p>
      ) : (
        // Iterate through grouped comments by section
        Object.entries(groupedComments).map(([section, comments]) => (
          <div key={section} className="section-group">
            {/* Section Title */}
            <h5 className="section-title">{section}</h5>

            {/* List of Comments in the Section */}
            {comments.map(({ questionKey, comment }) => (
              <div key={questionKey} className="question-comment">
                <p className="question-key">{t('question')} {questionKey}</p>
                <p className="comment-text">{comment}</p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

QuestionComments.propTypes = {
  questionComments: PropTypes.object.isRequired,
};

export default QuestionComments;
