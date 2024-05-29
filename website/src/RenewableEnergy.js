import React from 'react';
import Glb from './Globe_nrj';
import './styles.css';
import { Link } from 'react-router-dom';

function RenewableEnergy() {
  return (
    <div className="page-container">
      <h2>Renewable Energy</h2>
      <p>Global warming calls for a rapid transition to renewable energies in order to achieve zero-carbon targets. 
      The production of wind, solar and hydro power by country is steadily increasing, illustrating global efforts to reduce greenhouse gas emissions. 
      These graphs show not only the evolution of this production, but also the mineral issues involved in this transition.</p>
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