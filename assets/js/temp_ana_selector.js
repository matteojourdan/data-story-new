document.getElementById('tempAnaSelect').addEventListener('change', function() {
    const graphs = document.querySelectorAll('.temp-ana-graph');

    graphs.forEach(graph => {
        graph.classList.remove('active');
    });

    const selectedGraph = document.getElementById('tempAnaGraph' + this.value.replace('graph', ''));
    if (selectedGraph) {
        selectedGraph.classList.add('active');
    }
});
