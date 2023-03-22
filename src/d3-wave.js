"use strict";

import * as d3 from 'd3';
import { filterDataByTime } from './filterData.js';
import { RowRendererBit } from './rowRenderers/bit.js';
import { RowRendererBits } from './rowRenderers/bits.js';
import { RowRendererEnum } from './rowRenderers/enum.js';
import { RowRendererLabel } from './rowRenderers/label.js';
import { RowRendererStruct } from './rowRenderers/struct.js';
import { RowRendererArray } from './rowRenderers/array.js';
import { createTimeFormatterForTimeRange } from './timeFormat.js';
import { TreeList } from './treeList.js';
import { faQuestion, faDownload } from '@fortawesome/free-solid-svg-icons';
import { DragBarVertical } from './dragBar.js';
import { exportStyledSvgToBlob } from './exportSvg.js'
import { signalContextMenuInit } from './signalLabelContextMenu.js';
import { Tooltip } from './tooltip.js';

import './d3-wave.css';

// main class which constructs the signal wave viewer
export default class WaveGraph {
	constructor(svg) {
		this.svg = svg;
		svg.classed('d3-wave', true);
		this.dataG = svg.append('g');
		this.xaxisScale = null;
		this.yaxisG = null;
		this.xaxisG = null;
		this.waveRowX = null;
		this.waveRowY = null;
		this.verticalHelpLine = null;

		// total time range
		this.xRange = [0, 1];
		this.sizes = {
			row: {
				// currently used time range
				range: [0, 1],
				height: 20,
				ypadding: 5
			},
			margin: {
				top: 20,
				right: 20,
				bottom: 20,
				left: 180
			},
			dragWidth: 5,
			width: -1,
			height: -1
		};
		this.TICKS_PER_X_AXIS = 10; // number of ticks in X (time) axis
		this.data = [];
		// list of renderers for value rows
		this.rowRenderers = [
			new RowRendererBit(this),
			new RowRendererBits(this),
			new RowRendererEnum(this),
			new RowRendererLabel(this),
			new RowRendererStruct(this),
			new RowRendererArray(this),
		];
		this.timeZoom = null;
		this.labelAreaSizeDragBar = null;
		this.labelContextMenu = signalContextMenuInit(this);
		this.setSizes();
	}

	setZoom() {
		var timeRange = this.xRange;
		this.timeZoom = d3.zoom()
			.scaleExtent([1 / timeRange[1], 1.1])
			.translateExtent([[timeRange[0], 0], [timeRange[1], 0]])
			.on('zoom', this.zoomed.bind(this));
		this.dataG.call(this.timeZoom);
	}
	zoomed(ev) {
		if (!this.xaxisG)
			return;
		var range = this.xRange;
		var t = ev.transform;
		var totalRange = range[1] - range[0];
		var displayWidth = this.xaxisG.select('.domain').node().getBBox().width;
		var kDeltaToScroll = 0;
		if (ev.sourceEvent.shiftKey) {
			// horizontall scroll in data
			var curR = this.sizes.row.range;
			var prevK = (curR[1] - curR[0]) / totalRange;
			kDeltaToScroll = t.k - prevK;
			//console.log([t.k, prevK]);
			t.k = prevK;
		}
		// zoom in time domain
		var currentRange = totalRange * t.k;
		//console.log(["kDeltaToScroll", kDeltaToScroll, "currentRange", currentRange, 't.x', t.x]);
		var begin = (-t.x / displayWidth) * currentRange;
		//console.log(["begin0", begin]);
		if (kDeltaToScroll < 0) {
			begin -= currentRange * 0.1;
		} else if (kDeltaToScroll > 0) {
			begin += currentRange * 0.1;
		}
		//console.log(["begin1", begin]);
		begin = Math.max(Math.min(begin, range[1] - currentRange), 0);
		//console.log(["begin2", begin]);
		t.x = -(begin / currentRange) * displayWidth;
		var end = begin + currentRange;
		end = Math.max(end, 1);

		this.sizes.row.range = [begin, end];
		if (this.xaxis) {
			// update tick formatter becase time range has changed
			// and we may want to use a different time unit
			this.xaxis.tickFormat(
				createTimeFormatterForTimeRange(this.sizes.row.range)
			);
		}
		this.draw();
	}
    /*
     * extract width/height from svg and apply margin to main "g"
     */
	setSizes() {
		var svg = this.svg;
		var s = this.sizes;
		var w = svg.style('width') || svg.attr('width');
		w = parseInt(w);
		if (!Number.isFinite(w)) {
			throw new Error('Can not resolve width of main SVG element');
		}
		var h = parseInt(svg.style('height') || svg.attr('height'));
		if (!Number.isFinite(h)) {
			throw new Error('Can not resolve height of main SVG element');
		}
		s.width = w - s.margin.left - s.margin.right;
		if (s.width <= 0) {
			throw new Error('Width too small for main SVG element ' + s.width);
		}
		s.height = h - s.margin.top - s.margin.bottom;
		if (s.height <= 0) {
			throw new Error('Height too small for main SVG element ' + s.height);
		}
		this.dataG.attr('transform',
			'translate(' + s.margin.left + ',' + s.margin.top + ')');

		if (this.treelist) {
			this.treelist.size(s.margin.left, s.height);
		}
		if (this.labelAreaSizeDragBar)
			this.labelAreaSizeDragBar.size(s.dragWidth, s.height);

	}

