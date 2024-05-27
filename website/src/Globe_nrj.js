import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const graphRef = useRef(null);
  const legendRef = useRef(null);
  const mineralsRef = useRef(null); // New ref for minerals chart
  const [selectedEnergy, setSelectedEnergy] = useState('Wind');
  const [renewableProdData, setRenewableProdData] = useState(null);
  const [evolvProdData, setEvolvProdData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const isDragging = useRef(false);

  const mineralsData = {
    'Wind': {
      'Acier': 49050,
      'Cuivre': 1177,
      'Aluminium': 654,
      'Zinc': 164,
      'Terres rares': 65,
      'Nickel': 98,
      'Manganèse': 33
    },
    'Hydro': {
      'Acier': 45600,
      'Cuivre': 912,
      'Aluminium': 1140,
      'Zinc': 228
    },
    'Solar': {
      'Silicium': 2850,
      'Aluminium': 14250,
      'Cuivre': 2850,
      'Argent': 34.2,
      'Zinc': 1710,
      'Acier': 17100,
      'Nickel': 57
    },
    'Other': {
      'Acier': 8450,
      'Cuivre': 195,
      'Nickel': 6.5,
      'Aluminium': 390,
      'Zinc': 26
    }
  };

  useEffect(() => {
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

    const initializeGlobe = () => {
      const svg = d3.select(globeRef.current);

      const width = 800;
      const height = 800;

      const projection = d3.geoOrthographic()
        .scale(300)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", projection.scale())
        .attr("fill", "#add8e6");

      d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
        const countries = topojson.feature(data, data.objects.countries);
        drawGlobe(countries, projection, path);
      });
    };

    initializeGlobe();
  }, []);

  useEffect(() => {
    d3.csv("data/renewable_prod.csv").then(data => {
      console.log("Loaded renewable production data:", data);
      setRenewableProdData(data);
    });

    d3.csv("data/evolv_prod_renewable.csv").then(data => {
      console.log("Loaded evolution production data:", data);
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

  useEffect(() => {
    if (selectedCountry && evolvProdData) {
      plotGraph(selectedCountry);
      plotDonutChart();
    }
  }, [selectedCountry, evolvProdData, selectedEnergy]);

  const getColor = (country) => {
    if (!renewableProdData) return 'white';
    const countryData = renewableProdData.find(d => d.country === country);
    if (!countryData) return 'white';
    const value = +countryData[selectedEnergy];
    const maxValue = d3.max(renewableProdData, d => +d[selectedEnergy]);
    const colorScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range(["#e5ffe5", "#006400"]);
    console.log(`Country: ${country}, Value: ${value}, Color: ${colorScale(value)}`);
    return colorScale(value);
  };

  const plotGraph = (country) => {
    if (!evolvProdData) return;

    console.log(`Plotting graph for ${country} and energy ${selectedEnergy}`);

    const countryData = evolvProdData.filter(d => d.country === country && d.type === selectedEnergy);
    if (countryData.length === 0) {
      console.log(`No data found for ${country} and energy ${selectedEnergy}`);
      return;
    }

    console.log(`Data found for ${country}:`, countryData);

    const graphSvg = d3.select(graphRef.current);
    graphSvg.selectAll("*").remove(); // Clear existing graph

    const margin = { top: 60, right: 30, bottom: 70, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const years = Object.keys(countryData[0]).slice(2).map(year => +year);
    const values = years.map(year => +countryData[0][year]).filter(value => !isNaN(value));

    console.log(`Years: ${years}`);
    console.log(`Values: ${values}`);

    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(values)])
      .range([height, 0]);

    const line = d3.line()
      .x((d, i) => x(years[i]))
      .y(d => y(d));

    const linePath = line(values);
    console.log(`Line path: ${linePath}`);

    const g = graphSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", "white")
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

  const plotDonutChart = () => {
    const mineralsInfo = mineralsData[selectedEnergy];
    const data = Object.keys(mineralsInfo).map(key => ({
      mineral: key,
      quantity: mineralsInfo[key]
    }));

    const svg = d3.select(mineralsRef.current);
    svg.selectAll("*").remove(); // Clear existing chart

    const width = 500;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.mineral))
      .range(d3.schemeCategory10);

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius - 1);

    const pie = d3.pie()
      .value(d => d.quantity)
      .sort(null);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.mineral));

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .style("font-size", "12px")
      .text(d => d.data.mineral);

    // Add the chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`Main Minerals for ${selectedEnergy} Energy`);
  };

  return (
    <div className="GlobeContainer">
      <div className="energy-buttons">
        {['Wind', 'Hydro', 'Solar', 'Other'].map(energy => (
          <button
            key={energy}
            onClick={() => setSelectedEnergy(energy)}
            style={{ backgroundColor: selectedEnergy === energy ? 'grey' : 'white' }}
          >
            {energy}
          </button>
        ))}
      </div>
      <svg ref={legendRef} width={300} height={30} style={{ marginBottom: '10px' }}></svg>
      <svg ref={globeRef} width={800} height={800}></svg>
      {selectedCountry && (
        <div>
          <svg ref={graphRef} width={500} height={300} style={{ position: 'absolute', top: '50px', right: '10px' }}></svg>
          <svg ref={mineralsRef} width={500} height={300} style={{ position: 'absolute', top: '400px', right: '10px' }}></svg>
        </div>
      )}
    </div>
  );
}

export default Glb;
