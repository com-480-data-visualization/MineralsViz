import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Globe() {
  const globeRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const svg = d3.select(globeRef.current);

    const width = 600;
    const height = 600;

    // Projection du globe
    const projection = d3.geoOrthographic()
      .scale(190)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Chargement des données du monde
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json").then(data => {
      const countries = topojson.feature(data, data.objects.countries);

      // Dessiner les pays
      svg.selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "white")  // Couleur initiale du pays
        .on("mousedown", function(event, d) {
          isDragging.current = true;
          setSelectedCountry(d);
          svg.selectAll(".country").attr("fill", country => (country === d ? "#ffcc00" : "white"));
          globeRef.current.classList.add('shifted');
        })
        .attr("id", d => `country-${d.id}`); // Ajouter un ID unique à chaque pays

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

    });

  }, []);

  return (
    <div className="Globe">
      <svg ref={globeRef} width={600} height={600}></svg>
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

export default Globe;