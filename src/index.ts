import fs from 'fs';
import { JSDOM } from 'jsdom';
import { Insight } from 'visual-insights';

(async () => {
    const data: any = JSON.parse(fs.readFileSync('./data.json', { encoding: 'utf-8' })).trackPoints;
    const vie = new Insight
        .VIEngine()
        .setDataSource(data)
        .setFieldKeys(Object.keys(data[0]));
    vie
        .buildfieldsSummary()
        .setDimensions(['dateTime'])
        .setMeasures(['speed'])
        .buildGraph()
        .clusterFields()
        .buildCube()
        .buildSubspaces();
    const spaces = await vie.insightExtraction(vie.subSpaces);
    const result = vie.specification(spaces[0]);
    console.log(result);
    const html = new JSDOM(
        `
        <html>
            <head>
                <script src="https://d3js.org/d3.v6.min.js"></script>
            </head>
            <body></body>
            <script>
                const N = 10;
                function movingAverage(values, N) {
                    let i = 0;
                    let sum = 0;
                    const means = new Float64Array(values.length).fill(NaN);
                    for (let n = Math.min(N - 1, values.length); i < n; ++i) {
                    sum += values[i];
                    }
                    for (let n = values.length; i < n; ++i) {
                    sum += values[i];
                    means[i] = sum / N;
                    sum -= values[i - N + 1];
                    }
                    return means
                }
                const height = 500
                const width = 500
                const values = movingAverage(${JSON.stringify(result.dataView)}.map(d => d.speed), N)
                const data = ${JSON.stringify(result.dataView)}.map(d => d.dateTime)
                const margin = ({top: 20, right: 12, bottom: 30, left: 30})
                const x = d3.scaleTime()
                    .domain(d3.extent(data))
                    .range([margin.left, width - margin.right])
                const y = d3.scaleLinear()
                    .domain([0, d3.max(values)]).nice()
                    .rangeRound([height - margin.bottom, margin.top])
                const xAxis = g => g
                    .attr("transform", \`translate(0,\${height - margin.bottom})\`)
                    .call(d3.axisBottom(x).tickSizeOuter(0))
                const yAxis = g => g
                    .attr("transform", \`translate(\${margin.left},0)\`)
                    .call(d3.axisLeft(y))
                    .call(g => g.select(".domain").remove())
                    .call(g => g.selectAll(".tick line").clone()
                        .attr("x2", width)
                        .attr("stroke-opacity", 0.1))
                const area = d3.area()
                    .defined(d => !isNaN(d))
                    .x((d, i) => x(values[i]))
                    .y0(y(0))
                    .y1(y)
                const svg = d3.create("svg")
                .attr("viewBox", [0, 0, width, height]);
                svg.append("g")
                    .call(xAxis);
                svg.append("g")
                    .call(yAxis);
                svg.append("path")
                    .attr("fill", "steelblue")
                    .attr("d", area(values));
                document.body.append(svg.node())
            </script>
        </html>`,
    );
    const renderHtml = html.window.document.documentElement.outerHTML;
    fs.writeFile('result.html', renderHtml, (err) => {
        if (err) {
            console.error(err);
        }
    });
})();
