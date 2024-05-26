import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const legendRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedMineral, setSelectedMineral] = useState('Lithium'); // Default mineral
  const [mineralData, setMineralData] = useState(null);
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
          setSelectedCountry(d);
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

  }, []);

  useEffect(() => {
    if (mineralData) {
      const svg = d3.select(globeRef.current);
      svg.selectAll(".country").attr("fill", d => getColor(d.properties.name));
      createLegend();
    }
  }, [selectedMineral, mineralData]);

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

  return (
    <div className="GlobeContainer">
      <div className="mineral-buttons">
        {['Lithium', 'Cobalt', 'Nickel', 'Copper'].map(mineral => (
          <button
            key={mineral}
            onClick={() => setSelectedMineral(mineral)}
            style={{ backgroundColor: selectedMineral === mineral ? 'lightgreen' : 'white' }}
          >
            {mineral}
          </button>
        ))}
      </div>
      <svg ref={legendRef} width={300} height={30} style={{ marginBottom: '10px' }}></svg>
      <svg ref={globeRef} width={800} height={800}></svg>
    </div>
  );
}

export default Glb;
