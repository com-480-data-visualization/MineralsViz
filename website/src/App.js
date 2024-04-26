import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import EnergyAndGlobalWarming from './EnergyAndGlobalWarming';
import RenewableEnergy from './RenewableEnergy';
import MineralsExtraction from './MineralsExtraction';
import Scenario from './Scenario';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/energy-and-global-warming" element={<EnergyAndGlobalWarming />} />
        <Route path="/renewable-energy" element={<RenewableEnergy />} />
        <Route path="/minerals-extraction" element={<MineralsExtraction />} />
        <Route path="/scenario" element={<Scenario />} />
      </Routes>
    </Router>
  );
}

export default App;