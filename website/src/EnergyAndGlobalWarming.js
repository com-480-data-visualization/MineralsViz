import React from 'react';
import Glb from './Globe_temp';
import './styles.css';
import { Link } from 'react-router-dom';

function EnergyAndGlobalWarming() {
  return (
    <div className="page-container">
      <h2>Energy and Global Warming</h2>
      <p>Global warming is a direct consequence of rising greenhouse gas emissions, 
      mainly due to energy production and consumption. 
      The intensive use of fossil fuels is a major contributor to these emissions, 
      underlining the need for a transition to cleaner, more sustainable energy sources. 
      The following graphs illustrate the evolution of energy consumption and its environmental impact.</p>
      <div className="content">
        <Glb />
      </div>
      <div className="navigation-buttons">
        <Link to="/scenario" className="arrow-left">&#8592;</Link>
        <Link to="/renewable-energy" className="arrow-right">&#8594;</Link>
      </div>
    </div>
  );
}

export default EnergyAndGlobalWarming;