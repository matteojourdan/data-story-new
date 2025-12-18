document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('raw-log-chart');
    if (!container) return;

    // Create toggle switch
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-container';
    toggleContainer.innerHTML = `
        <span class="toggle-label">Raw</span>
        <label class="toggle-switch">
            <input type="checkbox" id="dataToggle">
            <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Log</span>
    `;
    container.appendChild(toggleContainer);

    // Create chart container
    const chartDiv = document.createElement('div');
    chartDiv.id = 'raw-log-histogram';
    container.appendChild(chartDiv);

    let patientIds = [];
    let patientNames = []; // Patient IDs without cell type
    let cellType = '';
    let rawData = [];
    let logData = [];

    fetch("assets/data/patient_expression_summary.json")
        .then(r => r.json())
        .then(data => {
            patientIds = data.patient_ids;
            rawData = data.total_raw;
            logData = data.total_log;

            // Extract patient names and cell type
            patientNames = patientIds.map(id => id.split('||')[0]);
            cellType = patientIds[0]?.split('||')[1] || '';

            renderBarChart(rawData, `Raw Expression Counts (${cellType})`);
        });

    function renderBarChart(values, title) {
        const width = 600;
        const height = 300;
        const margin = { top: 30, right: 20, bottom: 40, left: 60 };

        // Clear previous chart
        d3.select('#raw-log-histogram').html('');

        const svg = d3.select('#raw-log-histogram')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create tooltip
        let tooltip = d3.select('#raw-log-chart .chart-tooltip');
        if (tooltip.empty()) {
            tooltip = d3.select('#raw-log-chart')
                .append('div')
                .attr('class', 'chart-tooltip');
        }

        const x = d3.scaleBand()
            .domain(patientIds)
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(values) * 1.1])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Bars with hover
        svg.selectAll('rect')
            .data(values)
            .join('rect')
            .attr('x', (d, i) => x(patientIds[i]))
            .attr('width', x.bandwidth())
            .attr('y', d => y(d))
            .attr('height', d => y(0) - y(d))
            .attr('fill', 'var(--accent)')
            .on('mouseover', function(event, d) {
                const i = values.indexOf(d);
                d3.select(this).attr('fill', '#fff');
                tooltip
                    .style('opacity', 1)
                    .html(`<strong>${patientNames[i]}</strong><br/>Value: ${d.toFixed(2)}`);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('fill', 'var(--accent)');
                tooltip.style('opacity', 0);
            });

        // X axis without labels
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(0).tickFormat(''))
            .attr('color', 'var(--text-light)');

        // Y axis
        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .attr('color', 'var(--text-light)');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--text-light)')
            .attr('font-size', '14px')
            .text(title);
    }

    // Toggle event
    document.getElementById('dataToggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            renderBarChart(logData, `Log1p of CPM (${cellType})`);
        } else {
            renderBarChart(rawData, `Raw Expression Counts (${cellType})`);
        }
    });
});
