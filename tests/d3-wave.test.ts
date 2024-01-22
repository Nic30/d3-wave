import * as d3 from 'd3';
import { WaveGraph } from '../src/waveGraph';
import * as fs from 'fs';
import { describe, expect, it } from '@jest/globals';

describe('Testing wave rendering basics', () => {
    var svg = d3.select<HTMLBodyElement, undefined>('body')
        .append<HTMLDivElement>("div")
        .append<SVGSVGElement>('svg');

    svg.attr('width', 500)
        .attr('height', 500);

    var wave = new WaveGraph(svg as d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>);
    it('SVG root is one specified', () => {
        expect(wave.svg).toBe(svg);
    });
    it('SVG has root g', function () {
        var gs = svg.selectAll('g');
        expect(gs.size()).toBe(1);
    });
});

describe('Testing wave rendering of example', () => {
    var svg = d3.select('body')
        .append('svg');

    svg.attr('width', 500)
        .attr('height', 500);

    var wave = new WaveGraph(svg as d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>);
    var signalData = JSON.parse(fs.readFileSync('examples/FifoTC_test_normalOp.json', 'utf8'));

    it('signal data correctly flattened', () =>{
        expect(wave.data.length).toBe(19);
    });
    wave.bindData(signalData);
    wave.draw();

    it('SVG has correct count of series', () =>{
        var v = svg.selectAll('.value-row');
        expect(v.size()).toBe(wave.data.length);
    });
    it('SVG has correct count of series labels', () => {
        var t = d3.selectAll('.axis-y').selectAll('text');
        expect(t.size()).toBe(wave.data.length);
    });
});
