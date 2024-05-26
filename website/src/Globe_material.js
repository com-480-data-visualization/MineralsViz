import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const legendRef = useRef(null);
  const graphRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedMineral, setSelectedMineral] = useState('Lithium'); // Default mineral
  const [mineralData, setMineralData] = useState(null);
  const [extractionData, setExtractionData] = useState(null);
  const [reserveData, setReserveData] = useState(null);
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
      .attr("fill", "#add8e6"); // Ocean color

    // Function to draw the globe and countries
    const drawGlobe = countries => {
      svg.selectAll(".country").remove(); // Clear existing paths
      svg.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", d => getColor(d.properties.name))  // Color based on selected mineral
        .attr("id", d => `country-${d.id}`) // Add a unique ID to each country
        .on("mousedown", function (event, d) {
          isDragging.current = true;
          setSelectedCountry(d.properties.name);
          svg.selectAll(".country").attr("stroke", null); // Remove previous border
          d3.select(this).attr("stroke", "black"); // Highlight selected country
          globeRef.current.classList.add('shifted');
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

    // Load world data
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      const countries = topojson.feature(data, data.objects.countries);
      drawGlobe(countries);
    });

    // Load mineral data
    d3.csv("data/tot_mineral.csv").then(data => {
      console.log("Loaded mineral data:", data);
      setMineralData(data);
    });

    // Load extraction data
    d3.csv("data/extraction_mineral_v2.csv").then(data => {
      console.log("Loaded extraction data:", data);
      setExtractionData(data);
    });

    // Load reserve data
    d3.csv("data/reserve.csv").then(data => {
      console.log("Loaded reserve data:", data);
      setReserveData(data);
    });

  }, []);

  useEffect(() => {
    if (mineralData) {
      const svg = d3.select(globeRef.current);
      svg.selectAll(".country").attr("fill", d => getColor(d.properties.name));
      createLegend();
    }
  }, [selectedMineral, mineralData]);

  useEffect(() => {
    if (selectedCountry && extractionData && reserveData) {
      plotGraph(selectedCountry);
    }
  }, [selectedCountry, selectedMineral, extractionData, reserveData]);

  const getColor = (country) => {
    if (!mineralData) return 'white';
    const countryData = mineralData.find(d => d.country === country && d.type === selectedMineral);
    if (!countryData) return 'white';
    const value = +countryData.quantity;
    const maxValue = d3.max(mineralData.filter(d => d.type === selectedMineral), d => +d.quantity);
    const colorScale = d3.scaleLog()
      .domain([1, maxValue]) // Using 1 to avoid log(0)
      .range(["#ffffff", "#4d4d4d"]); // White to dark grey
    return colorScale(value);
  };

  const createLegend = () => {
    const legendSvg = d3.select(legendRef.current);
    legendSvg.selectAll("*").remove(); // Clear existing legend

    const legendWidth = 300;
    const legendHeight = 10;

    const gradient = legendSvg.append("defs")
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#ffffff");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4d4d4d");

    legendSvg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const maxValue = d3.max(mineralData.filter(d => d.type === selectedMineral), d => +d.quantity);
    const legendScale = d3.scaleLog()
      .domain([1, maxValue])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5, ",.1s") // Format ticks for logarithmic scale
      .tickFormat(d => `${d}`);

    legendSvg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis);
  };

  const plotGraph = (country) => {
    const countryExtractionData = extractionData.find(d => d.country === country && d.type === selectedMineral);
    const countryReserveData = reserveData.find(d => d.country === country && d.type === selectedMineral);

    if (!countryExtractionData || !countryReserveData) {
      console.log(`No data found for ${country} and mineral ${selectedMineral}`);
      return;
    }

    const years = Object.keys(countryExtractionData).slice(2).map(year => +year); // Assuming year columns start from index 2
    const extractionValues = years.map(year => +countryExtractionData[year] || 0);
    const reserveValues = years.map(year => +countryReserveData[year] || 0);

    console.log(`Years: ${years}`);
    console.log(`Extraction values: ${extractionValues}`);
    console.log(`Reserve values: ${reserveValues}`);

    const filteredYears = years.filter((year, i) => !isNaN(extractionValues[i]) && !isNaN(reserveValues[i]));
    const filteredExtractionValues = extractionValues.filter(value => !isNaN(value));
    const filteredReserveValues = reserveValues.filter(value => !isNaN(value));

    const graphSvg = d3.select(graphRef.current);
    graphSvg.selectAll("*").remove(); // Clear existing graph

    const margin = { top: 60, right: 30, bottom: 70, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(filteredYears))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max([...filteredExtractionValues, ...filteredReserveValues])])
      .range([height, 0]);

    const lineExtraction = d3.line()
      .x((d, i) => x(filteredYears[i]))
      .y((d, i) => y(filteredExtractionValues[i]));

    const lineReserve = d3.line()
      .x((d, i) => x(filteredYears[i]))
      .y((d, i) => y(filteredReserveValues[i]));

    const g = graphSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("path")
      .datum(filteredExtractionValues)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("d", lineExtraction);

    g.append("path")
      .datum(filteredReserveValues)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", lineReserve);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`Evolution of ${selectedMineral} Extraction and Reserves in ${country}`);
  };

  return (
    <div className="GlobeContainer">
      <div className="mineral-buttons">
        {['Lithium', 'Cobalt', 'Nickel', 'Copper'].map(mineral => (
          <button
            key={mineral}
            onClick={() => setSelectedMineral(mineral)}
            style={{ backgroundColor: selectedMineral === mineral ? 'grey' : 'white' }}
          >
            {mineral}
          </button>
        ))}
      </div>
      <svg ref={legendRef} width={300} height={30} style={{ marginBottom: '10px' }}></svg>
      <svg ref={globeRef} width={800} height={800}></svg>
      <div className="graph-container" style={{ position: 'absolute', top: '50px', right: '10px', width: '500px', height: '300px' }}>
        <svg ref={graphRef} width="100%" height="100%"></svg>
      </div>
    </div>
  );
}

export default Glb;
