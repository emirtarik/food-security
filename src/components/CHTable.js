// src/components/CHTable.js
import React from 'react';
import '../styles/CHTable.css';

function CHTable() {
  const data = [
    {
      indicator: "Peformance du système d'information (Score CH)",
      values: ['', '', '', '', '70%', '75%', '69%', '70%', '60%']
    },
    {
      indicator: 'Population analysée (million)',
      values: ['', '', '', '', 14, 14.7, 15.2, 15.4, 15.6]
    },
    {
      indicator: 'Nombre de personnes en phase CH 3-5 (million)',
      values: ['', '', '', '', 0.4, 0.6, 1.1, 1.1, 1.2]
    },
    {
      indicator: 'Proportion de personnes analysées en phase CH 3-5',
      values: ['', '', '', '', '3%', '4%', '7%', '7%', '8%']
    },
    {
      indicator: 'Nombre de zones analysées',
      values: ['', '', '', '', 27, 31, 35, 35, 35]
    },
    {
      indicator: 'Nombre de zones en phase CH 3-5',
      values: ['', '', '', '', 15, 12, 19, 21, 27]
    },
    {
      indicator: 'Besoin de financement (million USD)',
      values: ['', '', '', '', 100, 120, 160, 190, 200]
    },
    {
      indicator: 'Financement mobilisé',
      values: ['', '', '', '', '65%', '55%', '55%', '45%', '35%']
    },
    {
      indicator: 'Evolution du système d\'information (Score CH)',
      values: ['', '', '', '', '', '5%', '-6%', '1%', '-10%', '-10%']
    },
    {
      indicator: 'Evolution personnes en phase CH 3-5',
      values: ['', '', '', '', '', 0.7, 0.5, 0.2, 0.2, 0.8]
    },
    {
      indicator: 'Evolution personnes en phase CH 3-5 (%)',
      values: ['', '', '', '', '', '1%', '3%', '0%', '1%', '5%']
    },
    {
      indicator: 'Evolution du nombre de zones en phase CH 3-5',
      values: ['', '', '', '', '', '-3', '7', '2', '6', '12']
    },
    {
      indicator: 'Evolution du nombre de zones en phase CH 3-5 (%)',
      values: ['', '', '', '', '', '-20%', '58%', '11%', '29%', '80%']
    },
    {
      indicator: 'Evolution du besoin de financement couvert',
      values: ['', '', '', '', '', '1%', '3%', '0%', '1%', '-30%']
    },
    {
      indicator: 'Gap de financement',
      values: ['', '', '', '35', '54', '72', '104.5', '130', '395.5']
    }
  ];

  return (
    <div className="table2-container">
      <h3>Données Cadre Harmonisé (avril) et indicateurs de performance</h3>
      <table className="ch-table">
        <thead>
          <tr>
            <th>Indicator</th>
            <th>2015</th>
            <th>2016</th>
            <th>2017</th>
            <th>2018</th>
            <th>2019</th>
            <th>2020</th>
            <th>2021</th>
            <th>2022</th>
            <th>2023</th>
            <th>2019-2023</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.indicator}</td>
              {row.values.map((value, idx) => (
                <td key={idx}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CHTable;
