import * as d3 from "d3";
import {renderWaveRow } from "./valueRenderers";
// zoom+drag https://bl.ocks.org/mbostock/6123708

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
        this.verticalHelpLine = null;
        var maxT = 500;
        this.ROW_RANGE_REFERENCE = [0, maxT];
        this.sizes = {
            row : {
                range : [ 0, maxT],
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
        this.draggedElem = null;
        var zoom = d3.zoom()
            .extent([[0, 0], [maxT, 0]]) // initial position
            .scaleExtent([1, 10])
            .translateExtent([[-maxT, 0], [maxT, 0]])
            .on("zoom", this.zoomed.bind(this));
        svg.call(zoom);
        this.setSizes();
        this.registerKeys();
    }

    registerKeys() {
        var graph = this;
        
    	this.svg.on("mouseover", function(d,i) {
    		    d3.select(window).on('keypress', function () {
    	        	console.log("keypress")
    	            var tagName = d3.select(d3.event.target).node().tagName;
    	            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
    	                return;
    	            }
    	            if (d3.event.key == "Delete"){
    	            	console.log("del")
    	            	graph.data = graph.data.filter(function (d){
    	            		return !d[1].selected;
    	            	})
    	            	graph.draw();
    	            }
    	        });
    	 });
    }
    /*
	 * extract width/height from svg and apply margin to main "g"
	 */
    setSizes() {
        var svg = this.svg;
        var s = this.sizes;
        s.width = (parseInt(svg.style('width'))
                   - s.margin.left
                   - s.margin.right);
        s.height = (parseInt(svg.style("height"))
                    - s.margin.top
                    - s.margin.bottom);
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
        var xValues = xaxisScale.ticks(10)
                                .map(function(d){
                                        return xaxisScale(d)
                                })
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
                           .range([ 0, sizes.width]);
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
            var xaxis = this.xaxis = d3.axisTop(xaxisScale)
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

        // drawWaves
        // remove previusly rendered row data
        this.g.selectAll(".value-row")
              .remove();

        var valueRows = this.g.selectAll(".value-row")
                              .data(graph.data)
        
        function renderWaveRows(selection) {
            selection.each(function(d) {
               // var name = d[0];
               var type = d[1];
               var data = d[2];
               if (data.length)
                   return renderWaveRow(type, data,
                                        graph, d3.select(this));
            });
        }
                              
        var ROW_Y = sizes.row.height + sizes.row.ypadding;
        valueRows.enter()
                 .append("g")
                 .attr("class", "value-row")
                 .merge(valueRows)
                 .call(renderWaveRows)
                 .attr("transform", (d, i) => 'translate(' + 0 + ',' + (i*ROW_Y) + ')')

        // drawWaveLabels
        var signalNames = signalData.map(function(d, i) {
            return d[0];
        })
        
        var namesHeight = signalNames.length * ROW_Y;
        var yaxisScale = d3.scaleBand()
                           .domain(d3.range(signalNames.length))
                           .range([0, namesHeight])
                           // .paddingInner(0)
                           // .paddingOuter(0);
        this.yaxisScale = yaxisScale;
        // y axis
        if (this.yaxisG)
            this.yaxisG.remove();
        var labelsPossitions = d3.range(0, namesHeight, sizes.row.height);
        this.yaxisG = this.g.append("g")
            .classed("axis axis-y", true)
            .call(d3.axisLeft(yaxisScale)
                    .tickFormat((i) => signalNames[i])
            )
        var yaxisLabes = this.yaxisG.selectAll('g') 
        yaxisLabes.classed("tick-selected", function(d){
        	           return signalData[d][1].selected;
                   });
        // select and deselect all "g"
        // signal labels dragging, reordering
        function dragstarted(d) {
        	// d = index of clicked signal
            var el = d3.select(this);
            var selectedFirstIndex = null;

            if (d3.event.shiftKey || d3.event.sourceEvent.shiftKey){
                //searching for first isseleted (signaldata)
                for (var i = 0; i < signalData.length; i++) {
                	var isselected = signalData[i][1].selected
            	    if (isselected){
            		   selectedFirstIndex = i;
            		   break;
                    }
                }
            }
            if (selectedFirstIndex == null){
                // toggle selection  
                var isselected = signalData[d][1].selected = !signalData[d][1].selected;
                el.raise().classed("tick-selected", isselected);
            } else {
            	// select all between last selected and clicked
            	// selectedFirstIndex(d)
            	// deselect all
            	for (var i = 0; i < signalData.length; i++) { 
            		if (selectedFirstIndex < d){
            	        signalData[i][1].selected = selectedFirstIndex <= i && i <= d;
            		} else {
            			signalData[i][1].selected = selectedFirstIndex >= i && i >= d;
            		}
            	}
            }
        }
        function dragged(d) {
            var el = d3.select(this)
            el.attr("transform", 'translate(' + 0 + ',' + d3.event.y + ')')
        }
        function dragended(old_index) {
            d3.select(this).classed("tick-selected", false);
            var y = this.transform.baseVal.consolidate().matrix.f;
            var new_index = Math.round((y / namesHeight) * signalNames.length);
            if (old_index != new_index) {
                var d = signalData[old_index];
                signalData.splice(old_index, 1);
                if (old_index > new_index) {
                    signalData.splice(new_index, 0, d);
                } else if (new_index > old_index) {
                    signalData.splice(new_index-1, 0, d);
                }
                graph.draw();
            }
        }
        
        var yticks = this.yaxisG.selectAll(".tick");
        yticks.call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged)
                      .on("end", dragended)
              )
              .append("rect")
              .attr("width",  sizes.margin.left)
              .attr("height", ROW_Y)
              .attr("x", -sizes.margin.left)
              .attr("y", -ROW_Y * 0.5);
    }

    bindData(signalData) {
        this.data = signalData;
    }

    zoomed() {
        var range = this.ROW_RANGE_REFERENCE;
        var t = d3.event.transform;
        var width = this.sizes.width
        var intervalRange = range[1] - range[0];
        var begin = -t.x;
        if (begin < 0)
            begin = 0;
        var end = begin + intervalRange*t.k;
        if (end < 1)
            end = 1
        this.sizes.row.range = [begin, end];
        this.draw()
     }
    
    static temporaryFlattenSignal(s, res) {
        if (s.children) {
            // hierachical interface
            // add separator
            res.push([s.name, {"name": "bit"}, []]);
            // add sub signals
            WaveGraph.temporaryFlattenSignals(s.children, res);
        } else {
            // simple signal
            var tName;
            if (s.type.width == 1)
                tName = "bit";
            else
                tName = "bits";
            res.push([s.name, {"name": tName, "width": s.type.width}, s.data]);
        }
    }
    static temporaryFlattenSignals(sigs, res) {
        keysOfDict(sigs).sort().forEach(function(k){
            var ch = sigs[k];
            WaveGraph.temporaryFlattenSignal(ch, res)
        })
    }
}

function keysOfDict(obj) {
    var keys = [];

    for(var key in obj)
        if(obj.hasOwnProperty(key))
            keys.push(key);

    return keys;
}



