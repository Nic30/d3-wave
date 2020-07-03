import * as d3 from "d3";
import {filterData, flattenSignals} from "./filterData.js";
import {RowRendererBit} from "./rowRenderers/bit.js"
import {RowRendererBits, SCALAR_FORMAT} from "./rowRenderers/bits.js"
import {signalLabelManipulationRegisterHandlers, signalLabelManipulation} from "./signalLabelManipulation.js";

const TIME_UNITS = [
	[1, "ps"],
	[1000, "ns"],
	[1000000, "us"],
	[1000000000, "ms"],
	[1000000000000, "s"],
];

function create_time_formater(divider, unit_name) {
	return function(d) {
		var v = d / divider;
		if (Number.isInteger(v)) {
			return v + " " + unit_name;
		} else {
			return  v.toFixed(2) + " " + unit_name;
		}
	}
}

// main class which represents the visualizer
export default class WaveGraph {

    constructor(svg) {
        this.svg = svg;
        this.g = svg.append("g");
        this.xaxisScale = null;
        this.yaxisScale = null;
        this.yaxisG = null;
        this.xaxisG = null;
        this.waveRowX = null;
        this.waveRowY = null;
        this.verticalHelpLine = null;
        
        // just some value, the real value are set in bindData()
        var maxT = 500;
        this.xRange = [0, maxT];
        this.sizes = {
            row : {
                range : [0, maxT],
                height : 20,
                ypadding : 5,
            },
            margin : {
                top : 20,
                right : 20,
                bottom : 20,
                left : 180
            },
            width : -1,
            height : -1
        };
        this.data = [];
        // list of renderers for value rows
        this.rowRenderers = [
        	new RowRendererBit(this),
        	new RowRendererBits(this)
        ];
        this.draggedElem = null;
        this.setSizes();
        signalLabelManipulationRegisterHandlers(this);
    }

    setZoom() {
    	var t_range = this.xRange;
    	var t_range_rev = [t_range[1], t_range[0]];
        var zoom = d3.zoom()
                     .extent([[0, 0], t_range_rev]) // initial position
                     .scaleExtent([1, 10])
                     .translateExtent([[-t_range[1], -t_range[0]], t_range_rev])
                     .on("zoom", this.zoomed.bind(this));
        this.svg.call(zoom);	
    }
    /*
	 * extract width/height from svg and apply margin to main "g"
	 */
    setSizes() {
        var svg = this.svg;
        var s = this.sizes;
        var w = svg.style('width') || svg.attr("width");
        w = parseInt(w);
        if (!Number.isFinite(w)) {
        	throw new Error("Can not resolve width of main SVG element");
        }
        var h = parseInt(svg.style("height") || svg.attr("height"));
        if (!Number.isFinite(h)) {
        	throw new Error("Can not resolve height of main SVG element");
        }
        s.width = (w
                   - s.margin.left
                   - s.margin.right);
        if (s.width <= 0) {
         	throw new Error("Width too small for main SVG element " + s.width);
        }
        s.height = (h
                    - s.margin.top
                    - s.margin.bottom);
        if (s.height <= 0) {
         	throw new Error("Height too small for main SVG element " + s.height);
        }
        this.g.attr("transform",
                    "translate(" + s.margin.left + "," + s.margin.top + ")");
    }

    drawYHelpLine() {
        var height = this.sizes.height;
        var vhl = this.verticalHelpLine;
        var svg = this.svg;
        var graph = this;

        if (vhl) {
            vhl.attr('y2', height)
        } else {
            // construct new help line
            this.verticalHelpLine = this.g.append('line')
                                          .attr('class', 'vertical-help-line')
                                          .attr('x1', 0)
                                          .attr('y1', 0)
                                          .attr('x2', 0)
                                          .attr('y2', height);

            function moveVerticalHelpLine() {
                var xPos = d3.mouse(this)[0] - graph.sizes.margin.left;
                if (xPos < 0)
                    xPos = 0;
                d3.select(".vertical-help-line")
                  .attr("transform", function () {
                      return "translate(" + xPos + ",0)";
                  })
                  .attr("y2", graph.sizes.height);
            }
            
            svg.on('mousemove', moveVerticalHelpLine);
        }
    }

