import React from 'react';
import Glb from './Globe_material';
import './styles.css';
import { Link } from 'react-router-dom';

function MineralsExtraction() {
  return (
    <body>
        <div className="page-container">
            <h2>Mineral Extraction</h2>
            <p>It's impossible to discuss the energy transition without mentioning one of its most crucial elements: minerals.
             These resources play a key role in this process, but they are already heavily exploited. 
            Here, we present the main mining countries and the evolution of their reserves.</p>
            <div className="content">
                <Glb />

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