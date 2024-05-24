import React from 'react';
import Glb from './Globe_temp';
import './styles.css';
import { Link } from 'react-router-dom';

function EnergyAndGlobalWarming() {
  return (
    <div className="page-container">
      <h2>Energy and Global Warming</h2>
      <p>Lorem ipsum...</p>
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