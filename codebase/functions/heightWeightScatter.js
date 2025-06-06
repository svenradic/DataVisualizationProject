function heightWeightScatter(data) {
  const countries = Array.from(new Set(data.map((d) => d.NOC))).sort();
  const dropdown = d3.select("#country-select");

  dropdown
    .selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select("#scatter-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .text("Visina (cm)");

  svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .text("Težina (kg)");

  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  const rScale = d3.scaleSqrt().range([3, 12]);
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxis = svg.append("g");

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px 12px")
    .style("background", "#222")
    .style("color", "#fff")
    .style("border-radius", "6px")
    .style("visibility", "hidden");

  function update(selectedCountries) {
    const combinedData = [];

    selectedCountries.forEach((country) => {
      const filtered = data.filter(
        (d) => d.NOC === country && +d.Height > 0 && +d.Weight > 0
      );
      const grouped = d3
        .rollups(
          filtered,
          (v) => ({
            avgHeight: d3.mean(v, (d) => +d.Height),
            avgWeight: d3.mean(v, (d) => +d.Weight),
            count: v.length,
          }),
          (d) => +d.Year
        )
        .map(([year, vals]) => ({ year, country, ...vals }));

      combinedData.push(...grouped);
    });

    xScale.domain(d3.extent(combinedData, (d) => d.avgWeight)).nice();
    yScale.domain(d3.extent(combinedData, (d) => d.avgHeight)).nice();
    rScale.domain(d3.extent(combinedData, (d) => d.count));
    colorScale.domain(selectedCountries);

    xAxis.transition().call(d3.axisBottom(xScale));
    yAxis.transition().call(d3.axisLeft(yScale));

    const circles = svg
      .selectAll("circle")
      .data(combinedData, (d) => d.country + d.year);

    circles
      .enter()
      .append("circle")
      .attr("stroke", "#333")
      .attr("opacity", 0.8)
      .merge(circles)
      .transition()
      .duration(600)
      .attr("cx", (d) => xScale(d.avgWeight))
      .attr("cy", (d) => yScale(d.avgHeight))
      .attr("r", (d) => rScale(d.count))
      .attr("fill", (d) => colorScale(d.country));

    circles.exit().remove();

    svg
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${d.country}</strong><br>Godina: ${
              d.year
            }<br>Visina: ${d.avgHeight.toFixed(
              1
            )} cm<br>Težina: ${d.avgWeight.toFixed(1)} kg<br>Broj sportaša: ${
              d.count
            }`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 30}px`)
          .style("left", `${event.pageX + 15}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
  }

  dropdown.on("change", function () {
    const selected = Array.from(this.selectedOptions, (o) => o.value);
    update(selected);
  });

  update([countries[0]]);
}

d3.csv("../../data/athlete_events.csv").then((data) => {
  heightWeightScatter(data);
});
