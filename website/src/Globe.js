import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './styles.css';

function Globe() {
  const globeRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // Pour suivre l'état de la souris
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 }); // Position de départ lors du déplacement
  const [rotationSpeed, setRotationSpeed] = useState(0.5); // Vitesse de rotation du globe

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
          setIsDragging(true);
          setStartPosition({ x: event.clientX, y: event.clientY });
          setSelectedCountry(d);
          svg.selectAll(".country").attr("fill", country => (country === d ? "#ffcc00" : "white"));
          globeRef.current.classList.add('shifted');
        })
        .attr("id", d => `country-${d.id}`); // Ajouter un ID unique à chaque pays

      svg.on("mousemove", function(event) {
        if (isDragging) {
          const dx = event.clientX - startPosition.x;
          const dy = event.clientY - startPosition.y;
          const rotate = projection.rotate();

          rotate[0] += dx * rotationSpeed;
          rotate[1] -= dy * rotationSpeed;

          projection.rotate(rotate);
          svg.selectAll("path").attr("d", path);
          setStartPosition({ x: event.clientX, y: event.clientY });
        }
      });

      svg.on("mouseup", () => {
        setIsDragging(false);
        globeRef.current.classList.remove('shifted');
      });

    });

  }, [isDragging, rotationSpeed, startPosition]); // Ajoute isDragging en tant que dépendance pour que useEffect soit déclenché lorsqu'il change

  return (
    <div className="GlobeContainer">
      <svg ref={globeRef} width={600} height={600}></svg>
      {selectedCountry && (
        <div className="popup">
          <img src="img/G2.png" alt={selectedCountry.properties.name} style={{ width: '350px' }}/>
          <img src="img/G1.png" alt={selectedCountry.properties.name} style={{ width: '350px' }}/>
          <p>{selectedCountry.properties.name}</p>
        </div>
      )}
      <input 
        type="range" 
        min="0.1" 
        max="1" 
        step="0.01" 
        value={rotationSpeed} 
        onChange={(e) => setRotationSpeed(parseFloat(e.target.value))} 
      />
    </div>
  );
}

export default Globe;