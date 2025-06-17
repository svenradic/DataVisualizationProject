function percentageOfAthletesBySex(data) {
  const allCountries = Array.from(new Set(data.map(d => d.NOC))).sort();

  // Napuni dropdown
  const dropdown = d3.select("#country-select");
  dropdown
    .selectAll("option")
    .data(allCountries)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const pieWidth = 400;
  const pieHeight = 400;
  const radius = Math.min(pieWidth, pieHeight) / 2;

  const svg = d3
    .select("#gender-chart")
    .append("svg")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .append("g")
    .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

  const color = d3
    .scaleOrdinal()
    .domain(["M", "F"])
    .range(["#1f77b4", "#ff7f0e"]);

  const pie = d3.pie().value(d => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("border-radius", "6px")
    .style("visibility", "hidden");

  function updateChart(country) {
    const filtered = data.filter(d => d.NOC === country);

    const genderCounts = d3.rollup(
      filtered,
      v => v.length,
      d => d.Sex
    );

    const genderData = Array.from(genderCounts, ([sex, count]) => ({
      sex,
      count,
    }));

    const arcs = svg.selectAll("path").data(pie(genderData), d => d.data.sex);

    arcs
      .enter()
      .append("path")
      .merge(arcs)
      .transition()
      .duration(500)
      .attr("d", arc)
      .attr("fill", d => color(d.data.sex))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px");

    arcs.exit().remove();

    svg.selectAll("text").remove(); // očisti prethodne tekstove

    const total = d3.sum(genderData, d => d.count);
    svg
      .selectAll("text")
      .data(pie(genderData))
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#000")
      .text(d => {
        const percent = ((d.data.count / total) * 100).toFixed(1);
        return `${d.data.sex === "M" ? "Muški" : "Ženski"}: ${percent}%`;
      });

    svg.selectAll("path")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .text(
            `${d.data.sex === "M" ? "Muški" : "Ženski"}: ${d.data.count} sportaša`
          );
      })
      .on("mousemove", event => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });
  }

  dropdown.on("change", function () {
    const selected = d3.select(this).property("value");
    updateChart(selected);
  });

  // Prikaži prvi put s početnom državom
  updateChart(allCountries[0]);
}

d3.csv("../../data/athlete_events.csv").then(data => {
  percentageOfAthletesBySex(data);
});
