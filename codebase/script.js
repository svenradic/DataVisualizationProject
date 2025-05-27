const width = 1000;
const height = 600;
const margin = { top: 40, right: 20, bottom: 100, left: 60 };

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

d3.csv("../data/athlete_events.csv").then((data) => {
  // filtriramo samo redove koji imaju dodijeljenu medalju
  const medalWinners = data.filter((d) => d.Medal !== "NA");

  // grupiramo po državi (NOC kod)
  const medalCount = d3.rollup(
    medalWinners,
    (v) => v.length,
    (d) => d.NOC
  );

  const sortedData = Array.from(medalCount, ([noc, count]) => ({ noc, count }))
    .sort((a, b) => d3.descending(a.count, b.count))
    .slice(0, 20); // prikaz 20 najuspješnijih zemalja

  const x = d3
    .scaleBand()
    .domain(sortedData.map((d) => d.noc))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.count)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // os x
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // os y
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // barovi
  svg
    .selectAll("rect")
    .data(sortedData)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.noc))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.count))
    .attr("fill", "#1f77b4");

  // tooltip (osnovni)
  svg
    .selectAll("rect")
    .append("title")
    .text((d) => `${d.noc}: ${d.count} medalja`);

  const tooltip = d3.select("#tooltip");
  svg
    .selectAll("rect")
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .text(`${d.noc}: ${d.count} medalja`);
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
