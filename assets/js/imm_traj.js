---
---

(function() {
  let rawData = [];
  let cellTypes = [];

  const binOrder = ["0–6", "7–10", "11–14", "15–21", "22+"];
  const sevOrder = ["Mild-Asym.", "Moderate", "Severe-Crit."];

  d3.csv("{{ '/assets/data/ct_scores_with_bins.csv' | relative_url }}").then(data => {
    rawData = data;

    // Get cell type columns (all columns except patient_id, day_bin, sev_bin)
    const excludeCols = ["patient_id", "day_bin", "sev_bin"];
    cellTypes = Object.keys(data[0]).filter(col => !excludeCols.includes(col));

    fillDropdown();
    updatePlot(cellTypes[0]);
  }).catch(err => {
    console.error("Failed to load CSV:", err);
  });

  function fillDropdown() {
    const dd = document.getElementById("imm-traj-dropdown");
    dd.innerHTML = "";

    cellTypes.forEach(ct => {
      const opt = document.createElement("option");
      opt.value = ct;
      opt.textContent = ct;
      dd.appendChild(opt);
    });

    dd.addEventListener("change", () => updatePlot(dd.value));
  }

  function updatePlot(cellType) {
    // Aggregate: compute mean score per (day_bin, sev_bin)
    const grouped = d3.rollup(
      rawData.filter(d => d.day_bin && d.sev_bin), // Filter out rows with missing bins
      v => d3.mean(v, d => +d[cellType]),
      d => d.day_bin,
      d => d.sev_bin
    );

    // Flatten to array for Vega-Lite
    const values = [];
    grouped.forEach((sevMap, dayBin) => {
      sevMap.forEach((score, sevBin) => {
        values.push({
          day_bin: dayBin,
          sev_bin: sevBin,
          score: score
        });
      });
    });

    const spec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      width: 320,
      height: 200,
      background: "transparent",
      title: {
        text: `Immune trajectory: ${cellType}`,
        color: "#ffffff"
      },
      config: {
        axis: {
          labelColor: "#ffffff",
          titleColor: "#ffffff",
          gridColor: "transparent",
          domainColor: "#595959",
          tickColor: "#595959"
        },
        legend: {
          labelColor: "#ffffff",
          titleColor: "#ffffff"
        },
        view: {
          stroke: "transparent"
        }
      },
      data: { values },
      mark: {
        type: "line",
        point: true
      },
      encoding: {
        x: {
          field: "day_bin",
          type: "ordinal",
          sort: binOrder,
          title: "Days from onset"
        },
        y: {
          field: "score",
          type: "quantitative",
          title: "Normalized immune score"
        },
        color: {
          field: "sev_bin",
          type: "nominal",
          sort: sevOrder,
          title: "Severity",
          scale: { 
            scheme: "set2",
            domain: sevOrder
          },
          legend: {
            orient: "right",
            title: "Severity"
          }
        },
        tooltip: [
          { field: "sev_bin", title: "Severity" },
          { field: "day_bin", title: "Days from onset" },
          { field: "score", title: "Score", format: ".2f" }
        ]
      }
    };

    vegaEmbed("#imm-traj-vis", spec, { actions: false });
  }
})();
