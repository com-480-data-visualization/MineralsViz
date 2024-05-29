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

const mineralColors = {
  'Steel': '#B0C4DE',
  'Copper': '#DEB887',
  'Aluminium': '#4682B4',
  'Zinc': '#708090',
  'Rare Earths': '#2F4F4F',
  'Nickel': '#A9A9A9',
  'Manganese': '#696969',
  'Lead': '#C0C0C0',
  'Titanium': '#DCDCDC',
  'Silicon': '#BEBEBE',
  'Silver': '#808080'
};

const energyTypes = [
  'Solar', 'Onshore Wind', 'Offshore Wind', 'Hydropower', 'Bioenergy', 
  'Marine Energy', 'Nuclear', 'Other Renewables'
];

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [energyData, setEnergyData] = useState([]);
  const [mineralsData, setMineralsData] = useState([]);
  const [reservesData, setReservesData] = useState([]);

  const donutRef = useRef(null);
  const mineralsBarRef = useRef(null);

  useEffect(() => {
    Promise.all([
      d3.csv('/data/rte_scenarios_energy_mix.csv'),
      d3.csv('/data/energy_minerals_by_TWh.csv'),
      d3.csv('/data/mineral_reserves.csv')
    ]).then(([scenarioData, mineralsData, reservesData]) => {
      const scenarioList = scenarioData.map(d => d.Scenario);
      setScenarios(scenarioList);
      setSelectedScenario(scenarioList[0]); // Set default scenario
      setEnergyData(scenarioData);
      setMineralsData(mineralsData);
      setReservesData(reservesData);
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  }, []);

  useEffect(() => {
    if (selectedScenario && energyData.length > 0) {
      drawDonutChart();
      drawMineralsBarChart();
    }
  }, [selectedScenario, energyData, mineralsData, reservesData]);

  const drawDonutChart = () => {
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => d.value);

    const arc = d3.arc()
      .innerRadius(radius - 35)
      .outerRadius(radius - 10);

    const arcHover = d3.arc()
      .innerRadius(radius - 35)
      .outerRadius(radius - 5);

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
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .attr("fill", "black")
          .attr("dy", "-0.5em")
          .text(d.data.energyType);
        
        g.append("text")
          .attr("class", "center-text")
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
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
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text(d => `${d.data.value}%`);

    // Add the legend
    const legend = d3.select('.legend');
    legend.selectAll("*").remove(); // Clear previous legend

    legend.append('tr')
      .html(`
        <th>Type of Energy</th>
        <th>2021</th>
        <th>2050</th>
      `)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("color", "black")
      .style("border-bottom", "1px solid black");

    legend.selectAll('tr.data-row')
      .data(formattedData)
      .enter()
      .append('tr')
      .attr('class', 'data-row')
      .html(d => `
        <td style="color: ${energyColors[d.energyType]}">${d.energyType}</td>
        <td>${Math.round(d.value * 27000 / 100)}</td>
        <td>${Math.round(d.value * 50000 / 100)}</td>
      `)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("color", "black")
      .style("border-bottom", "1px solid black");

    legend.append('tr')
      .html(`
        <td colspan="3" style="text-align: right; font-size: 10px; color: black;">* values in TWh</td>
      `)
      .style("font-size", "10px")
      .style("color", "black")
      .style("font-weight", "normal");
  };

  const drawMineralsBarChart = () => {
    if (!mineralsData.length || !reservesData.length || !energyData.length) return;

    const svg = d3.select(mineralsBarRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate needed minerals for 2021 and 2050
    const scenarioData = energyData.find(d => d.Scenario === selectedScenario);
    const mineralNames = Object.keys(mineralColors).filter(name => name !== 'Concrete');

    const neededMinerals2021 = {};
    const neededMinerals2050 = {};

    energyTypes.forEach(type => {
      const percentage = +scenarioData[type] || 0;
      const production2021 = (percentage * 27000) / 100; // in TWh
      const production2050 = (percentage * 50000) / 100; // in TWh

      mineralsData.forEach(mineral => {
        if (mineral.type === type) {
          mineralNames.forEach(name => {
            if (!neededMinerals2021[name]) neededMinerals2021[name] = 0;
            if (!neededMinerals2050[name]) neededMinerals2050[name] = 0;
            neededMinerals2021[name] += +mineral[name] * production2021;
            neededMinerals2050[name] += +mineral[name] * production2050;
          });
        }
      });
    });

    const reserves = {};
    reservesData.forEach(reserve => {
      reserves[reserve.type] = +reserve.quantity;
    });

    // Prepare data for the bar chart
    const mineralsChartData = mineralNames.map(name => ({
      mineral: name,
      '2021': neededMinerals2021[name] || 0,
      '2050': neededMinerals2050[name] || 0,
      'Reserve': reserves[name] || 0
    }));

    const x0 = d3.scaleBand()
      .domain(mineralsChartData.map(d => d.mineral))
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(['2021', '2050', 'Reserve'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLog()
      .domain([1, d3.max(mineralsChartData, d => d3.max(['2021', '2050', 'Reserve'], key => d[key]))])
      .rangeRound([height, 0])
      .nice();

    const colors = {
      '2021': '#D1B2FF', // pastel purple
      '2050': '#7EC8E3', // pastel blue
      'Reserve': '#FFFACD' // pastel yellow
    };

    const bars = g.append("g")
      .selectAll("g")
      .data(mineralsChartData)
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d.mineral)},0)`);

    bars.selectAll("rect")
      .data(d => ['2021', '2050', 'Reserve'].map(key => ({ key, value: d[key], mineral: d.mineral })))
      .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => colors[d.key]);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(10, "~s"));

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(0, ${height + 40})`);

    const legendKeys = ['2021', '2050', 'Reserve'];
    legend.selectAll("rect")
      .data(legendKeys)
      .enter().append("rect")
      .attr("x", (d, i) => i * 100)
      .attr("y", 0)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => colors[d]);

    legend.selectAll("text")
      .data(legendKeys)
      .enter().append("text")
      .attr("x", (d, i) => i * 100 + 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(d => d)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("color", "black");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Mineral Needs and Reserves for ${selectedScenario}`);
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
            <svg ref={donutRef} width={200} height={200}></svg>
          </div>
          <div className="legend-container">
            <table className="legend"></table>
          </div>
        </div>
        <div className="minerals-bar-container">
          <svg ref={mineralsBarRef} width={800} height={400}></svg>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

