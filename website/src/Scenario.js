import React from 'react';
import Dashboard from './Dashboard';
import './styles.css';
import { Link } from 'react-router-dom';

function Scenario() {
  return (
    <div className="page-container">
      <h2>Energy Transition Scenario</h2>
      <p>Lorem ipsum...</p>
      <div className="content">
        <Dashboard />
      </div>
      <div className="navigation-buttons">
        <Link to="/minerals-extraction" className="arrow-left">&#8592;</Link>
        <Link to="/energy-and-global-warming" className="arrow-right">&#8594;</Link>
      </div>
    </div>
  );
}

export default Scenario;