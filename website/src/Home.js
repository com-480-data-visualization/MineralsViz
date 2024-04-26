import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

function Home() {
  return (
    <div className="home-container">
      <h1>Minerals Visualization</h1>
      <p>Discover the world of minerals and energy.</p>
      <Link to="/energy-and-global-warming" className="begin-button">Begin the experience</Link>
    </div>
  );
}

export default Home;