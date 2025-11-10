import React, { useRef, useEffect } from 'react';
import '../styles/DualRangeSlider.css';

const DualRangeSlider = ({ min, max, value, onChange, step = 1, formatValue = (v) => v }) => {
  const [minVal, maxVal] = value;
  const minValRef = useRef(null);
  const maxValRef = useRef(null);
  const rangeRef = useRef(null);

  // Convert value to percentage
  const getPercent = (val) => Math.round(((val - min) / (max - min)) * 100);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxValRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);
      
      if (rangeRef.current) {
        rangeRef.current.style.left = `${minPercent}%`;
        rangeRef.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, maxVal, min, max]);

  return (
    <div className="dual-range-slider-container">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        step={step}
        ref={minValRef}
        onChange={(e) => {
          const newMinVal = Math.min(Number(e.target.value), maxVal - step);
          onChange([newMinVal, maxVal]);
        }}
        className="dual-range-slider-thumb dual-range-slider-thumb--left"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        step={step}
        ref={maxValRef}
        onChange={(e) => {
          const newMaxVal = Math.max(Number(e.target.value), minVal + step);
          onChange([minVal, newMaxVal]);
        }}
        className="dual-range-slider-thumb dual-range-slider-thumb--right"
      />
      <div className="dual-range-slider">
        <div className="dual-range-slider__track" />
        <div ref={rangeRef} className="dual-range-slider__range">
          <div className="dual-range-slider__range-value">
            {formatValue(minVal)} - {formatValue(maxVal)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualRangeSlider;

