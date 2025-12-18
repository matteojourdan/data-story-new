let rawData = [];
let genes = [];

// Numeric mapping for regression
const binIndex = { "0–6": 0, "7–10": 1, "11–14": 2, "15–21": 3, "22+": 4 };
const binOrder = ["0–6", "7–10", "11–14", "15–21", "22+"];

fetch("/assets/data/adata_summary.json")
  .then(r => r.json())
  .then(data => {
    rawData = data;

    // Get unique gene names from the pre-aggregated data
    genes = [...new Set(data.map(d => d.gene))];

    fillDropdown();
    updatePlot(genes[0]);
  });

function fillDropdown() {
  const dd = document.getElementById("geneDropdown");
  dd.innerHTML = "";
  genes.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    dd.appendChild(opt);
  });

  dd.addEventListener("change", () => updatePlot(dd.value));
  document.getElementById("showOutlierToggle")
    .addEventListener("change", () => updatePlot(dd.value));

  document.querySelectorAll("input[name='lineMode']").forEach(r =>
    r.addEventListener("change", () => updatePlot(dd.value))
  );
}

// ---------------------------------------------------------------
// Get pre-aggregated data for a specific gene
// ---------------------------------------------------------------
function computeGeneSummary(gene) {
  const showOutlier = document.getElementById("showOutlierToggle").checked;

  let filtered = rawData.filter(d => d.gene === gene);

  if (!showOutlier) {
    filtered = filtered.filter(d =>
      !(d.severityGroup === "Moderate" && d.time_bin === "22+")
    );
  }

  return filtered.map(d => ({
    severityGroup: d.severityGroup,
    bin: d.time_bin,
    mean: d.mean,
    bin_num: binIndex[d.time_bin]
  }));
}

function updatePlot(gene) {
  const values = computeGeneSummary(gene);
  const mode = document.querySelector("input[name='lineMode']:checked").value;

  const layers = [];

  // Mean line
  if (mode === "mean" || mode === "both") {
    layers.push({
      mark: { type: "line", point: { size: 60 } },
      encoding: {
        x: { field: "bin", type: "ordinal", sort: binOrder, title: "Time Bin" },
        y: { field: "mean", type: "quantitative", title: "Mean Expression" },
        color: { field: "severityGroup", type: "nominal", title: "Severity", scale: { scheme: "set2" }},
        tooltip: [
          { field: "severityGroup", title: "Severity" },
          { field: "bin", title: "Time Bin" },
          { field: "mean", format: ".3f", title: "Mean Exp." }
        ]
      }
    });
  }

  // Regression line
  if (mode === "regression" || mode === "both") {
    layers.push({
      transform: [
        { regression: "mean", on: "bin_num", groupby: ["severityGroup"] }
      ],
      mark: { type: "line", strokeDash: [6, 4], strokeWidth: 2 },
      encoding: {
        x: { field: "bin_num", type: "quantitative", axis: { labels: false, ticks: false }},
        y: { field: "mean", type: "quantitative" },
        color: { field: "severityGroup", type: "nominal", scale: { scheme: "set2" }}
      }
    });
  }

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 300,
    height: 150,
    title: `Expression of ${gene} by Severity Group`,
    data: { values },
    layer: layers
  };

  vegaEmbed("#vis", spec, { actions: false });
}