    drawGridLines() {
        // simple graph with grid lines in v4
        // https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
        var height = this.sizes.height;
        var xaxisScale = this.xaxisScale;
        var xValues = xaxisScale.ticks(10).map(function(d) {
                                        return xaxisScale(d)
                                });
        // add the X gridlines
        var gridLines = this.g.selectAll(".grid-line-x")
                              .data(xValues);

        gridLines
           .enter()
           .append("line")
           .attr("class", "grid-line-x")
           .merge(gridLines)
           .attr('x1', function (d) { return d })
           .attr('y1', 0)
           .attr('x2', function (d) { return d })
           .attr('y2', height)

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
        var xaxisG = this.xaxisG
        if (xaxisG) {
            // update xaxisG
            var xaxis = this.xaxis;
            xaxisG.call(xaxis.scale(xaxisScale))
        } else {
        	// resolve which timeunit to use
        	var time_range = this.xRange;
        	time_range = time_range[1] - time_range[0];
        	var time_unit = null;
        	for (var i = 0; i < TIME_UNITS.length; i++) {
        		var u = TIME_UNITS[i];
        		if (time_range < 10 * u[0] || i == TIME_UNITS.length - 1) {
        			time_unit = u;
        			break;
        		}
        	}
            // create xaxisG
            var xaxis = this.xaxis = d3.axisTop(xaxisScale)
                                       .tickFormat(create_time_formater(time_unit[0], time_unit[1]));
            this.xaxisG = this.g.append("g")
                          .attr("class", "axis axis-x")
                          .attr("transform", "translate(0,0)")
                          .call(xaxis);
        }
    }
    
    // draw whole graph
    draw() {
        this.setSizes();

        var sizes = this.sizes;
        var graph = this;
        var signalData = this.data;

        this.drawXAxis();
        this.drawGridLines();
        this.drawYHelpLine();
        this.waveRowY = d3.scaleLinear()
	                      .domain([0, 1])
	                      .range([0, sizes.row.height]);
        // drawWaves
        // remove previously rendered row data
        this.g.selectAll(".value-row")
              .remove();

        var valueRows = this.g.selectAll(".value-row")
                              .data(graph.data)
        
        function renderWaveRows(selection) {
     	    // Select correct renderer function based on type of data series
            selection.each(function(d) {
               //var name = d[0];
               var signalType = d[1];
               var data = d[2];
               if (data.length) {
            	   var parent = d3.select(this);
            	   data = filterData(data, graph.sizes.row.range)
            	   var rendererFound = false;
            	   for (var i = 0; i < graph.rowRenderers.length; i++) {
			           var renderer = graph.rowRenderers[i];
			           if (renderer.select(signalType)) {
				           	renderer.render(parent, data, signalType, SCALAR_FORMAT.UINT_HEX);
				           	rendererFound = true;
				           	break;
			           }
            	   }
            	   if (!rendererFound) {
            		   throw new Error("None of installed renderers supports signalType:" + signalType);
            	   }
               }
            });
        }
                              
        var ROW_Y = sizes.row.height + sizes.row.ypadding;
        valueRows.enter()
                 .append("g")
                 .attr("class", "value-row")
                 .merge(valueRows)
                 .call(renderWaveRows)
                 .attr("transform", (d, i) => 'translate(0,' + (i * ROW_Y) + ')')

        // drawWaveLabels
        var signalNames = signalData.map(function(d, i) {
            return d[0];
        })
        
        var namesHeight = signalNames.length * ROW_Y;
        var yaxisScale = d3.scaleBand()
                           .domain(d3.range(signalNames.length))
                           .range([0, namesHeight]);
        this.yaxisScale = yaxisScale;
        // y axis
        if (this.yaxisG)
            this.yaxisG.remove();
        this.yaxisG = this.g.append("g")
            .classed("axis axis-y", true)
            .call(d3.axisLeft(yaxisScale)
                    .tickFormat((i) => signalNames[i])
            );
       signalLabelManipulation(
    		   this, this.yaxisG, namesHeight,
    		   signalNames, sizes, ROW_Y);
    }

    bindData(_signalData) {
    	if (_signalData.constructor !== Object) {
    		throw new Error("Data in invalid format (should be dictionary and is " + _signalData + ")");
    	}
    	var signalData = [];
    	flattenSignals(_signalData, signalData);
        this.data = signalData;
        var maxT = 0;
        for (var i = 0; i < signalData.length; i++) {
        	var d = signalData[i];
        	var last_time_in_data = d[2][d[2].length - 1][0];
        	maxT = Math.max(maxT, last_time_in_data);
        }
        this.xRange[1] = this.sizes.row.range[1] = maxT;
        this.setZoom()
    }

    zoomed() {
        var range = this.xRange;
        var t = d3.event.transform;
        var intervalRange = range[1] - range[0];
        var begin = -t.x;
        if (begin < 0) {
            begin = 0;
        }
        var end = begin + intervalRange*t.k;
        if (end < 1) {
            end = 1;
        }

        this.sizes.row.range = [begin, end];
        this.draw();
     }
}
