import React from 'react';
import Tooltip from '@mui/material/Tooltip';

function TooltipTest() {
  return (
    <div style={{ padding: '50px' }}>
      <Tooltip title="This is a tooltip" arrow>
        <span style={{ borderBottom: '1px dotted black', cursor: 'help' }}>Hover over me</span>
      </Tooltip>
    </div>
  );
}

export default TooltipTest;
