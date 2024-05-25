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
  const [selectedYear, setSelectedYear] = useState(1971); // Default year
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
          svg.selectAll(".country").attr("stroke", null); // Remove previous border
          d3.select(this).attr("stroke", "black"); // Highlight selected country
          globeRef.current.classList.add('shifted');
          if (temperatureData) {
            const yearData = temperatureData.find(data => data[selectedYear.toString()]);
            if (yearData && yearData[d.properties.name]) {
              console.log(`Average Temperature for ${d.properties.name}: ${yearData[d.properties.name]}`);
              addTemperatureLabel(d.properties.name, yearData[d.properties.name], path.centroid(d));
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

  const addTemperatureLabel = (countryName, temperature, position) => {
    const svg = d3.select(globeRef.current);
    svg.selectAll(`.temp-label-${countryName}`).remove(); // Remove existing labels

    svg.append("text")
      .attr("class", `temp-label temp-label-${countryName}`)
      .attr("x", position[0])
      .attr("y", position[1])
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text(`${temperature.toFixed(2)}°C`);
  };

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
    const prodMargin = { top: 60, right: 30, bottom: 70, left: 50 };
    const prodWidth = 500 - prodMargin.left - prodMargin.right;
    const prodHeight = 300 - prodMargin.top - prodMargin.bottom;

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
      .call(d3.axisBottom(prodX))
      .selectAll("text")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("text-anchor", "end");

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

    prodSvg.append("text")
      .attr("x", prodWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`Energy Production in ${country}`);

    // Consumption chart
    const consoMargin = { top: 60, right: 30, bottom: 70, left: 50 };
    const consoWidth = 500 - consoMargin.left - consoMargin.right;
    const consoHeight = 300 - consoMargin.top - consoMargin.bottom;

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
      .call(d3.axisBottom(consoX))
      .selectAll("text")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .style("text-anchor", "end");

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
      .attr("fill", "#ff8c00");

    consoSvg.append("text")
      .attr("x", consoWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("text-decoration", "underline")
      .attr("fill", "white")
      .text(`Energy Consumption in ${country}`);
  };

  // Update country colors based on temperature data
  useEffect(() => {
    if (temperatureData) {
      console.log("Temperature data:", temperatureData);

      temperatureData.forEach(d => {
        d[selectedYear] = +d[selectedYear];
      });

      const yearData = temperatureData.find(data => data[selectedYear.toString()]);
      console.log("Year data:", yearData);

      if (yearData) {
        const temperatures = temperatureData.map(d => d[selectedYear]).filter(val => val !== null);
        console.log("Temperatures:", temperatures);

        if (temperatures.length > 0) {
          const temperatureScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain(d3.extent(temperatures).reverse());
          console.log("Temperature scale domain:", temperatureScale.domain());
          console.log("Temperature scale range:", temperatureScale.range());

          d3.selectAll(".country")
            .attr("fill", d => {
              const countryData = temperatureData.find(val => val.country === d.properties.name);
              return countryData ? temperatureScale(countryData[selectedYear]) : "white";
            });
        } else {
          // No temperature data available for the selected year
          d3.selectAll(".country")
            .attr("fill", "white");
        }
      }

      if (selectedCountry) {
        plotBarCharts(selectedCountry.properties.name);
      }
    }
  }, [temperatureData, selectedYear]);

  return (
    <div className="GlobeContainer">
      <svg ref={globeRef} width={800} height={800}></svg>
      <div className="yearSlider" style={{ marginTop: '20px' }}>
        <label htmlFor="year">Select Year:</label>
        <input 
          type="range" 
          id="year" 
          name="year" 
          min="1971" 
          max="2013" 
          value={selectedYear} 
          onChange={e => setSelectedYear(+e.target.value)} // Convert value to number
        />
        <span>{selectedYear}</span>
      </div>
      <div ref={productionChartRef} style={{ position: 'absolute', top: '10px', right: '10px' }}></div>
      <div ref={consumptionChartRef} style={{ position: 'absolute', top: '360px', right: '10px' }}></div>
    </div>
  );
}

export default Glb;