import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Glb() {
  const globeRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);
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

    // Chargement des données du monde
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      const countries = topojson.feature(data, data.objects.countries);

      // Load temperature data
      d3.csv("data/temperature_data.csv")
        .then(temperatureData => {
          console.log("Loaded temperature data:", temperatureData);
          setTemperatureData(temperatureData);

          // Extract years from column headers
          const years = temperatureData.columns.slice(1);
          console.log("Years extracted:", years);
        })
        .catch(error => {
          console.error("Error loading temperature data:", error);
        });

      // Dessiner les pays
      svg.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "white")  // Couleur initiale du pays
        .attr("id", d => `country-${d.id}`) // Ajouter un ID unique à chaque pays
        .on("mousedown", function(event, d) {
          isDragging.current = true;
          setSelectedCountry(d);
          svg.selectAll(".country").attr("fill", country => (country === d ? "#ffcc00" : "white"));
          globeRef.current.classList.add('shifted');
          if (temperatureData) {
            const countryData = temperatureData.find(data => data.year === selectedYear);
            if (countryData && countryData.values) {
                const countryValues = countryData.values.find(val => val.country === d.properties.name);
                if (countryValues) {
                    const averageTemperature = d3.mean(countryValues.map(val => val.temperature));
                    console.log(`Average Temperature for ${d.properties.name}: ${averageTemperature}`);
                } else {
                    console.log(`No temperature data available for ${d.properties.name}`);
                }
            } else {
                console.log(`No temperature data available for the selected year ${selectedYear}`);
            }
          } else {
              console.log("Temperature data is not available");
          }
        });

      svg.on("mousemove", function(event) {
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
    });

  }, [selectedYear]); // Ajoute isDragging en tant que dépendance pour que useEffect soit déclenché lorsqu'il change

  // Update country colors based on temperature data
  useEffect(() => {
    if (temperatureData) {
      console.log("Temperature data:", temperatureData);

      const yearData = temperatureData.find(d => d.year === selectedYear);
      console.log("Year data:", yearData);

      if (yearData && Array.isArray(yearData.values)) {
        const temperatures = yearData.values.map(val => val.temperature).filter(val => val !== null);
        console.log("Temperatures:", temperatures);

        if (temperatures.length > 0) {
          const temperatureScale = d3.scaleSequential(d3.interpolateRdBu)
            .domain(d3.extent(temperatures));
          console.log("Temperature scale domain:", temperatureScale.domain());
          console.log("Temperature scale range:", temperatureScale.range());

          d3.selectAll(".country")
            .attr("fill", d => {
              const countryData = yearData.values.find(val => val.country === d.properties.name);
              console.log("Country data:", countryData);
              return countryData ? temperatureScale(countryData.temperature) : "white";
            });
        } else {
          // No temperature data available for the selected year
          d3.selectAll(".country")
            .attr("fill", "white");
        }
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
          min="1950" 
          max="2013" 
          value={selectedYear} 
          onChange={e => setSelectedYear(+e.target.value)} // Convert value to number
        />
        <span>{selectedYear}</span>
      </div>
      {selectedCountry && (
        <div className="popup">
          <img src="img/G2.png" alt={selectedCountry.properties.name} style={{ width: '350px' }}/>
          <img src="img/G1.png" alt={selectedCountry.properties.name} style={{ width: '350px' }}/>
          <p>{selectedCountry.properties.name}</p>
        </div>
      )}
    </div>
  );
}

export default Glb;