// src/components/TableauEmbed.js
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/TableauEmbed.css'; // Import the CSS file

const TableauEmbed = ({
  url,
  width = '100%',
  height = '800px',
  hideTabs = true,
  hideToolbar = false,
  onFirstInteractive = null,
}) => {
  const vizRef = useRef(null);
  const viz = useRef(null);

  useEffect(() => {
    const initializeViz = () => {
      if (viz.current) return;

      const options = {
        hideTabs,
        hideToolbar,
        width: '100%',
        height: '100%',
        onFirstInteractive: () => {
          if (onFirstInteractive) onFirstInteractive();
        },
      };

      viz.current = new window.tableau.Viz(vizRef.current, url, options);
    };

    if (!window.tableau) {
      const script = document.createElement('script');
      script.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
      script.async = true;
      script.onload = initializeViz;
      document.body.appendChild(script);
    } else {
      initializeViz();
    }

    return () => {
      if (viz.current) viz.current.dispose();
    };
  }, [url, hideTabs, hideToolbar, onFirstInteractive]);

  return (
    <div className="tableau-container">
      <div ref={vizRef}></div>
    </div>
  );
};

TableauEmbed.propTypes = {
  url: PropTypes.string.isRequired,
  hideTabs: PropTypes.bool,
  hideToolbar: PropTypes.bool,
  onFirstInteractive: PropTypes.func,
};

export default TableauEmbed;
