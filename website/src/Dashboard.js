import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './styles.css';

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [energyData, setEnergyData] = useState([]);
  const [mineralsData, setMineralsData] = useState([]);
  const [reservesData, setReservesData] = useState([]);
  const [pollutionData, setPollutionData] = useState([]);

  const donutRef = useRef(null);
  const mineralsBarRef = useRef(null);
  const pollutionBarRef = useRef(null);
  const co2WaterBarRef = useRef(null);

  useEffect(() => {
    Promise.all([
      d3.csv('/data/rte_scenarios_energy_mix.csv'),
      d3.csv('/data/energy_minerals_by_TWh.csv'),
      d3.csv('/data/mineral_reserves.csv'),
      d3.csv('/data/detailed_pollution_by_energy_type.csv')
    ]).then(([scenarioData, mineralsData, reservesData, pollutionData]) => {
      setScenarios(scenarioData);
      setSelectedScenario(scenarioData[0].Scenario); // Set default scenario
      setEnergyData(scenarioData);
      setMineralsData(mineralsData);
      setReservesData(reservesData);
      setPollutionData(pollutionData);
      console.log("Data loaded:", { scenarioData, mineralsData, reservesData, pollutionData });
    });
  }, []);

  useEffect(() => {
    if (selectedScenario && energyData.length && mineralsData.length && reservesData.length && pollutionData.length) {
      console.log("Drawing charts for scenario:", selectedScenario);
      drawDonutChart();
      drawMineralsBarChart();
      drawPollutionBarChart();
      drawCO2WaterBarChart();
    }
  }, [selectedScenario, energyData, mineralsData, reservesData, pollutionData]);

  const drawDonutChart = () => {
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemePastel1);

    const pie = d3.pie()
      .value(d => d.percentage);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const data = energyData.find(d => d.Scenario === selectedScenario);
    console.log("Energy data for donut chart:", data);

    const arcs = g.selectAll(".arc")
      .data(pie(Object.keys(data).slice(1).map(key => ({ energyType: key, percentage: +data[key] }))))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.energyType));

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => `${d.data.percentage}%`);

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 120}, ${height / 4})`);

    legend.selectAll("rect")
      .data(arcs.data())
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", d => color(d.data.energyType));

    legend.selectAll("text")
      .data(arcs.data())
      .enter().append("text")
      .attr("x", 24)
      .attr("y", (d, i) => i * 20 + 9)
      .attr("dy", ".35em")
      .text(d => `${d.data.energyType}: ${data[d.data.energyType]} TWh`)
      .style("font-size", "12px")
      .style("font-weight", "bold");
  };

  const drawMineralsBarChart = () => {
    const svg = d3.select(mineralsBarRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const mineralsInfo = mineralsData.filter(d => d.type === selectedScenario);
    console.log("Minerals data for bar chart:", mineralsInfo);

    const x0 = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .padding(0.05);

    const y = d3.scaleLinear()
      .rangeRound([height, 0]);

    const y1 = d3.scaleLinear()
      .rangeRound([height, 0]);

    const colors = d3.scaleOrdinal(d3.schemePastel1);

    const keys = Object.keys(mineralsInfo[0]).slice(1);
    x0.domain(mineralsInfo.map(d => d.country));
    x1.domain(keys).rangeRound([0, x0.bandwidth()]);
    y.domain([0, d3.max(mineralsInfo, d => d3.max(keys, key => +d[key]))]).nice();
    y1.domain([0, d3.max(reservesData, d => d3.max(keys, key => +d[key]))]).nice();

    g.append("g")
      .selectAll("g")
      .data(mineralsInfo)
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d.country)},0)`)
      .selectAll("rect")
      .data(d => keys.map(key => ({ key, value: +d[key] })))
      .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => colors(d.key));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(y1));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Mineral Quantities and Reserves for ${selectedScenario} Energy`);
  };

  const drawPollutionBarChart = () => {
    const svg = d3.select(pollutionBarRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const pollutionInfo = pollutionData.filter(d => d.energyType === selectedScenario);
    console.log("Pollution data for bar chart:", pollutionInfo);

    const x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .domain(pollutionInfo.map(d => d.pollutionType));

    const y = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(pollutionInfo, d => +d.amount)]).nice();

    const colors = d3.scaleOrdinal(d3.schemePastel1);

    g.append("g")
      .selectAll(".bar")
      .data(pollutionInfo)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.pollutionType))
      .attr("y", d => y(+d.amount))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(+d.amount))
      .attr("fill", d => colors(d.pollutionType));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Pollution by Type for ${selectedScenario} Energy`);
  };

  const drawCO2WaterBarChart = () => {
    const svg = d3.select(co2WaterBarRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 1200 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const pollutionInfo = pollutionData.filter(d => d.energyType === selectedScenario);
    const co2Actual = 10000; // Replace with actual data
    const co2Scenario = d3.sum(pollutionInfo.filter(d => d.pollutionType === 'CO2 Emissions'), d => +d.amount);
    const waterActual = 500; // Replace with actual data
    const waterScenario = d3.sum(pollutionInfo.filter(d => d.pollutionType === 'Water Pollution'), d => +d.amount);

    const data = [
      { type: 'Actual CO2 Emissions', value: co2Actual },
      { type: `CO2 Emissions in ${selectedScenario}`, value: co2Scenario },
      { type: 'Actual Water Pollution', value: waterActual },
      { type: `Water Pollution in ${selectedScenario}`, value: waterScenario }
    ];

    const x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .domain(data.map(d => d.type));

    const y = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(data, d => d.value)]).nice();

    const colors = d3.scaleOrdinal(d3.schemePastel1);

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.type))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => colors(d.type));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .attr("text-anchor", "end");

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`CO2 Emissions and Water Pollution for ${selectedScenario} Energy`);
  };

  return (
    <div className="Dashboard">
      <h1 className="dashboard-title">Global Energy Scenarios Dashboard</h1>
      <div className="scenario-buttons">
        {scenarios.map(scenario => (
          <button
            key={scenario.Scenario}
            onClick={() => setSelectedScenario(scenario.Scenario)}
            style={{ backgroundColor: selectedScenario === scenario.Scenario ? 'lightblue' : 'white' }}
          >
            {scenario.Scenario}
          </button>
        ))}
      </div>
      <div className="charts-container">
        <div className="left-chart">
          <svg ref={donutRef} width={400} height={400}></svg>
        </div>
        <div className="center-chart">
          <svg ref={mineralsBarRef} width={600} height={400}></svg>
        </div>
        <div className="right-chart">
          <svg ref={pollutionBarRef} width={400} height={400}></svg>
        </div>
      </div>
      <div className="bottom-chart">
        <svg ref={co2WaterBarRef} width={1200} height={100}></svg>
      </div>
    </div>
  );
}

export default Dashboard;

