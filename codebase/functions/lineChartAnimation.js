function lineChartAnimation(data){
// Dohvati sve dostupne države s medaljama
const allCountries = Array.from(
  new Set(data.filter(d => d.Medal !== "NA").map(d => d.NOC))
).sort();

// Napuni dropdown
const dropdown = d3.select("#country-select");
dropdown.selectAll("option")
  .data(allCountries)
  .enter()
  .append("option")
  .attr("value", d => d)
  .text(d => d);

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

const xScale = d3.scaleLinear().range([0, lcWidth]);
const yScale = d3.scaleLinear().range([lcHeight, 0]);

const xAxisGroup = lcSvg.append("g").attr("transform", `translate(0, ${lcHeight})`);
const yAxisGroup = lcSvg.append("g");

const line = d3.line()
  .x(d => xScale(d.year))
  .y(d => yScale(d.count));

const linePath = lcSvg.append("path")
  .attr("fill", "none")
  .attr("stroke", "#1f77b4")
  .attr("stroke-width", 2);

let interval;
let playing = false;

function updateLineChart(selectedCountry) {
  const medalDataByYear = Array.from(
    d3.rollup(
      data.filter(d => d.Medal !== "NA" && d.NOC === selectedCountry),
      v => v.length,
      d => +d.Year
    ),
    ([year, count]) => ({ year, count })
  ).sort((a, b) => a.year - b.year);

  xScale.domain(d3.extent(medalDataByYear, d => d.year));
  yScale.domain([0, d3.max(medalDataByYear, d => d.count)]).nice();

  xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  yAxisGroup.call(d3.axisLeft(yScale));

  let i = 1;
  clearInterval(interval);

  if (playing) {
    interval = setInterval(() => {
      linePath.datum(medalDataByYear.slice(0, i)).attr("d", line);
      i++;
      if (i > medalDataByYear.length) {
        clearInterval(interval);
        playing = false;
        d3.select("#play-btn").text("▶ Start");
      }
    }, 300);
  } else {
    linePath.datum(medalDataByYear).attr("d", line);
  }
}

// Play button handler
d3.select("#play-btn").on("click", () => {
  playing = !playing;
  d3.select("#play-btn").text(playing ? "⏸ Stop" : "▶ Start");
  updateLineChart(dropdown.property("value"));
});

// Update when user selects new country
dropdown.on("change", () => {
  playing = false;
  d3.select("#play-btn").text("▶ Start");
  updateLineChart(dropdown.property("value"));
});

// Pokreni početni graf (prva država u listi)
updateLineChart(allCountries[0]);

}

d3.csv("../../data/athlete_events.csv").then((data) => {
  lineChartAnimation(data);
});
