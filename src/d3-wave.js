import * as d3 from "d3";
import {filterDataByTime, flattenSignals} from "./filterData.js";
import {RowRendererBit} from "./rowRenderers/bit.js";
import {RowRendererBits} from "./rowRenderers/bits.js";
import {RowRendererEnum} from "./rowRenderers/enum.js";
import {RowRendererLabel} from "./rowRenderers/label.js";
import {RowRendererStruct} from "./rowRenderers/struct.js";
import {SCALAR_FORMAT} from "./numFormat.js";
import {signalLabelManipulationRegisterHandlers, signalLabelManipulation} from "./signalLabelManipulation.js";
import {create_time_formater_for_time_range} from "./timeFormat.js"

// main class which constructs the signal wave viewer
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
        
        // total time range
        this.xRange = [0, 1];
        this.sizes = {
            row : {
	            // currently used time range
                range : [0, 1],
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
        this.TICKS_PER_X_AXIS = 10;
        this.data = [];
        // list of renderers for value rows
        this.rowRenderers = [
        	new RowRendererBit(this),
        	new RowRendererBits(this),
            new RowRendererEnum(this),
            new RowRendererLabel(this),
            new RowRendererStruct(this),
        ];
        this.draggedElem = null;
        this.setSizes();
        signalLabelManipulationRegisterHandlers(this);
    }

    setZoom() {
    	var t_range = this.xRange;
        var zoom = d3.zoom()
                     .extent([[t_range[0], 0], [t_range[1], 0]])
                     .translateExtent([[t_range[0], 0], [t_range[1], 0]])
                     .on("zoom", this.zoomed.bind(this));
        this.svg.call(zoom);
    }
    zoomed() {
        var range = this.xRange;
        var t = d3.event.transform;
        var totalRange = range[1] - range[0];
        var currentRange = totalRange * t.k;
        var display_width = this.xaxisG.select(".domain").node().getBBox().width;
        var begin = (-t.x/display_width) * currentRange;
        if (begin < 0) {
            begin = 0;
        }
        var end = begin + currentRange;
        if (end < 1) {
            end = 1;
        }

        this.sizes.row.range = [begin, end];
        if (this.xaxis) {
	        // update tick formater becase time range has changed
            // and we may want to use a different time unit
            this.xaxis.tickFormat(
	            create_time_formater_for_time_range(this.sizes.row.range)
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
        var xValues = xaxisScale.ticks(this.TICKS_PER_X_AXIS)
                                .map(function(d) {
                                        return xaxisScale(d)
                                });
        // add the X gridlines (parallel with x axis)
        var gridLines = this.g.selectAll(".grid-line-x")
                              .data(xValues);

        gridLines
           .enter()
           .append("line")
           .attr("class", "grid-line-x")
           .merge(gridLines)
           .attr('x1', function (d) { return d; })
           .attr('y1', 0)
           .attr('x2', function (d) { return d; })
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
            // create xaxisG
            this.xaxis = d3.axisTop(xaxisScale)
                           .tickFormat(
	                            create_time_formater_for_time_range(this.sizes.row.range)
                           );
            this.xaxisG = this.g.append("g")
                                .attr("class", "axis axis-x")
                                .attr("transform", "translate(0,0)")
                                .call(this.xaxis);
        }
    }
    
    // draw whole graph
    draw() {
        this.setSizes();
        var sizes = this.sizes;
        var graph = this;

        this.drawXAxis();
        this.drawGridLines();
        this.drawYHelpLine();
        this.waveRowY = d3.scaleLinear()
	                      .domain([0, 1])
	                      .range([0, sizes.row.height]);
        this.drawYAxis();
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
            	   data = filterDataByTime(data, graph.sizes.row.range)
            	   var rendererFound = false;
            	   for (var i = 0; i < graph.rowRenderers.length; i++) {
			           var renderer = graph.rowRenderers[i];
			           if (renderer.select(signalType)) {
    			            var formater = SCALAR_FORMAT.UINT_HEX;
				            if (renderer instanceof RowRendererEnum) {
					            formater = (d) => {return d;};
				            }
				           	renderer.render(parent, data, signalType, formater);
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
        // move value row to it's possition                  
	    var ROW_Y = sizes.row.height + sizes.row.ypadding;
        valueRows.enter()
                 .append("g")
                 .attr("class", "value-row")
                 .merge(valueRows)
                 .call(renderWaveRows)
                 .attr("transform", (d, i) => 'translate(0,' + (i * ROW_Y) + ')')
    }
    drawYAxis() {
        var signalData = this.data;
        var sizes = this.sizes;
 
	    var ROW_Y = sizes.row.height + sizes.row.ypadding;
        // drawWaveLabels
        var namesHeight = signalData.length * ROW_Y;
        var yaxisScale = d3.scaleBand()
                           .domain(d3.range(signalData.length))
                           .range([0, namesHeight]);
        this.yaxisScale = yaxisScale;
        // y axis
        if (this.yaxisG)
            this.yaxisG.remove();
        this.yaxisG = this.g.append("g")
            .classed("axis axis-y", true)
            .call(d3.axisLeft(yaxisScale)
                    .tickFormat((i) => signalData[i][0])
            );
        signalLabelManipulation(
    		   this, this.yaxisG, namesHeight,
    		   sizes, ROW_Y);
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
            var dData = d[2];
            if (dData.length) {
        	    var last_time_in_data = dData[dData.length - 1][0];
        	    maxT = Math.max(maxT, last_time_in_data);
            }
        }
        this.xRange[1] = this.sizes.row.range[1] = maxT;
        this.setZoom();
    }
}
