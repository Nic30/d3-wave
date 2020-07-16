import * as d3 from 'd3';
import { filterDataByTime } from './filterData.js';
import { RowRendererBit } from './rowRenderers/bit.js';
import { RowRendererBits } from './rowRenderers/bits.js';
import { RowRendererEnum } from './rowRenderers/enum.js';
import { RowRendererLabel } from './rowRenderers/label.js';
import { RowRendererStruct } from './rowRenderers/struct.js';
import { RowRendererArray } from './rowRenderers/array.js';
import { SCALAR_FORMAT, VECTOR_FORMAT } from './numFormat.js';
import { createTimeFormatterForTimeRange } from './timeFormat.js';
import { treelist } from './signalList.js';
import { faQuestion, faPlus, faTrash, faRedo } from '@fortawesome/free-solid-svg-icons';

// main class which constructs the signal wave viewer
export default class WaveGraph {
	constructor(svg) {
		this.svg = svg;
		this.g = svg.append('g');
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
			width: -1,
			height: -1
		};
		this.TICKS_PER_X_AXIS = 10;
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
		this.draggedElem = null;
		this.setSizes();
	}

	setZoom() {
		var timeRange = this.xRange;
		var zoom = d3.zoom()
			.scaleExtent([1 / timeRange[1], 1.1])
			.translateExtent([[timeRange[0], 0], [timeRange[1], 0]])
			.on('zoom', this.zoomed.bind(this));
		this.g.call(zoom);
	}
	zoomed() {
		var range = this.xRange;
		var t = d3.event.transform;
		var totalRange = range[1] - range[0];
		var currentRange = totalRange * t.k;
		var displayWidth = this.xaxisG.select('.domain').node().getBBox().width;
		var begin = (-t.x / displayWidth) * currentRange;
		begin = Math.max(Math.min(begin, range[1] - currentRange), 0);
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
		this.g.attr('transform',
			'translate(' + s.margin.left + ',' + s.margin.top + ')');

		var ROW_Y = s.row.height + s.row.ypadding;
		if (this.treelist) {
			this.treelist.size(s.margin.left, s.height);
		}
	}

	drawYHelpLine() {
		var height = this.sizes.height;
		var vhl = this.verticalHelpLine;
		var svg = this.svg;
		var graph = this;

		function moveVerticalHelpLine() {
			var xPos = d3.mouse(this)[0] - graph.sizes.margin.left;
			if (xPos < 0) { xPos = 0; }
			d3.select('.vertical-help-line')
				.attr('transform', function() {
					return 'translate(' + xPos + ',0)';
				})
				.attr('y2', graph.sizes.height);
		}

		if (vhl) {
			vhl.attr('y2', height);
		} else {
			// construct new help line
			this.verticalHelpLine = this.g.append('line')
				.attr('class', 'vertical-help-line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x2', 0)
				.attr('y2', height);

			svg.on('mousemove', moveVerticalHelpLine);
		}
	}

	drawGridLines() {
		// simple graph with grid lines in v4
		// https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
		var height = this.sizes.height;
		var xaxisScale = this.xaxisScale;
		var xValues = xaxisScale.ticks(this.TICKS_PER_X_AXIS)
			.map(function(d) {
				return xaxisScale(d);
			});
		// add the X gridlines (parallel with x axis)
		var gridLines = this.g.selectAll('.grid-line-x')
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
			this.xaxisG = this.g.append('g')
				.attr('class', 'axis axis-x')
				.call(this.xaxis);
		}
	}
	drawControlIcons() {
		var sizes = this.sizes;
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		// Define the div for the tooltip
		var div = d3.select('body').append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0);
		var icons = [
			{
				'icon': faQuestion,
				'onmouseover': function() {
					div.transition()
						.duration(200)
						.style('opacity', 0.9);
					div.html('tooltip fwampogmwarpo')
						.style('left', (d3.event.pageX) + 'px')
						.style('top', (d3.event.pageY - 28) + 'px');
				},
				'onmouseout': function() {
					div.transition()
						.duration(500)
						.style('opacity', 0);
				}
			},
			{ 'icon': faPlus },
			{ 'icon': faRedo },
			{ 'icon': faTrash }];
		this.yaxisG.selectAll('text').data(icons).enter()
			.append("g")
			.attr("transform", function(d, i) {
				return 'translate(' + (i * ROW_Y) + ',' + (-ROW_Y * 1) + ') scale(' + (ROW_Y / d.icon.icon[1] * 0.5) + ')';
			})
			.append('path')
			.classed('icons', true)
			.attr('d', function(d) {
				return d.icon.icon[4];
			})
			.on('mouseover', function(d) {
				if (d.onmouseover) {
					return d.onmouseover();
				}
				return null;
			})
			.on('mouseout', function(d) {
				if (d.onmouseout) {
					return d.onmouseout();
				}
				return null;
			});
	    if (this.treelist)
		    this.yaxisG.call(this.treelist);
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
		this.g.selectAll('.value-row')
			.remove();

		var valueRows = this.g.selectAll('.value-row')
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
					var rendererFound = false;
					for (var i = 0; i < graph.rowRenderers.length; i++) {
						var renderer = graph.rowRenderers[i];
						if (renderer.select(signalType)) {
							var formatter = SCALAR_FORMAT.UINT_HEX;
							if (renderer instanceof RowRendererEnum) {
								formatter = (d) => { return d; };
							} else if (renderer instanceof RowRendererArray) {
								formatter = VECTOR_FORMAT.UINT_HEX;
							}
							renderer.render(parent, data, signalType, formatter);
							rendererFound = true;
							break;
						}
					}
					if (!rendererFound) {
						throw new Error('None of installed renderers supports signalType:' + signalType);
					}
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
		function discoverMaxT(d) {
			var dData = d.data;
			if (dData && dData.length) {
				var lastTimeInData = dData[dData.length - 1][0];
				maxT = Math.max(maxT, lastTimeInData);
			}
			(d.children || d._children || []).forEach(discoverMaxT);
		}
		discoverMaxT(this.allData);

		var sizes = this.sizes;
		this.xRange[1] = sizes.row.range[1] = maxT;
		this.setZoom();
		var ROW_Y = sizes.row.height + sizes.row.ypadding;
		var graph = this;
		this.treelist = treelist(ROW_Y)
			.size(sizes.margin.left, sizes.height)
			.data(this.allData)
			.onChange(function (selection) {
			    graph.data = selection.map((d) => { return d.data; });
			    graph.draw();
			});
		this.treelist.data(this.allData);
		this.setSizes();
	}
}
