import React from 'react';
import Glb from './Globe_nrj';
import './styles.css';
import { Link } from 'react-router-dom';

function RenewableEnergy() {
  return (
    <div className="page-container">
      <h2>Renewable Energy</h2>
      <p>Lorem ipsum...</p>
      <div className="content">
        <Glb />
      </div>
      <div className="navigation-buttons">
        <Link to="/energy-and-global-warming" className="arrow-left">&#8592;</Link>
        <Link to="/minerals-extraction" className="arrow-right">&#8594;</Link>
      </div>
    </div>
  );
}

export default RenewableEnergy;