	drawYHelpLine() {
		var height = this.sizes.height;
		var vhl = this.verticalHelpLine;
		var svg = this.svg;
		var graph = this;

		function moveVerticalHelpLine(ev) {
			var boundingRect = svg.node().getBoundingClientRect();
            var xPos = ev.clientX - boundingRect.left - graph.sizes.margin.left; //x position within the element.
			if (xPos < 0) { xPos = 0; }
			svg.select('.vertical-help-line')
				.attr('transform', function() {
					return 'translate(' + xPos + ',0)';
				})
				.attr('y2', graph.sizes.height);
		}

		if (vhl) {
			vhl.attr('y2', height);
		} else {
			// construct new help line
			this.verticalHelpLine = this.dataG.append('line')
				.attr('class', 'vertical-help-line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x2', 0)
				.attr('y2', height);

			svg.on('mousemove', moveVerticalHelpLine);
		}
	}

	drawGridLines() {
		// simple graph with grid lines in d3v4
		// https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
		var height = this.sizes.height;
		var xaxisScale = this.xaxisScale;
		var xValues = xaxisScale.ticks(this.TICKS_PER_X_AXIS)
			.map(function(d) {
				return xaxisScale(d);
			});
		// add the X gridlines (parallel with x axis)
		var gridLines = this.dataG.selectAll('.grid-line-x')
			.data(xValues);

		gridLines
			.enter()
			.append('line')
			.attr('class', 'grid-line-x')
			.merge(gridLines)
			.attr('x1', function(d) { return d; })
			.attr('y1', 0)
			.attr('x2', function(d) { return d; })
			.attr('y2', height);

		gridLines.exit().remove();
	}

	drawXAxis() {
		var sizes = this.sizes;
		var xaxisScale = d3.scaleLinear()
			.domain(sizes.row.range)
			.range([0, sizes.width]);
		this.xaxisScale = xaxisScale;
		this.waveRowX = xaxisScale;

		// var axisX = g.selectAll(".axis-x")
		// https://bl.ocks.org/HarryStevens/54d01f118bc8d1f2c4ccd98235f33848
		// General Update Pattern, I https://bl.ocks.org/mbostock/3808218
		// http://bl.ocks.org/nnattawat/9054068
		var xaxisG = this.xaxisG;
		if (xaxisG) {
			// update xaxisG
			var xaxis = this.xaxis;
			xaxisG.call(xaxis.scale(xaxisScale));
		} else {
			// create xaxisG
			this.xaxis = d3.axisTop(xaxisScale)
				.tickFormat(
					createTimeFormatterForTimeRange(this.sizes.row.range)
				);
			this.xaxisG = this.dataG.append('g')
				.attr('class', 'axis axis-x')
				.call(this.xaxis);
		}
	}

