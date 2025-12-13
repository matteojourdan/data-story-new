const severityColor = {
  "Healthy":      "#2ecc71", // green
  "Asymptomatic": "#a3e635", // lime
  "Mild":         "#ffff00", // yellow
  "Moderate":     "#ff9900", // orange
  "Severe":       "#ff6633", // deep orange
  "Critical":     "#ff0000", // red
  "Death":        "#ffffff", // black

  // fallback / non-covid / unknown
  "Unknown":   "#3b82f6",
  "Non covid": "#3b82f6",
  "Non_covid": "#3b82f6",
  "Nan":       "#3b82f6",
};

// Clinical order for dropdown / legend
const clinicalOrder = [
  "Healthy",
  "Asymptomatic",
  "Mild",
  "Moderate",
  "Severe",
  "Critical",
  "Death",
  "Unknown",
  "Non covid",
  "Non_covid",
  "Nan"
];

// const severityDot = {
//   "Healthy":      "🟢",
//   "Asymptomatic": "🟢",
//   "Mild":         "🟡",
//   "Moderate":     "🟠",
//   "Severe":       "🟠",
//   "Critical":     "🔴",
//   "Death":        "⚪",
//   "Unknown":      "🔵",
//   "Non covid":    "🔵",
//   "Non_covid":    "🔵"
// };

// ---------------------------------------------------------------------------
// LOAD DATA
// ---------------------------------------------------------------------------
d3.json("/assets/data/days_severity.json").then(data => {
  console.log("Loaded:", data.length, "records.");

  const tooltip = d3.select("#tooltip");
  const severitySelect = document.getElementById("severitySelect");

  
  const unwanted = new Set(["Nan", "nan", "NaN", "", null, undefined]);
  let uniqSev = Array.from(new Set(data.map(d => d.severity)))
  .filter(s => !unwanted.has(String(s)));
 // Apply clinical order
  uniqSev = clinicalOrder.filter(s => uniqSev.includes(s));
  // Filter unwanted severities


  // Build dropdown
  severitySelect.innerHTML = "";

  // "All" option
  const optAll = document.createElement("option");
  optAll.value = "All";
  optAll.textContent = "All";
  severitySelect.appendChild(optAll);

  // Severity options with colored text
  uniqSev.forEach(sev => {
    const opt = document.createElement("option");
    opt.value = sev;

    opt.textContent = `${sev}`;   // bullet + label
    severitySelect.appendChild(opt);
  });



  // -------------------------------------------------------------------------
  // SVG setup
  // -------------------------------------------------------------------------
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", 900)
    .attr("height", 500)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Shared scales
  const x = d3.scaleLinear().range([0, width]);
  const xAxis = svg.append("g").attr("transform", `translate(0, ${height})`);
  const yAxis = svg.append("g");

  const kdeLine = svg.append("path")
    .attr("fill", "none")
    .attr("stroke-width", 3);

  // -------------------------------------------------------------------------
  // KDE utilities
  // -------------------------------------------------------------------------
  function kernelGaussian(u) {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  }

  function kernelDensityEstimator(kernel, X) {
    return function(values) {
      return X.map(xVal => [
        xVal,
        d3.mean(values, v => kernel((xVal - v) / bandwidth)) / bandwidth
      ]);
    }
  }

  const bandwidth = 1.5;
  

  function update(severity) {
    let filtered = (severity === "All")
      ? data
      : data.filter(d => d.severity === severity);

    const values = filtered.map(d => d.day);

    if (values.length === 0) {
      console.warn("No data for severity:", severity);
      return;
    }

    // X domain
    x.domain([d3.min(values), d3.max(values)]).nice();

    // Histogram with 15 bins
    const histogram = d3.histogram()
      .value(d => d)
      .domain(x.domain())
      .thresholds(15);

    const bins = histogram(values);

    const yHist = d3.scaleLinear()
      .domain([0, d3.max(bins, b => b.length)])
      .nice()
      .range([height, 0]);

    const barColor = (severity === "All")
      ? "#2f86f6"                       // neutral gray for "All"
      : (severityColor[severity] || "#2f86f6"); // mapped color

    // ---------- Bars with animation ----------
    const bars = svg.selectAll(".bar")
      .data(bins, d => d.x0); // key by bin start

    // ENTER
    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.x0))
      .attr("width", 0)
      .attr("y", height)
      .attr("height", 0)
      .style("fill", barColor)
      .style("opacity", 0.4)
      .transition().duration(500)
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => yHist(d.length))
      .attr("height", d => height - yHist(d.length));

    // UPDATE
    bars.transition().duration(500)
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => yHist(d.length))
      .attr("height", d => height - yHist(d.length))
      .style("fill", barColor)
      .style("opacity", 0.4);

    // EXIT
    bars.exit()
      .transition().duration(400)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    // Tooltip events
    svg.selectAll(".bar")
      .on("mousemove", (event, d) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px")
          .style("opacity", 1)
          .html(`<b>${d.length}</b> samples<br>${d.x0}–${d.x1} days`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    // ---------- KDE ----------
    const kdeX = d3.range(d3.min(values), d3.max(values), 0.1);
    const kde = kernelDensityEstimator(kernelGaussian, kdeX)(values);

    const yKDE = d3.scaleLinear()
      .domain([0, d3.max(kde, d => d[1])])
      .range([height, 0]);

    kdeLine
      .datum(kde)
      .transition().duration(600)
      .attr("stroke", barColor)
      .attr("d", d3.line()
        .curve(d3.curveLinear)
        .x(d => x(d[0]))
        .y(d => yKDE(d[1]))
      );

    // Axes
    xAxis.transition().duration(500).call(d3.axisBottom(x));
    yAxis.transition().duration(500).call(d3.axisLeft(yHist));
  }

  // -------------------------------------------------------------------------
  // INITIAL DRAW + FILTER CHANGE
  // -------------------------------------------------------------------------
  update("All");

  severitySelect.addEventListener("change", () => {
    update(severitySelect.value);
  });

});
