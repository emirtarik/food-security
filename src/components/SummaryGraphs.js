// src/components/SummaryGraphs.js

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { RadialGauge } from '@progress/kendo-react-gauges';
import { useSpring, animated } from '@react-spring/web';
import '../styles/SummaryGraphs.css';

const sectionNames = {
  section1: 'Information et analyse de la SAN',
  section2: 'Programmes et plans de réponse',
  section3: 'Financement de la SAN',
  section4: 'Dispositif de gouvernance',
};

export const getColorByScore = (score) => {
  if (score < 20) return '#FF6B6B';
  if (score < 40) return '#FFA07A';
  if (score < 60) return '#FFD580';
  if (score < 80) return '#B0E57C';
  return '#8FBC8F';
};

// Adjusted calculateStage function based on gauge value divided by 20

export const calculateStage = (avg) => {

  if (avg < 1.1) return { label: 'Inexistant', stage: 0 };
  if (avg < 2) return { label: 'Embryonnaire', stage: 1 };
  if (avg < 3) return { label: 'Emergent', stage: 2 };
  if (avg < 4) return { label: 'Consolidé', stage: 3 };
  return { label: 'Mature', stage: 4 };
};

const createDonutChartOptions = (sectionName, sectionScore) => {
  const scaledScore = sectionScore * 20;
  const validScore = !isNaN(scaledScore) ? scaledScore : 0;

  return {
    chart: {
      type: 'pie',
      height: 220,
      events: {
        render() {
          const chart = this;
          const centerX = chart.plotLeft + chart.plotWidth / 2;
          const centerY = chart.plotTop + chart.plotHeight / 2 + 10;

          if (chart.customLabel) {
            chart.customLabel.destroy();
          }

          chart.customLabel = chart.renderer.text(
            `${validScore.toFixed(0)}%`,
            centerX,
            centerY
          )
            .css({
              fontSize: '16px',
              color: '#000',
              fontWeight: 'bold',
            })
            .attr({
              align: 'center',
              zIndex: 5,
            })
            .add();
        },
      },
    },
    title: {
      text: `${sectionNames[sectionName]}`,
      align: 'center',
      verticalAlign: 'top',
      style: { fontSize: '12px' },
    },
    plotOptions: {
      pie: {
        innerSize: '60%',
        startAngle: 0,
        dataLabels: {
          enabled: false,
        },
      },
    },
    tooltip: {
      enabled: false,
    },
    series: [
      {
        name: 'Score',
        data: [
          {
            name: `${sectionName} Score`,
            y: validScore,
            color: getColorByScore(validScore),
          },
          {
            name: 'Remainder',
            y: 100 - validScore,
            color: '#E0E0E0',
            dataLabels: {
              enabled: false,
            },
          },
        ],
      },
    ],
    credits: {
      enabled: false,
    },
  };
};

function SummaryGraphs({ averageScore, sectionAverages }) {
  const [currentValue, setCurrentValue] = useState(0);

  const { animatedValue } = useSpring({
    animatedValue: currentValue,
    from: { animatedValue: 0 },
    config: { duration: 1000 },
  });

  useEffect(() => {
    // Recalculate the average from sectionAverages to ensure accuracy
    const sectionScores = Object.values(sectionAverages)
      .map(Number)
      .filter(score => !isNaN(score) && score > 0);
    
    let calculatedAverage = 0;
    if (sectionScores.length > 0) {
      const sectionSum = sectionScores.reduce((sum, score) => sum + score, 0);
      const avgOnScale0to5 = sectionSum / sectionScores.length;
      // Convert from 0-5 scale to 0-100 scale
      calculatedAverage = avgOnScale0to5 * 20;
    }
    
    setCurrentValue(parseFloat(calculatedAverage.toFixed(1)));
  }, [sectionAverages]);

  const gaugeOptions = {
    pointer: {
      value: currentValue,
      color: 'black',
    },
    scale: {
      min: 0,
      max: 100,
      majorUnit: 10,
      minorUnit: 5,
      startAngle: 0,
      endAngle: 180,
      rangeSize: 50,
      labels: {
        visible: true,
        color: '#000',
        font: '12px Lato, sans-serif',
        position: 'outside',
        format: '{0}',
      },
      ranges: [
        { from: 0, to: 10, color: 'red' },
        { from: 10, to: 20, color: 'darkorange' },
        { from: 20, to: 30, color: 'orange' },
        { from: 30, to: 40, color: 'yellow' },
        { from: 40, to: 50, color: 'yellowgreen' },
        { from: 50, to: 60, color: 'lightgreen' },
        { from: 60, to: 70, color: 'mediumseagreen' },
        { from: 70, to: 80, color: 'forestgreen' },
        { from: 80, to: 90, color: 'green' },
        { from: 90, to: 100, color: 'darkgreen' },
      ],
    },
    animation: {
      duration: 1500,
      easing: 'easeOutBounce',
    },
    gaugeArea: {
      width: 500,
      height: 'auto',
      background: 'transparent',
      margin: 0,
    },
  };

  const sectionDonutCharts = Object.keys(sectionAverages).map((section, index) => {
    const sectionScore = parseFloat(sectionAverages[section]) || 0;
    const { label } = calculateStage(sectionScore); // Multiply back to get the actual score

    return (
      <div key={index} className="donut-chart">
        <HighchartsReact
          highcharts={Highcharts}
          options={createDonutChartOptions(section, sectionScore)}
        />
        <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', fontWeight: 'bold' }}>
          {`${label}`}
        </div>
      </div>
    );
  });

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Parent container for speedometer and donut charts */}
      <div className="charts-wrapper">
        <div className="donut-charts-container">
          {sectionDonutCharts}
        </div>
        <div className="speedometer-wrapper">
          <div className="speedometer-container">
            <RadialGauge {...gaugeOptions} style={{ width: '100%' }} />
          </div>

          <div className="gauge-value-text">
            <animated.div className="animated-gauge-value">
              {animatedValue.to((val) => val.toFixed(0) + '%')}
            </animated.div>
            {/* Added the requested text below the gauge value */}
          </div>
          <div className="additional-text">
              <p>Indice de prévention et de gestion des crises</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryGraphs;
