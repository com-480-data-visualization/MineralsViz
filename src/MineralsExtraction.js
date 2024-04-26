import React from 'react';
import Globe from './Globe';
import './styles.css';
import { Link } from 'react-router-dom';

function MineralsExtraction() {
  return (
    <body>
        <div className="page-container">
            <h2>Mineral Extraction</h2>
            <p>Lorem ipsum...</p>
            <div className="content">
                <Globe />

            </div>
            <div className="navigation-buttons">
                <Link to="/renewable-energy" className="arrow-left">&#8592;</Link>
                <Link to="/scenario" className="arrow-right">&#8594;</Link>
            </div>
        </div>
    </body>
  );
}

export default MineralsExtraction;