	drawControlIcons() {
		var _this = this;
		var sizes = this.sizes;
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		// Define the div for the tooltip

		var icons = [
			{
				'icon': faQuestion,
				'tooltip': 'd3-wave help placeholder[TODO]',
			},
			{
				'icon': faDownload,
				'tooltip': 'Download current screen as SVG image',
				'onclick': function() {
					var svg = exportStyledSvgToBlob(_this.svg.node());
					var url = URL.createObjectURL(svg);
					window.open(url);
				}
			}];
		var tooltip = new Tooltip((d) => d.tooltip);
		this.yaxisG.selectAll('text').data(icons).enter()
			.append("g")
			.attr("transform", function(d, i) {
				return 'translate(' + (i * ROW_Y) + ',' + (-ROW_Y * 1) + ') scale(' + (ROW_Y / d.icon.icon[1] * 0.5) + ')';
			})
			.call(tooltip.addToElm.bind(tooltip))
			.on('click', function(ev, d) {
				if (d.onclick) {
					return d.onclick();
				}
				return null;
			})
			.append('path')
			.classed('icons', true)
			.attr('d', function(d) {
				return d.icon.icon[4];
			});
	}
	drawYAxis() {
		var sizes = this.sizes;
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		// drawWaveLabels
		this.waveRowY = d3.scaleLinear()
			.domain([0, 1])
			.range([sizes.row.height, 0]);
		// y axis
		if (!this.yaxisG) {
			// this.yaxisG.remove();
			this.yaxisG = this.svg.append('g')
				.classed('axis axis-y', true);
			this.yaxisG.attr('transform',
				'translate(0,' + (sizes.margin.top + ROW_Y / 2) + ')');
			this.drawControlIcons();

			if (this.treelist)
				this.yaxisG.call(this.treelist.draw.bind(this.treelist));
		}
		if (!this.labelAreaSizeDragBar) {
			var graph = this;
			this.labelAreaSizeDragBar = new DragBarVertical(
				this.yaxisG,
				[sizes.dragWidth, sizes.height],
				[0, sizes.width + sizes.margin.left],
				[sizes.margin.left, sizes.margin.top]
			).onDrag(function(d) {
				sizes.margin.left = d.x;
				graph.setSizes();
			});
		}
	}
	// draw whole graph
	draw() {
		this.drawXAxis();
		this.drawGridLines();
		this.drawYHelpLine();
		this.drawYAxis();

		var sizes = this.sizes;
		var graph = this;
		// drawWaves
		// remove previously rendered row data
		this.dataG.selectAll('.value-row')
			.remove();

		var valueRows = this.dataG.selectAll('.value-row')
			.data(graph.data);

		function renderWaveRows(selection) {
			// Select correct renderer function based on type of data series
			selection.each(function(d) {
				// var name = d[0];
				var signalType = d.type;
				var data = d.data;
				if (data && data.length) {
					var parent = d3.select(this);
					data = filterDataByTime(data, graph.sizes.row.range);
					signalType.renderer.render(parent, data, signalType, signalType.formatter);
				}
			});
		}
		// move value row to it's possition
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		valueRows.enter()
			.append('g')
			.attr('class', 'value-row')
			.merge(valueRows)
			.call(renderWaveRows)
			.attr('transform', (d, i) => 'translate(0,' + (i * ROW_Y) + ')');
	}

	bindData(_signalData) {
		if (_signalData.constructor !== Object) {
			throw new Error('Data in invalid format (should be dictionary and is ' + _signalData + ')');
		}
		this.allData = _signalData;
		var maxT = 0;
		var rowRenderers = this.rowRenderers;
		function findRendererAndDiscoverMaxT(d) {
			var dData = d.data;
			if (dData && dData.length) {
				var lastTimeInData = dData[dData.length - 1][0];
				maxT = Math.max(maxT, lastTimeInData);
			}
			var signalType = d.type;
			for (var i = 0; i < rowRenderers.length; i++) {
				var renderer = rowRenderers[i];
				if (renderer.select(signalType)) {
					var formatter = signalType.formatter;
					if (!formatter) {
						formatter = renderer.DEFAULT_FORMAT;
					} else if (typeof formatter === 'string') {
						formatter = renderer.FORMATTERS[formatter];
						if (!formatter) {
							throw new Error("Formatter value invalid " + signalType.formatter + "(" + d.name + ")");
						}
					}
					signalType.formatter = formatter;
					signalType.renderer = renderer;
					break;
				}
			}
			if (!signalType.renderer) {
				throw new Error('None of installed renderers supports signalType:' + signalType);
			}

			(d.children || d._children || []).forEach(findRendererAndDiscoverMaxT);
		}
		findRendererAndDiscoverMaxT(this.allData);

		var sizes = this.sizes;
		this.xRange[1] = sizes.row.range[1] = maxT;
		this.setZoom();
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		var graph = this;
		if (!this.treelist) {
			this.treelist = new TreeList(ROW_Y, this.labelContextMenu)
				.onChange(function(selection) {
					graph.data = selection.map((d) => { return d.data; });
					graph.draw();
				});
		}
		this.setSizes();
		this.treelist.data(this.allData);
	}
}
