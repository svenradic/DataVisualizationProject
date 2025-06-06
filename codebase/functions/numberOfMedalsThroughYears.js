function showSportBreakdown(noc, data) {
  const filtered = data.filter((d) => d.NOC === noc && d.Medal !== "NA");

  const sportCounts = d3
    .rollups(
      filtered,
      (v) => v.length,
      (d) => d.Sport
    )
    .map(([sport, count]) => ({ sport, count }));

  // Sortiraj i uzmi top 15 sportova
  const topSports = sportCounts.sort((a, b) => b.count - a.count).slice(0, 15);

  // Očisti prikaz i stvori novi graf
  d3.select("#chart").html(""); // sakrij stari graf

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 40, right: 20, bottom: 100, left: 100 };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.top + margin.bottom - 10)
    .text("Sport");

  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .text("Broj medalja");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(topSports.map((d) => d.sport))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(topSports, (d) => d.count)])
    .nice()
    .range([height, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  g.append("g").call(d3.axisLeft(y));

  g.selectAll("rect")
    .data(topSports)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.sport))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", "#ff7f0e");

  // Naslov ili "Back" gumb
  svg
    .append("text")
    .attr("x", 20)
    .attr("y", 20)
    .text(`Sportovi za ${noc}`)
    .style("font-size", "18px");

  const tooltip = d3.select("#tooltip");
  svg
    .selectAll("rect")
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .text(`${d.sport}: ${d.count} medalja`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  svg
    .append("text")
    .attr("x", 700)
    .attr("y", 20)
    .text("🔙 Natrag")
    .attr("cursor", "pointer")
    .on("click", () => {
      d3.select("#chart").html("");
      numberOfMedalsThroughYears(data); // funkcija koja vraća prvi prikaz
    });
}

function numberOfMedalsThroughYears(data) {
  const width = 900;
  const height = 600;
  const margin = { top: 40, right: 20, bottom: 100, left: 60 };

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .text("Država (NOC kod)");

  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .text("Broj medalja");
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

  svg.selectAll("rect").on("click", (event, d) => {
    tooltip.style("visibility", "hidden"); // sakrij tooltip
    const selectedNOC = d.noc; // npr. "USA"
    showSportBreakdown(selectedNOC, data);
  });
}

d3.csv("../../data/athlete_events.csv").then((data) => {
  numberOfMedalsThroughYears(data);
});
