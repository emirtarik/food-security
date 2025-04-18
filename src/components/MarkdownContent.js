import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const LinkRenderer = ({ href, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#c2be00" }} // custom styles
    >
      {children}
    </a>
  );
};

const MarkdownContent = ({ file }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(file)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error(`Error fetching markdown file ${file}:`, err));
  }, [file]);

  return <ReactMarkdown components={{ a: LinkRenderer }}>{content}</ReactMarkdown>;
};

export default MarkdownContent;