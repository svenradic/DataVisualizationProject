function updateLegend(selectedCountries) {
  // Makni postojeću legendu
  d3.select("#legend").html("");

  const legendSvg = d3
    .select("#legend")
    .append("svg")
    .attr("width", 300)
    .attr("height", selectedCountries.length * 25);

  const legend = legendSvg
    .selectAll(".legend-item")
    .data(selectedCountries)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`);

  legend
    .append("rect")
    .attr("x", 10)
    .attr("y", 5)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

  legend
    .append("text")
    .attr("x", 35)
    .attr("y", 18)
    .attr("font-size", "14px")
    .text((d) => d);
}

function lineChartAnimation(data) {
  // Dohvati sve dostupne države s medaljama
  const allCountries = Array.from(
    new Set(data.filter((d) => d.Medal !== "NA").map((d) => d.NOC))
  ).sort();

  // Napuni dropdown
  const dropdown = d3.select("#country-select");
  dropdown
    .selectAll("option")
    .data(allCountries)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  // SVG setup (samo jednom)
  const lcMargin = { top: 30, right: 20, bottom: 50, left: 60 };
  const lcWidth = 800 - lcMargin.left - lcMargin.right;
  const lcHeight = 400 - lcMargin.top - lcMargin.bottom;

  const lcSvg = d3
    .select("#linechart")
    .append("svg")
    .attr("width", lcWidth + lcMargin.left + lcMargin.right)
    .attr("height", lcHeight + lcMargin.top + lcMargin.bottom)
    .append("g")
    .attr("transform", `translate(${lcMargin.left},${lcMargin.top})`);

  lcSvg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -lcHeight / 2)
    .attr("y", -lcMargin.left + 15)
    .text("Broj medalja");

  lcSvg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", lcWidth / 2)
    .attr("y", lcHeight + lcMargin.bottom - 10)
    .text("Godina");

  const xScale = d3.scaleLinear().range([0, lcWidth]);
  const yScale = d3.scaleLinear().range([lcHeight, 0]);

  const xAxisGroup = lcSvg
    .append("g")
    .attr("transform", `translate(0, ${lcHeight})`);
  const yAxisGroup = lcSvg.append("g");

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.count));

  let interval;
  let playing = false;

  function updateLineChart(selectedCountries) {
    // Mapiraj svaku zemlju na njen niz (year, count)
    const allSeries = selectedCountries.map((country) => {
      const series = Array.from(
        d3.rollup(
          data.filter((d) => d.Medal !== "NA" && d.NOC === country),
          (v) => v.length,
          (d) => +d.Year
        ),
        ([year, count]) => ({ year, count, country })
      ).sort((a, b) => a.year - b.year);
      return { country, values: series };
    });

    const allYears = allSeries.flatMap((s) => s.values.map((d) => d.year));
    const allCounts = allSeries.flatMap((s) => s.values.map((d) => d.count));

    xScale.domain(d3.extent(allYears));
    yScale.domain([0, d3.max(allCounts)]).nice();

    xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    yAxisGroup.call(d3.axisLeft(yScale));

    // Stop old animation if exists
    clearInterval(interval);

    // ENTER / UPDATE / EXIT za linije
    const lines = lcSvg.selectAll(".line").data(allSeries, (d) => d.country);

    const linesEnter = lines
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
      .attr("stroke-width", 2);

    const mergedLines = linesEnter.merge(lines);

    lines.exit().remove();

    if (playing) {
      let i = 1;
      const maxLen = d3.max(allSeries.map((s) => s.values.length));
      interval = setInterval(() => {
        mergedLines.attr("d", (d) => line(d.values.slice(0, i)));
        i++;
        if (i > maxLen) {
          clearInterval(interval);
          playing = false;
          d3.select("#play-btn").text("▶ Start");
        }
      }, 300);
    } else {
      mergedLines.attr("d", (d) => line(d.values));
    }
    updateLegend(selectedCountries);
  }

  // Play button handler
  d3.select("#play-btn").on("click", () => {
    playing = !playing;
    d3.select("#play-btn").text(playing ? "⏸ Stop" : "▶ Start");
    const selected = Array.from(
      document.getElementById("country-select").selectedOptions
    ).map((opt) => opt.value);
    updateLineChart(selected);
  });

  // Update when user selects new country
  dropdown.on("change", () => {
    playing = false;
    d3.select("#play-btn").text("▶ Start");
    const selected = Array.from(
      dropdown.property("selectedOptions"),
      (o) => o.value
    );
    updateLineChart(selected);
  });

  // Pokreni početni graf (prva država u listi)
  updateLineChart([allCountries[0]]);
}

d3.csv("../../data/athlete_events.csv").then((data) => {
  lineChartAnimation(data);
});
