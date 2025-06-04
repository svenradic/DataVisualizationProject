function worldMap(data) {
  const mapWidth = 1000;
  const mapHeight = 600;

  d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 12px")
    .style("border-radius", "4px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
    .style("z-index", "100");

  // SVG za mapu
  const mapSvg = d3
    .select("#map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

  // Projekcija i path
  const projection = d3
    .geoNaturalEarth1()
    .scale(160)
    .translate([mapWidth / 2, mapHeight / 2]);

  const path = d3.geoPath().projection(projection);

  // Priprema medalja po NOC-u
  const medalCounts = d3.rollup(
    data.filter((d) => d.Medal !== "NA"),
    (v) => v.length,
    (d) => d.NOC
  );

  // Učitaj GeoJSON
  d3.json("../../data/world.geojson").then((worldData) => {
    // Pridruži medalje državama
    worldData.features.forEach((feature) => {
      const countryCode = feature.id; // 3-znamenkasti ISO kod
      feature.properties.medals = medalCounts.get(countryCode) || 0;
    });

    // Bojanje po broju medalja
    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(worldData.features, (d) => d.properties.medals)])
      .interpolator(d3.interpolateBlues);

    // Tooltip
    const tooltip = d3.select("#tooltip");

    mapSvg
      .selectAll("path")
      .data(worldData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d) =>
        d.properties.medals ? colorScale(d.properties.medals) : "#eee"
      )
      .attr("stroke", "#999")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .text(`${d.properties.name}: ${d.properties.medals} medalja`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });
  });
}

d3.csv("../../data/athlete_events.csv").then((data) => {
  worldMap(data);
});
