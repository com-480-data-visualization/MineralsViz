import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const legendRef = useRef(null);
  const graphRef = useRef(null);
  const pollutionRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedMineral, setSelectedMineral] = useState('Lithium'); // Default mineral
  const [mineralData, setMineralData] = useState(null);
  const [extractionData, setExtractionData] = useState(null);
  const [reserveData, setReserveData] = useState(null);
  const isDragging = useRef(false);

  const pollutionData = {
    'Lithium': {
      'CO2 Emissions': '1.3 to 5 tonnes of CO2',
      'Water Consumption': '500,000 gallons of water per tonne of lithium',
      'Groundwater Contamination': 'Contamination of groundwater and soils'
    },
    'Nickel': {
      'CO2 Emissions': '10 to 30 tonnes of CO2',
      'Heavy Metal Releases': 'Heavy metal and acid releases',
      'Toxic Mine Residues': 'Toxic mine residues'
    },
    'Copper': {
      'CO2 Emissions': '2 to 3 tonnes of CO2',
      'Heavy Metal Waste': 'Heavy metal-containing mine waste',
      'Acid Use': 'Use of acids for leaching'
    },
    'Zinc': {
      'CO2 Emissions': '2.5 to 3 tonnes of CO2',
      'Heavy Metal Waste': 'Heavy metal-containing mine waste',
      'Dust Production': 'Dust production'
    },
    'Alumina': {
      'CO2 Emissions': '10 to 14 tonnes of CO2',
      'Red Mud Residues': 'Red mud residues',
      'Deforestation': 'Deforestation'
    },
    'Silver': {
      'CO2 Emissions': '20 tonnes of CO2',
      'Cyanide Use': 'Use of cyanide',
      'Toxic Mine Waste': 'Toxic mine waste'
    },
    'Lead': {
      'CO2 Emissions': '1.5 to 2 tonnes of CO2',
      'Heavy Metal Waste': 'Heavy metal-containing mine waste',
      'Dust Production': 'Dust production'
    }
  };

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
      plotPollutionChart();
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

    const graphSvg = d3.select(graphRef.current);
    graphSvg.selectAll("*").remove(); // Clear existing graph

    if (!countryExtractionData || !countryReserveData) {
      graphSvg.append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "20px")
        .text("No information");
      return;
    }

    // Filter out data before 2006
    const years = Object.keys(countryExtractionData).slice(2).map(year => +year).filter(year => year >= 2006);
    const extractionValues = years.map(year => +countryExtractionData[year] || 0);
    const reserveValues = years.map(year => +countryReserveData[year] || 0);

    console.log(`Years: ${years}`);
    console.log(`Extraction values: ${extractionValues}`);
    console.log(`Reserve values: ${reserveValues}`);

    const margin = { top: 60, right: 60, bottom: 70, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([0, width]);

    const yExtraction = d3.scaleLinear()
      .domain([0, d3.max(extractionValues)])
      .range([height, 0]);

    const yReserve = d3.scaleLinear()
      .domain([0, d3.max(reserveValues)])
      .range([height, 0]);

    const lineExtraction = d3.line()
      .x((d, i) => x(years[i]))
      .y((d, i) => yExtraction(extractionValues[i]));

    const g = graphSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add the extraction line
    g.append("path")
      .datum(extractionValues)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("d", lineExtraction);

    // Add the reserve bars
    g.selectAll(".bar")
      .data(reserveValues)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => x(years[i]) - 10)
      .attr("y", d => yReserve(d))
      .attr("width", 20)
      .attr("height", d => height - yReserve(d))
      .attr("fill", "red")
      .attr("opacity", 0.5);

    // Add the x-axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add the left y-axis for extraction
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yExtraction));

    // Add the right y-axis for reserves
    g.append("g")
      .attr("class", "y-axis y-axis--reserve")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yReserve));

    // Add the graph title
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`${selectedMineral} Extraction and Reserves in ${country}`);
  };

  const plotPollutionChart = () => {
    const pollutionInfo = pollutionData[selectedMineral];
    const data = Object.keys(pollutionInfo).map(key => ({
      pollution: key,
      description: pollutionInfo[key]
    }));

    const svg = d3.select(pollutionRef.current);
    svg.selectAll("*").remove(); // Clear existing chart

    const width = 500;
    const height = 300;
    const bubbleRadius = 100; // Increased bubble radius

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.pollution))
      .range(d3.schemePastel1);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const bubble = g.selectAll(".bubble")
      .data(data)
      .enter().append("g")
      .attr("class", "bubble")
      .attr("transform", (d, i) => {
        const angle = (i / data.length) * 2 * Math.PI;
        const x = Math.cos(angle) * 150; // Closer bubbles
        const y = Math.sin(angle) * 150; // Closer bubbles
        return `translate(${x},${y})`;
      });

    bubble.append("circle")
      .attr("r", bubbleRadius)
      .attr("fill", d => color(d.pollution))
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    bubble.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .style("font-size", "12px") // Adjusted font size
      .style("font-weight", "bold")
      .text(d => d.pollution)
      .call(wrapText, bubbleRadius * 2); // Wrap text inside the bubble

    bubble.on("mouseover", function(event, d) {
      d3.select(this).select("text").text(d.description);
    }).on("mouseout", function(event, d) {
      d3.select(this).select("text").text(d.pollution);
    });

    // Add the chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`Pollution Metrics for ${selectedMineral}`);
  };

  // Function to wrap text inside a circle
  function wrapText(text, width) {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy"));
      let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", `${dy}em`);
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word);
        }
      }
    });
  }

  return (
    <div className="GlobeContainer">
      <div className="mineral-buttons">
        {['Lithium', 'Nickel', 'Copper', 'Alumina', 'Zinc', 'Silver', 'Lead'].map(mineral => (
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
      {selectedCountry && (
        <div>
          <div className="graph-container" style={{ position: 'absolute', top: '50px', right: '10px', width: '500px', height: '300px' }}>
            <svg ref={graphRef} width="100%" height="100%"></svg>
          </div>
          <div className="pollution-chart" style={{ position: 'absolute', top: '400px', right: '10px', width: '500px', height: '300px' }}>
            <svg ref={pollutionRef} width="100%" height="100%"></svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default Glb;
