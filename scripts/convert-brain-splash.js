const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { Resvg } = require('@resvg/resvg-js');

const projectRoot = __dirname ? join(__dirname, '..') : '..';
const inputPath = join(projectRoot, 'assets', 'illustrations', 'brain-red.svg');
const outputPath = join(projectRoot, 'assets', 'splash-brain.png');

const svg = readFileSync(inputPath, 'utf8');

const resvg = new Resvg(svg, {
    fitTo: {
        mode: 'width',
        value: 2048,
    },
});

const pngData = resvg.render().asPng();

writeFileSync(outputPath, pngData);

console.log(`Created ${outputPath}`);
