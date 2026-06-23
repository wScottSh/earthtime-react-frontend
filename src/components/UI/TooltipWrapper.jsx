import React from 'react';
import { Tooltip } from 'react-tooltip';

const TooltipWrapper = ({ id }) => {
    return (
        <Tooltip
            id={id}
            place="top"
            effect="solid"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                textAlign: 'center',
                zIndex: 1000,
                whiteSpace: 'pre-line', // Allows \n for stacking
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
        />
    );
};

export default TooltipWrapper;
