// src/components/SummaryGraphs.js

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import ReactSpeedometer from 'react-d3-speedometer';
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

  // Define custom segments with colors for the speedometer
  // react-d3-speedometer uses segments array with objects containing { text, position, color }
  const getSegmentColors = () => {
    return [
      '#FF6B6B',      // 0-20: red
      '#FFA07A',      // 20-40: light salmon
      '#FFD580',      // 40-60: light yellow
      '#B0E57C',      // 60-80: light green
      '#8FBC8F'       // 80-100: dark sea green
    ];
  };

  const customSegmentStops = [0, 20, 40, 60, 80, 100];
  const segmentColors = getSegmentColors();

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
            <ReactSpeedometer
              maxValue={100}
              value={currentValue}
              needleColor="#000000"
              segments={5}
              customSegmentStops={customSegmentStops}
              segmentColors={segmentColors}
              textColor="#000000"
              valueFormat="d"
              currentValueText=""
              valueTextFontSize="0px"
              height={250}
              width={400}
              ringWidth={30}
              needleTransitionDuration={1500}
              needleTransition="easeElastic"
            />
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
