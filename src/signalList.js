import * as d3 from "d3";
import {scrollbar} from "./scrollbar.js";
import {signalLabelManipulationRegisterHandlers, signalLabelManipulation} from "./signalLabelManipulation.js";

export function treelist(barHeight) {
     //duration = 0,
    let root, rootElm,
        labelG,
		scrollbarG = null,
		scroll, width, height,
		onChange,
		nodes = [];

    //let nodeEnterTransition = d3.transition()
    //    .duration(duration)
    //    .ease(d3.easeLinear);

    var _treelist = function(_rootElm) {
		//signalLabelManipulationRegisterHandlers(this);
        rootElm = _rootElm;
        labelG = _rootElm.append("g");
        var flatenedData = [];
        var maxDepth = 0;
        root.eachBefore(function (d) {
	        flatenedData.push(d);
            maxDepth = Math.max(maxDepth, d.depth)
        });
        scroll = scrollbar(barHeight)
             .size(width, height)
             .data(flatenedData, maxDepth)
             .onDrag(function () { _treelist.update(); });

        _treelist.update();
        // construct scrollbar after main list in order to have in top
        scrollbarG = rootElm.append("g")
                            .attr("class", "scrollbar");
        scrollbarG.call(scroll);
        signalLabelManipulationRegisterHandlers(rootElm, _treelist);
		scroll.registerWheel(rootElm);
    };
    _treelist.size = function (_width, _height) {
	    if (!arguments.length)
            return [width, height];
	    width = _width;
        height = _height;
        if (scroll) {
            // also automatically renders also this list
            scroll.size(width, height);
        }
        return _treelist;
    };
    _treelist.data = function (_data, childrenGetter) {
	    if (childrenGetter == undefined) {
            childrenGetter = function(d) { return d.children; };
        }
	    root = d3.hierarchy(_data, childrenGetter);
        root.x0 = 0;
        root.y0 = 0;
        // Compute the flattened node list.
        root.count();

        if (rootElm) {
	        _treelist.update();
        } else {
	        resolveSelection();
        }
        return _treelist;
    }
    _treelist.onChange = function (fn) {
	     if (arguments.length) {
             onChange = fn;
             return _treelist;
         } else {
             return onChange;
         }
    };
    _treelist.visibleNodes = function () {
	     return nodes;
    };
    _treelist.filter = function (predicate) {
		function remove(d) {
			if (d.parent) {
				const index = d.parent.children.indexOf(5);
                if (index > -1) {
	                // remove an item from a children on parent
                    d.parent.children.splice(index, 1);
                }
			}
		}
		var updated = false;
		root.eachBefore(function (d) {
			if (!predicate(d.data)) {
				remove(d);
				updated = true;	
			}
		});
		if (updated) {
			_treelist.update();
		}
    }; 
    function resolveSelection() {
		// Compute the flattened node list.
		var nodeTotalCnt = root.value;
		var scrollPerc = scroll ? scroll.startPerc(): 0;
        var start = Math.round(scrollPerc * nodeTotalCnt);
        var end = Math.min(start + height/barHeight, nodeTotalCnt);
        var index = -1;
        var i = 0;
        nodes = [];
        root.eachBefore((n) => {
            n.id = i;
	        if (i >= start && i <= end) {
                n.x = n.depth * 20;
                n.y = ++index * barHeight;
                nodes.push(n);
            }
            i++;
        });
    }
    _treelist.update = function() {
        resolveSelection();
	
        // Update the nodes
        var node = labelG.selectAll(".labelcell")
            .data(nodes, (d) => {
	            return d.id
	        });

        var nodeEnter = node.enter().append("g")
            .classed("labelcell", true)
            //.attr("transform", () => "translate(" + source.y0 + "," + source.x0 + ")") // for transition
            .classed("selected", function(d) {
            	return d.data.type.selected;
            });

        // background rectangle for highlight
        nodeEnter.append("rect")
		    .attr("width", function (d) {
			    return width - d.depth * 20 - barHeight/2;
            })
		    .attr("height", barHeight)
		    .attr("x", barHeight/2)
		    .attr("y", -0.5*barHeight);

        // adding arrows
        nodeEnter.append('path')
            .attr("transform", "translate(0," + -(barHeight / 2) + ")")
            .attr("d", function(d) {
                if (d.data.type.name == "struct") {
                    if (d.children != null) {
                        // Chevron down https://icons.getbootstrap.com/icons/chevron-down/
                        return "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z";
                    } else {
                        // Chevron right https://icons.getbootstrap.com/icons/chevron-right/
                        return "M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z";
                    }
                } else {
                    return "";
                }
            })
            .call(registerExpandHandler)

        // background for expand arrow
        nodeEnter.append("rect")
            .classed("expandable", true)
            .attr("width", barHeight/2)
            .attr("height", barHeight)
            .attr("transform", "translate(0," + -(barHeight / 2) + ")") 
            .style("opacity", 0)
            .call(registerExpandHandler);


        // adding file or folder names
        nodeEnter.append("text")
            .attr("dy", 3.5)
            .attr("dx", 15)
            .text((d) => d.data.name);
        nodeEnter.on("mouseover", function () {
                d3.select(this).classed("highlight", true);
            })
            .on("mouseout", function () {
                nodeEnter.classed("highlight", false);
            });

        // Transition nodes to their new position.
        nodeEnter.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")

        node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")

        node.exit()
            .remove();

        signalLabelManipulation(_treelist, nodeEnter, barHeight);
        if (onChange) {
	        onChange(nodes);
        }
    }
    function registerExpandHandler(elm) {
	   return elm.on("click", click)
            .on("mousedown", function () {d3.event.stopPropagation();})
            .on("mouseup", function () {d3.event.stopPropagation();});
    }
    // Toggle children on click.
    function click(d) {
	    d3.event.stopPropagation();
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        _treelist.update();
    }

    return _treelist;
}