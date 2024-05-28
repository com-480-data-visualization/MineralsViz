import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './styles.css';

const scenarioColors = {
  'M0 - 100% Renewables': '#ff9999', // light red
  'M1 - Distributed Renewables': '#99ccff', // light blue
  'M23 - Centralized Renewables': '#99ff99' // light green
};

const energyColors = {
  'Solar': '#ffcc00',
  'Onshore Wind': '#99cc00',
  'Offshore Wind': '#66cccc',
  'Hydropower': '#0066cc',
  'Bioenergy': '#cc6600',
  'Marine Energy': '#009999',
  'Other Renewables': '#ff6699',
  'Nuclear': '#cc66ff'
};

const energyTypes = [
  'Solar', 'Onshore Wind', 'Offshore Wind', 'Hydropower', 'Bioenergy', 
  'Marine Energy', 'Other Renewables', 'Nuclear'
];

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [energyData, setEnergyData] = useState([]);

  const donutRef = useRef(null);

  useEffect(() => {
    d3.csv('/data/rte_scenarios_energy_mix.csv').then(data => {
      const scenarioList = data.map(d => d.Scenario);
      setScenarios(scenarioList);
      setSelectedScenario(scenarioList[0]); // Set default scenario
      setEnergyData(data);
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  }, []);

  useEffect(() => {
    if (selectedScenario && energyData.length > 0) {
      drawDonutChart();
    }
  }, [selectedScenario, energyData]);

  const drawDonutChart = () => {
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => d.value);

    const arc = d3.arc()
      .innerRadius(radius - 70)
      .outerRadius(radius - 20);

    const arcHover = d3.arc()
      .innerRadius(radius - 70)
      .outerRadius(radius - 10);

    const data = energyData.find(d => d.Scenario === selectedScenario);
    if (!data) return;

    const formattedData = energyTypes.map(type => ({
      energyType: type,
      value: +data[type] || 0 // Convert to number, handle missing values
    }));

    const arcs = g.selectAll(".arc")
      .data(pie(formattedData))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => energyColors[d.data.energyType])
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover);
        
        g.select(".center-text").remove();
        
        g.append("text")
          .attr("class", "center-text")
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .attr("fill", "black")
          .attr("dy", "-0.5em")
          .text(d.data.energyType);
        
        g.append("text")
          .attr("class", "center-text")
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .attr("fill", "black")
          .attr("dy", "1em")
          .text(`${d.data.value}%`);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc);
        
        g.selectAll(".center-text").remove();
      });

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text(d => `${d.data.value}%`);
  };

  return (
    <div className="Dashboard">
      <div className="scenario-buttons">
        {scenarios.map(scenario => (
          <button
            key={scenario}
            onClick={() => setSelectedScenario(scenario)}
            style={{ backgroundColor: selectedScenario === scenario ? scenarioColors[scenario] : 'white' }}
          >
            {scenario}
          </button>
        ))}
      </div>
      <div className="dashboard-background" style={{ backgroundColor: scenarioColors[selectedScenario] }}>
        <div className="dashboard-header">
          <h2 className="dashboard-title">Global Energy Scenarios Dashboard - {selectedScenario}</h2>
        </div>
        <div className="charts-container">
          <div className="left-chart">
            <svg ref={donutRef} width={400} height={400}></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
