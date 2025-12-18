let rawData = [];
let genes = [];

// Numeric mapping for regression
const binIndex = { "0–6": 0, "7–10": 1, "11–14": 2, "15–21": 3, "22+": 4 };
const binOrder = ["0–6", "7–10", "11–14", "15–21", "22+"];

function mapSeverity(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();

  if (s.includes("mild") || s.includes("asymp")) return "Mild-Asym.";
  if (s.includes("moderate")) return "Moderate";
  if (s.includes("severe") || s.includes("crit")) return "Severe-Crit.";
  return null;
}

fetch("/assets/data/adata_subset.json")
  .then(r => r.json())
  .then(data => {

    data.forEach(d => { d.severityGroup = mapSeverity(d.Severity); });

    let filtered = data.filter(d =>
      d.severityGroup !== null &&
      d.time_bin !== null &&
      d.Days_from_onset !== null
    );


    rawData = filtered;

    const skip = new Set(["Severity", "severityGroup", "Days_from_onset", "time_bin"]);
    genes = Object.keys(rawData[0]).filter(k => !skip.has(k));

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
// 4. Compute binned mean expression
// ---------------------------------------------------------------
function computeGeneSummary(gene) {
  const showOutlier = document.getElementById("showOutlierToggle").checked;

  let clean = rawData.filter(d => d[gene] !== null && !isNaN(d[gene]));

  if (!showOutlier) {
    clean = clean.filter(d =>
      !(d.severityGroup === "Moderate" && d.time_bin === "22+")
    );
  }

  const grouped = d3.group(clean, d => d.severityGroup, d => d.time_bin);

  const out = [];
  for (const [sev, byBin] of grouped) {
    for (const [bin, rows] of byBin) {
      const mean = d3.mean(rows, d => +d[gene]);
      if (!isNaN(mean)) {
        out.push({
          severityGroup: sev,
          bin,
          mean,
          bin_num: binIndex[bin]
        });
      }
    }
  }
  return out;
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
