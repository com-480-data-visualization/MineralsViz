import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const graphRef = useRef(null);
  const legendRef = useRef(null);
  const [selectedEnergy, setSelectedEnergy] = useState('Wind');
  const [renewableProdData, setRenewableProdData] = useState(null);
  const [evolvProdData, setEvolvProdData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const isDragging = useRef(false);

  useEffect(() => {
    // Function to draw the globe and countries
    const drawGlobe = (countries, projection, path) => {
      const svg = d3.select(globeRef.current);
      svg.selectAll(".country").remove(); // Clear existing paths
      svg.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", d => getColor(d.properties.name))
        .attr("id", d => `country-${d.id}`) // Add a unique ID to each country
        .on("mousedown", function (event, d) {
          isDragging.current = true;
          setSelectedCountry(d.properties.name);
          svg.selectAll(".country").attr("stroke", null); // Remove previous border
          d3.select(this).attr("stroke", "black"); // Highlight selected country
          globeRef.current.classList.add('shifted');
          plotGraph(d.properties.name);
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

    // Function to initialize the globe
    const initializeGlobe = () => {
      const svg = d3.select(globeRef.current);

      const width = 800;
      const height = 800;

      // Projection of the globe
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

      // Load world data and draw globe
      d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
        const countries = topojson.feature(data, data.objects.countries);
        drawGlobe(countries, projection, path);
      });
    };

    initializeGlobe();
  }, []); // Empty dependency array to run only once on mount

  const getColor = (country) => {
    if (!renewableProdData) return 'white';
    const countryData = renewableProdData.find(d => d.Country === country);
    if (!countryData) return 'white';
    const value = +countryData[selectedEnergy];
    const colorScale = d3.scaleLinear()
      .domain([0, d3.max(renewableProdData, d => +d[selectedEnergy])])
      .range(["#e5ffe5", "#006400"]);
    return colorScale(value);
  };

  const plotGraph = (country) => {
    if (!evolvProdData) return;

    const countryData = evolvProdData.filter(d => d.Country === country);
    if (countryData.length === 0) return;

    const graphSvg = d3.select(graphRef.current);
    graphSvg.selectAll("*").remove(); // Clear existing graph

    const margin = { top: 60, right: 30, bottom: 70, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(countryData, d => +d.Year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(countryData, d => +d[selectedEnergy])])
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(+d.Year))
      .y(d => y(+d[selectedEnergy]));

    const g = graphSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("path")
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("d", line);

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
      .text(`Evolution of ${selectedEnergy} Production in ${country}`);
  };

  // Create a legend for the color scale
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
      .attr("stop-color", "#e5ffe5");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#006400");

    legendSvg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(renewableProdData, d => +d[selectedEnergy])])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}`);

    legendSvg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis);
  };

  useEffect(() => {
    // Load renewable production data
    d3.csv("data/renewable_prod.csv").then(data => {
      setRenewableProdData(data);
    });

    // Load evolution production data
    d3.csv("data/evolv_prod_renewable.csv").then(data => {
      setEvolvProdData(data);
    });
  }, []);

  useEffect(() => {
    if (renewableProdData) {
      createLegend();
      const svg = d3.select(globeRef.current);
      svg.selectAll(".country").attr("fill", d => getColor(d.properties.name));
    }
  }, [selectedEnergy, renewableProdData]);

  return (
    <div className="GlobeContainer">
      <div className="energy-buttons">
        {['Wind', 'Hydro', 'Solar', 'Other'].map(energy => (
          <button key={energy} onClick={() => setSelectedEnergy(energy)}>
            {energy}
          </button>
        ))}
      </div>
      <svg ref={legendRef} width={300} height={30} style={{ marginBottom: '10px' }}></svg>
      <svg ref={globeRef} width={800} height={800}></svg>
      <div ref={graphRef} style={{ position: 'absolute', top: '850px', left: '10px' }}></div>
    </div>
  );
}

export default Glb;
