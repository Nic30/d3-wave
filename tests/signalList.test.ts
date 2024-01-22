"use strict";

import * as d3 from 'd3';
import { WaveGraph } from '../src/waveGraph';
import * as fs from 'fs';
import { simulateEvent } from './simulateEvent';
import { describe, expect, it } from '@jest/globals';
import { HierarchyNodeWaveGraphSignalWithXYId } from '../src/treeList';
import { WaveGraphSignal } from '../src/data';

function collectLabels(root: WaveGraphSignal, offset: number, cnt:number, allLabels: string[], labelsWithChildren: string[]) {
	var offsetCntr = 0;
	function _collectLabels(root: WaveGraphSignal) {
		if (allLabels.length >= cnt)
			return;
		if (offsetCntr < offset) {
			offsetCntr++;
		} else {
			allLabels.push(root.name);
			if (root.children) {
				labelsWithChildren.push(root.name)
			}
		}
		(root.children || []).forEach(_collectLabels);
	}
	_collectLabels(root);
}

function getVisibleLabels(svg: d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>) {
	return svg.selectAll<SVGTextElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell text")
		.data()
		.sort((a, b) => d3.ascending(a.y, b.y))
		.map((d) => d.data.name);
}

describe('Testing signal label select, drag and zoom', function() {
	var ROW_Y = 25;
	var svg = d3.select('body')
		.append('svg') as d3.Selection<SVGSVGElement, undefined, HTMLDivElement, undefined>;

	svg.attr('width', 500)
		.attr('height', 500);
	var wave = new WaveGraph(svg);
	var signalData = JSON.parse(fs.readFileSync('examples/FifoTC_test_normalOp.json', 'utf8')) as WaveGraphSignal;
	wave.bindData(signalData);
	wave.draw();
	var expectedLabelCnt = 500 / ROW_Y - 1;
	var allLabels: string[] = [];
	var labelsWithChildren: string[] = [];
	collectLabels(signalData, 0, expectedLabelCnt, allLabels, labelsWithChildren);
    
	function getLabels() {
	    return svg.selectAll<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell")
	    	      .sort((a, b) => d3.ascending(a.y, b.y))
    }
    function selectLabelByName(name: string) {
    	var n = getLabels().filter((d) => d.data.name === name).node();
    	expect(n).toBeDefined();
    	return n;
    }
	
	it('SVG has correct count of labels', () => {
		expect(wave.data.length).toBe(expectedLabelCnt);
		var labels = getVisibleLabels(svg);
		expect(labels.length).toBe(expectedLabelCnt);
		expect(labels).toStrictEqual(allLabels);
	});
	it('labels with children are expandable', () => {
		var exandables = svg.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell .expandable")
			.data()
			.sort((a, b) => d3.ascending(a.y, b.y))
			.map((d) => d.data.name);
		expect(exandables).toStrictEqual(labelsWithChildren);
	});
	it('can collapse and expand root', () => {
		var rootExpandIcon = svg.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell .expandable")
			.filter((d) => d.data.name === labelsWithChildren[0])
			.node();
		if (!rootExpandIcon)
			throw new Error("rootExpandIcon not found");
		simulateEvent(rootExpandIcon, 'click', {});
		var labels = getVisibleLabels(svg);
		expect(labels).toStrictEqual([labels[0],]);
		simulateEvent(rootExpandIcon, 'click', {});
		var labels = svg.selectAll<SVGTextElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell text")
			.data()
			.sort((a, b) => d3.ascending(a.y, b.y))
			.map((d) => d.data.name);
		expect(labels).toStrictEqual(allLabels);
	});
	it('can collapse and expand non root', () => {
		var rootExpandIcon = svg.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell .expandable")
		    .filter((d) => d.data.name === 'dataIn')
            .node();
		if (!rootExpandIcon)
			throw new Error("rootExpandIcon not found");
		simulateEvent(rootExpandIcon, 'click', {});
		var labels = getVisibleLabels(svg);
		expect(labels).toContain('dataIn');
		expect(labels).not.toContain('dataIn_en');
		expect(labels).not.toContain('dataIn_data');
		expect(labels).not.toContain('dataIn_wait');
		
		simulateEvent(rootExpandIcon, 'click', {});
		var labels = svg.selectAll<SVGTextElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell text")
			.data()
			.sort((a, b) => d3.ascending(a.y, b.y))
			.map((d) => d.data.name);
		expect(labels).toStrictEqual(allLabels);
		expect(svg.selectAll(".labelcell.selected").size()).toBe(0)
	});
	it('can scroll down and up using wheel', () => {
		var labelsG = svg.select(".axis.axis-y").node() as Element;
		if (!labelsG) {
			throw new Error("labelsG was not found");
		}
		simulateEvent(labelsG, 'wheel', { deltaY: 3, deltaX: 0 });
		var _allLabels: string[] = [];
		var _labelsWithChildren: string[] = [];
		collectLabels(signalData, 1, expectedLabelCnt, _allLabels, _labelsWithChildren);
		var labels = getVisibleLabels(svg);
		expect(labels).toStrictEqual(_allLabels);

		simulateEvent(labelsG, 'wheel', { deltaY: -3, deltaX: 0 });
		var labels = getVisibleLabels(svg);
		expect(labels).toStrictEqual(allLabels);
	});
	var mover = svg.select(".axis.axis-y .mover");
	it('can scroll down and up using scrollbar drag', () => {
		var moverNode = mover.node() as Element;
		if (!moverNode)
			throw new Error("Can not find mover");
		simulateEvent(moverNode, 'drag', { deltaY: ROW_Y, deltaX: 0 });
		var _allLabels: string[] = [];
		var _labelsWithChildren: string[] = [];
		collectLabels(signalData, 1, expectedLabelCnt, _allLabels, _labelsWithChildren);
		var labels = getVisibleLabels(svg);
		expect(labels).toStrictEqual(_allLabels);

		simulateEvent(moverNode, 'drag', { deltaY: -ROW_Y, deltaX: 0 });
		labels = getVisibleLabels(svg);
		expect(labels).toStrictEqual(allLabels);
	});
	it('mover and scrollbar has correct height', () => {
		var _allLabels: string[] = [];
		var _labelsWithChildren: string[] = [];
		collectLabels(signalData, 0, Infinity, _allLabels, _labelsWithChildren);
		function checkScrollbar(height: number) {
			var scrollbarSubBars = svg.selectAll(".scrollbar .subBar");
			expect(scrollbarSubBars.size()).toBe(_allLabels.length);
			var sbHeight = +scrollbarSubBars.attr("height");
			var h = height - ROW_Y - 15;
			expect(scrollbarSubBars.size() * sbHeight).toBe(h);
			// number of visible / total number of labels
			expect(parseInt(mover.attr("height"))).toBe(Math.round(Math.round(h / ROW_Y) / _allLabels.length * h));
		}
		checkScrollbar(500)

		svg.attr('width', 600)
			.attr('height', 250);
		wave.setSizes();
		wave.draw();
		checkScrollbar(250)
		svg.attr('width', 500)
			.attr('height', 500);
		wave.setSizes();
		wave.draw();
		checkScrollbar(500)
	});
	it('can select/deselect by click', () => {
        var labels = getLabels();
	    var labelNodes = labels.nodes();
        var n = labelNodes[1];
		simulateEvent(n, 'click', {});
		
		var selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(1);
		expect(selectedLabels.node()).toBe(n);
		
		simulateEvent(n, 'click', {});
		selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(0);
		
		var dataIn_en = selectLabelByName('dataIn_en');
		if (!dataIn_en)
			throw new Error("can not find signal group named dataIn_en")
		var dataOut_en = selectLabelByName('dataOut_en');
		if (!dataOut_en)
			throw new Error("can not find signal group named dataOut_en")
		
		simulateEvent(dataIn_en, 'click', {});
		simulateEvent(dataOut_en, 'click', {});
		
		selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(1);
		expect(selectedLabels.node()).toBe(dataOut_en);
		simulateEvent(dataOut_en, 'click', {});
		selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(0);
	});

    it('deselect on select of other label', () => {
	    var labels = getLabels();
	    var labelNodes = labels.nodes();
	    var n1 = labelNodes[1];
		var n2 = labelNodes[2];
		simulateEvent(n1, 'click', {});
		simulateEvent(n2, 'click', {});
		
		var selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(1);
		expect(selectedLabels.node()).toBe(n2);
		simulateEvent(n2, 'click', {});
		selectedLabels = svg.selectAll(".labelcell.selected");
		expect(selectedLabels.size()).toBe(0);
    });
    it('select range using shift key', () => {
	    var labels = getLabels();
	    var labelNodes = labels.nodes();
		simulateEvent(labelNodes[1], 'click', {'shiftKey': true});
		simulateEvent(labelNodes[4], 'click', {'shiftKey': true});
		var selectedLabels = svg.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell.selected")
    		.sort((a, b) => d3.ascending(a.y, b.y));
		expect(selectedLabels.size()).toBe(4);
		var sn = selectedLabels.nodes();
		for (var i = 0; i < sn.length; i ++) {
		    expect(sn[i]).toBe(labelNodes[i +1]);
		}
		simulateEvent(labelNodes[4], 'click', {});
		simulateEvent(labelNodes[4], 'click', {});
		selectedLabels = svg.selectAll(".labelcell.selected")
		expect(selectedLabels.size()).toBe(1);
		simulateEvent(labelNodes[1], 'click', {'shiftKey': true});
		
	    selectedLabels = svg.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell.selected")
    		.sort((a, b) => d3.ascending(a.y, b.y));
		expect(selectedLabels.size()).toBe(4);
		sn = selectedLabels.nodes();
		for (var i = 0; i < sn.length; i ++) {
		    expect(sn[i]).toBe(labelNodes[i +1]);
		}
    });
});


