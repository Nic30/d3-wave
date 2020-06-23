import * as d3 from "d3";

export function signalLabelManipulationRegisterHandlers(graph) {
	graph.svg.on("mouseover", function(d,i) {
	    d3.select(window).on('keypress', function () {
            var tagName = d3.select(d3.event.target).node().tagName;
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
                return;
            }
            if (d3.event.key == "Delete") {
            	console.log("del")
            	graph.data = graph.data.filter(function (d) {
            		return !d[1].selected;
            	})
            	graph.draw();
            }
        });
	});
}

export function signalLabelManipulation(graph, yaxisG, namesHeight, signalNames, sizes, ROW_Y) {
	var signalData = graph.data;
	var yaxisLabes = yaxisG.selectAll('g');
	yaxisLabes.classed("tick-selected", function(d) {
		           return signalData[d][1].selected;
	           });
    // select and de-select all "g"
    // signal labels dragging, reordering
    function dragstarted(d) {
    	// d = index of clicked signal
        var el = d3.select(this);
        var selectedFirstIndex = null;

        if (d3.event.shiftKey || d3.event.sourceEvent.shiftKey) {
            // searching for first isseleted in signalData
            for (var i = 0; i < signalData.length; i++) {
            	var isselected = signalData[i][1].selected
        	    if (isselected) {
        		   selectedFirstIndex = i;
        		   break;
                }
            }
        }
        if (selectedFirstIndex == null) {
            // toggle selection  
            var isselected = signalData[d][1].selected = !signalData[d][1].selected;
            el.raise().classed("tick-selected", isselected);
        } else {
        	// select all between last selected and clicked
        	// de-select all
        	for (var i = 0; i < signalData.length; i++) { 
        		if (selectedFirstIndex < d) {
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
        d3.select(this)
          .classed("tick-selected", false);
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
    
    var yticks = yaxisG.selectAll(".tick");
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