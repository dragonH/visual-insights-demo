import fs from 'fs';
import { JSDOM } from 'jsdom';
import { Insight } from 'visual-insights';

(async () => {
    const data: any = JSON.parse(fs.readFileSync('./data.json', { encoding: 'utf-8' })).trackPoints;
    const vie = new Insight
        .VIEngine()
        .setDataSource(data)
        .setFieldKeys(Object.keys(data[0]))
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
    const html = new JSDOM(
        `
        <html>
            <head>
                <script src="https://d3js.org/d3.v6.min.js"></script>
            </head>
            <body></body>
            <script>
                const div = d3.create("div")
                .style("font", "10px sans-serif")
                .style("text-align", "right")
                .style("color", "white");
                div.selectAll("div")
                // .data([4, 8, 15, 16, 23, 42])
                .data(${JSON.stringify(result.dataView)})
                .join("div")
                .style("background", "steelblue")
                .style("padding", "3px")
                .style("margin", "1px")
                .style("width", d => \`$\{d.speed * 10}px\`)
                .text(d => d.speed);
                console.log(div.node())
                document.body.append(div.node())
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
