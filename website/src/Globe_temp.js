import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const productionChartRef = useRef(null);
  const consumptionChartRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(1950); // Default year
  const isDragging = useRef(false);

  useEffect(() => {
    const svg = d3.select(globeRef.current);

    const width = 800;
    const height = 800;

    // Projection du globe
    const projection = d3.geoOrthographic()
      .scale(300)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Add ocean background as a circle
    svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", projection.scale())
      .attr("fill", "#a0c4ff"); // Ocean color

    // Load temperature data
    d3.csv("data/temperature_data.csv")
      .then(temperatureData => {
        console.log("Loaded temperature data:", temperatureData);
        setTemperatureData(temperatureData);
      })
      .catch(error => {
        console.error("Error loading temperature data:", error);
      });

    // Load production data
    d3.csv("data/world_energy_production.csv")
      .then(productionData => {
        console.log("Loaded production data:", productionData);
        setProductionData(productionData);
      })
      .catch(error => {
        console.error("Error loading production data:", error);
      });

    // Load consumption data
    d3.csv("data/world_energy_conso.csv")
      .then(consumptionData => {
        console.log("Loaded consumption data:", consumptionData);
        setConsumptionData(consumptionData);
      })
      .catch(error => {
        console.error("Error loading consumption data:", error);
      });

    // Function to draw the globe and countries
    const drawGlobe = countries => {
      svg.selectAll(".country").remove(); // Clear existing paths
      svg.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "white")  // Couleur initiale du pays
        .attr("id", d => `country-${d.id}`) // Ajouter un ID unique à chaque pays
        .on("mousedown", function (event, d) {
          isDragging.current = true;
          setSelectedCountry(d);
          svg.selectAll(".country").attr("fill", country => (country === d ? "#ffcc00" : "white"));
          globeRef.current.classList.add('shifted');
          if (temperatureData) {
            const yearData = temperatureData.find(data => data[selectedYear.toString()]);
            if (yearData && yearData[d.properties.name]) {
              console.log(`Average Temperature for ${d.properties.name}: ${yearData[d.properties.name]}`);
            } else {
              console.log(`No temperature data available for ${d.properties.name}`);
            }
          }
          plotBarCharts(d.properties.name);
        });

      svg.on("mousemove", function (event) {
        if (isDragging.current) {
          const dx = event.movementX;
          const dy = event.movementY;
          const rotate = projection.rotate();
          const scaleFactor = 0.25;

          rotate[0] += dx * scaleFactor;
          rotate[1] -= dy * scaleFactor;
          projection.rotate(rotate);
          svg.selectAll("path").attr("d", path);
        }
      });

      svg.on("mouseup", () => {
        isDragging.current = false;
      });

      svg.on("mouseleave", () => {
        isDragging.current = false;
      });
    };

    // Chargement des données du monde
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      const countries = topojson.feature(data, data.objects.countries);
      drawGlobe(countries);
    });

  }, [selectedYear]); // Re-run the effect when the selected year changes

  const plotBarCharts = (country) => {
    if (!productionData || !consumptionData) return;

    const filteredProductionData = productionData.filter(d => d.country === country);
    const filteredConsumptionData = consumptionData.filter(d => d.country === country);

    const productionChart = d3.select(productionChartRef.current);
    const consumptionChart = d3.select(consumptionChartRef.current);

    // Clear existing charts
    productionChart.selectAll("*").remove();
    consumptionChart.selectAll("*").remove();

    // Production chart
    const prodMargin = { top: 20, right: 30, bottom: 40, left: 40 };
    const prodWidth = 400 - prodMargin.left - prodMargin.right;
    const prodHeight = 200 - prodMargin.top - prodMargin.bottom;

    const prodSvg = productionChart.append("svg")
      .attr("width", prodWidth + prodMargin.left + prodMargin.right)
      .attr("height", prodHeight + prodMargin.top + prodMargin.bottom)
      .append("g")
      .attr("transform", `translate(${prodMargin.left},${prodMargin.top})`);

    const prodX = d3.scaleBand()
      .domain(filteredProductionData.map(d => d.type))
      .range([0, prodWidth])
      .padding(0.1);

    const prodY = d3.scaleLinear()
      .domain([0, d3.max(filteredProductionData, d => +d[selectedYear])])
      .range([prodHeight, 0]);

    prodSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${prodHeight})`)
      .call(d3.axisBottom(prodX));

    prodSvg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(prodY));

    prodSvg.selectAll(".bar")
      .data(filteredProductionData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => prodX(d.type))
      .attr("y", d => prodY(+d[selectedYear]))
      .attr("width", prodX.bandwidth())
      .attr("height", d => prodHeight - prodY(+d[selectedYear]))
      .attr("fill", "#69b3a2");

    // Consumption chart
    const consoMargin = { top: 20, right: 30, bottom: 40, left: 40 };
    const consoWidth = 400 - consoMargin.left - consoMargin.right;
    const consoHeight = 200 - consoMargin.top - consoMargin.bottom;

    const consoSvg = consumptionChart.append("svg")
      .attr("width", consoWidth + consoMargin.left + consoMargin.right)
      .attr("height", consoHeight + consoMargin.top + consoMargin.bottom)
      .append("g")
      .attr("transform", `translate(${consoMargin.left},${consoMargin.top})`);

    const consoX = d3.scaleBand()
      .domain(filteredConsumptionData.map(d => d.type))
      .range([0, consoWidth])
      .padding(0.1);

    const consoY = d3.scaleLinear()
      .domain([0, d3.max(filteredConsumptionData, d => +d[selectedYear])])
      .range([consoHeight, 0]);

    consoSvg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${consoHeight})`)
      .call(d3.axisBottom(consoX));

    consoSvg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(consoY));

    consoSvg.selectAll(".bar")
      .data(filteredConsumptionData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => consoX(d.type))
      .attr("y", d => consoY(+d[selectedYear]))
      .attr("width", consoX.bandwidth())
      .attr("height", d => consoHeight - consoY(+d[selectedYear]))
      .attr("fill", "#ff6f69");
  };

  return (
    <div className="GlobeContainer">
      <svg ref={globeRef} width={800} height={800}></svg>
      <div className="yearSlider" style={{ marginTop: '20px' }}>
        <label htmlFor="year">Select Year:</label>
        <input 
          type="range" 
          id="year" 
          name="year" 
          min="1950" 
          max="2013" 
          value={selectedYear} 
          onChange={e => setSelectedYear(+e.target.value)} // Convert value to number
        />
        <span>{selectedYear}</span>
      </div>
      <div ref={productionChartRef} style={{ position: 'absolute', top: '10px', right: '420px' }}></div>
      <div ref={consumptionChartRef} style={{ position: 'absolute', top: '220px', right: '420px' }}></div>
    </div>
  );
}

export default Glb;