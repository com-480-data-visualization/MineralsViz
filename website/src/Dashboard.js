import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './styles.css';

const scenarioColors = {
  'M0 - 100% Renewables': '#ff9999', 
  'M1 - Distributed Renewables': '#99ccff',
  'M23 - Centralized Renewables': '#99ff99'
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
  'Steel': '#FFA07A', 
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
  const [pollutionData, setPollutionData] = useState([]);

  const donutRef = useRef(null);
  const mineralsBarRef = useRef(null);
  const pollutionBarRef = useRef(null);
  const horizontalBarRef = useRef(null);

  useEffect(() => {
    Promise.all([
      d3.csv('data/rte_scenarios_energy_mix.csv'),
      d3.csv('data/energy_minerals_by_TWh.csv'),
      d3.csv('data/mineral_reserves.csv'),
      d3.csv('data/detailed_pollution_by_energy_type.csv')
    ]).then(([scenarioData, mineralsData, reservesData, pollutionData]) => {
      const scenarioList = scenarioData.map(d => d.Scenario);
      setScenarios(scenarioList);
      setSelectedScenario(scenarioList[0]); 
      setEnergyData(scenarioData);
      setMineralsData(mineralsData);
      setReservesData(reservesData);
      setPollutionData(pollutionData);
    }).catch(error => {
      console.error("Error loading data:", error);
    });
  }, []);

  useEffect(() => {
    if (selectedScenario && energyData.length > 0) {
      drawDonutChart();
      drawMineralsBarChart();
      drawPollutionChart();
      drawHorizontalBarChart();
    }
  }, [selectedScenario, energyData, mineralsData, reservesData, pollutionData]);

  const drawDonutChart = () => {
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove();

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
      value: +data[type] || 0 
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

    const legend = d3.select('.legend');
    legend.selectAll("*").remove();

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
    svg.selectAll("*").remove(); 

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const scenarioData = energyData.find(d => d.Scenario === selectedScenario);
    const mineralNames = Object.keys(mineralColors).filter(name => name !== 'Concrete');

    const neededMinerals2021 = {};
    const neededMinerals2050 = {};

    energyTypes.forEach(type => {
      const percentage = +scenarioData[type] || 0;
      const production2021 = (percentage * 27000) / 100; 
      const production2050 = (percentage * 50000) / 100; 

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
      '2021': '#FFD700', 
      '2050': '#0066cc', 
      'Reserve': '#FFFACD' 
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
      .attr("fill", d => colors[d.key])
      .on("mouseover", function(event, d) {
        const yearsRemaining = d.key !== 'Reserve' ? reserves[d.mineral] / d.value : null;
        const displayText = yearsRemaining ? `${Math.round(yearsRemaining)} years` : '';
        
        g.append("text")
          .attr("class", "hover-text")
          .attr("x", x0(d.mineral) + x1(d.key) + x1.bandwidth() / 2)
          .attr("y", y(d.value) - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "black")
          .text(displayText);
      })
      .on("mouseout", function() {
        g.selectAll(".hover-text").remove();
      });

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(10, "~s"));

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
      .text(`Mineral Needs and Reserves`);
  };

  const drawPollutionChart = () => {
    if (!pollutionData.length  || !energyData.length) return;

    const svg = d3.select(pollutionBarRef.current);
    svg.selectAll("*").remove(); 

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const scenarioData = energyData.find(d => d.Scenario === selectedScenario);
    const pollutionTypes = ['Fabrication', 'Mineral Extraction', 'Usage', 'Waste', 'CO2 Total Emission', 'Water Impact', 'Soil Impact', 'Toxic Waste', 'Air Pollutants'];

    const Pollution2021 = {};
    const Pollution2050 = {};

    energyTypes.forEach(type => {
      const percentage = +scenarioData[type] || 0;
      const production2021 = (percentage * 27000) / 100; 
      const production2050 = (percentage * 50000) / 100; 

      pollutionData.forEach(pollution => {
        if (pollution.type === type) {
          pollutionTypes.forEach(name => {
            if (!Pollution2021[name]) Pollution2021[name] = 0;
            if (!Pollution2050[name]) Pollution2050[name] = 0;
            Pollution2021[name] += +pollution[name] * production2021;
            Pollution2050[name] += +pollution[name] * production2050;
          });
        }
      });
    });

    const reserves = {};
    reservesData.forEach(reserve => {
      reserves[reserve.type] = +reserve.quantity;
    });

    const pollutionChartData = pollutionTypes.map(name => ({
      pollution: name,
      '2021': Pollution2021[name] || 0,
      '2050': Pollution2050[name] || 0,
    }));

    const x0 = d3.scaleBand()
      .domain(pollutionChartData.map(d => d.pollution))
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(['2021', '2050', 'Reserve'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLog()
      .domain([1, d3.max(pollutionChartData, d => d3.max(['2021', '2050'], key => d[key]))])
      .rangeRound([height, 0])
      .nice();

    const colors = {
      '2021': '#FFD700', 
      '2050': '#0066cc', 
    };

    const bars = g.append("g")
      .selectAll("g")
      .data(pollutionChartData)
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d.pollution)},0)`);

    bars.selectAll("rect")
      .data(d => ['2021', '2050'].map(key => ({ key, value: d[key], pollution: d.pollution })))
      .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => colors[d.key])

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(10, "~s"));

    const legend = g.append("g")
      .attr("transform", `translate(0, ${height + 40})`);

    const legendKeys = ['2021', '2050'];
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
      .text(`Amount of Pollution Emitted`);
  };

  const drawHorizontalBarChart = () => {
    if (!pollutionData.length || !energyData.length) return;

    const svg = d3.select(horizontalBarRef.current);
    svg.selectAll("*").remove(); 

    const margin = { top: 40, right: 60, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const scenarioData = energyData.find(d => d.Scenario === selectedScenario);
    const actualCO2 = 37400000000;
    const actualWater = 14500000000;

    const Pollution2021 = {};
    const Pollution2050 = {};

    energyTypes.forEach(type => {
      const percentage = +scenarioData[type] || 0;
      const production2021 = (percentage * 27000) / 100; 
      const production2050 = (percentage * 50000) / 100; 

      pollutionData.forEach(pollution => {
        if (pollution.type === type) {
          Pollution2021['CO2 Total Emission'] = (Pollution2021['CO2 Total Emission'] || 0) + (+pollution['CO2 Total Emission'] * production2021);
          Pollution2050['CO2 Total Emission'] = (Pollution2050['CO2 Total Emission'] || 0) + (+pollution['CO2 Total Emission'] * production2050);
          Pollution2021['Water Impact'] = (Pollution2021['Water Impact'] || 0) + (+pollution['Water Impact'] * production2021);
          Pollution2050['Water Impact'] = (Pollution2050['Water Impact'] || 0) + (+pollution['Water Impact'] * production2050);
        }
      });
    });

    const barData = [
      { name: 'CO2 Emission', year: '2021', value: Pollution2021['CO2 Total Emission'], color: '#FFD700' },
      { name: 'CO2 Emission', year: '2050', value: Pollution2050['CO2 Total Emission'], color: '#87CEFA' },
      { name: 'CO2 Emission', year: 'Actual', value: actualCO2, color: '#cc6600' },
      { name: 'Water Impact', year: '2021', value: Pollution2021['Water Impact'], color: '#FFD700' },
      { name: 'Water Impact', year: '2050', value: Pollution2050['Water Impact'], color: '#87CEFA' },
      { name: 'Water Impact', year: 'Actual', value: actualWater, color: '#cc6600' }
    ];

    const x = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.value)])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(['CO2 Emission', 'Water Impact'])
      .range([0, height])
      .padding(0.1);

    const y1 = d3.scaleBand()
      .domain(['2021', '2050', 'Actual'])
      .range([0, y.bandwidth()])
      .padding(0.05);

    g.selectAll(".bar")
      .data(barData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => y(d.name) + y1(d.year))
      .attr("width", d => x(d.value))
      .attr("height", y1.bandwidth())
      .attr("fill", d => d.color);

    g.selectAll(".label")
      .data(barData)
      .enter().append("text")
      .attr("class", "label")
      .attr("x", d => x(d.value) + 5)
      .attr("y", d => y(d.name) + y1(d.year) + y1.bandwidth() / 2)
      .attr("dy", ".35em")
      .text(d => {
        if (d.year !== 'Actual') {
          const actualValue = d.name === 'CO2 Emission' ? actualCO2 : actualWater;
          const diffPercentage = ((d.value - actualValue) / actualValue * 100).toFixed(2);
          return `(${Math.round(diffPercentage)}%)`;
        }
        return;
      })
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "black");

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5, "s"));

    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left},${height + margin.top + 10})`);

    const legendData = [
      { year: '2021', color: '#FFD700' },
      { year: '2050', color: '#87CEFA' },
      { year: 'Actual', color: '#cc6600' }
    ];

    legend.selectAll("rect")
      .data(legendData)
      .enter().append("rect")
      .attr("x", (d, i) => i * 100)
      .attr("y", 0)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => d.color);

    legend.selectAll("text")
      .data(legendData)
      .enter().append("text")
      .attr("x", (d, i) => i * 100 + 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(d => d.year)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("color", "black");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`CO2 and Water Pollution Comparison Predictive vs Actual`);
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
          <h2 className="dashboard-title">Global Energy Dashboard: {selectedScenario}</h2>
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
        <div className="pollution-bar-container">
          <svg ref={pollutionBarRef} width={800} height={400}></svg>
        </div>
        <div className="horizontal-bar-container">
          <svg ref={horizontalBarRef} width={800} height={200}></svg>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
