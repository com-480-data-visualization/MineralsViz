import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

function Home() {
  return (
    <div className="home-container">
      <h1>Minerals Visualization</h1>
      <p>Explore the Role of Minerals and Mining in the Energy Transition and their Environmental Impact</p>
      <p>Please note that the figures on the following pages represent only a small part of this very complex subject. Please do not take the information given for granted without further research.</p>
      <Link to="/energy-and-global-warming" className="begin-button">Begin the experience</Link>
    </div>
  );
}

export default Home;