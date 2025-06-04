function percentageOfAthletesBySex(data) {
  // Pie chart - broj sportaša po spolu
  const genderCounts = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.Sex
  );
  const genderData = Array.from(genderCounts, ([sex, count]) => ({
    sex,
    count,
  }));

  const pieWidth = 400;
  const pieHeight = 400;
  const radius = Math.min(pieWidth, pieHeight) / 2;

  const pieSvg = d3
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

  const pie = d3.pie().value((d) => d.count);

  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  pieSvg
    .selectAll("path")
    .data(pie(genderData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.sex))
    .attr("stroke", "#fff")
    .style("stroke-width", "2px")
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .text(
          `${d.data.sex === "M" ? "Muški" : "Ženski"}: ${d.data.count} sportaša`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });
  // Dodavanje oznaka (tekstova) unutar segmenata
  const total = d3.sum(genderData, (d) => d.count);

  // Dodavanje oznaka (tekstova) u postotcima
  pieSvg
    .selectAll("text")
    .data(pie(genderData))
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#000")
    .text((d) => {
      const percent = ((d.data.count / total) * 100).toFixed(1);
      return `${d.data.sex === "M" ? "Muški" : "Ženski"}: ${percent}%`;
    });
}

d3.csv("../../data/athlete_events.csv").then((data) => {
  percentageOfAthletesBySex(data);
});

