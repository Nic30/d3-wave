"use strict";

import * as d3 from 'd3';
import { scrollbar } from './scrollbar.js';
import { SignalLabelManipulation } from './signalLabelManipulation.js';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export function treelist(barHeight) {
	let root;
	let rootElm;
	let labelG;
	let scrollbarG = null;
	let scroll;
	let width;
	let height;
	let onChange;
	let nodes = [];
	let labelMoving = null;
	function getExpandCollapseIcon(d) {
		if (d.data.children || d.data._children) {
			var ico = faChevronRight;
			if (d.children != null) {
				ico = faChevronDown;
			}
			return ico.icon[4];
		}
		return '';
	}
	function registerExpandHandler(elm) {
		return elm.on('click', clickExpandCollapse)
			.on('mousedown', function() { d3.event.stopPropagation(); })
			.on('mouseup', function() { d3.event.stopPropagation(); });
	}
	function clickExpandCollapse(d) {
		d3.event.stopPropagation();
		if (d.children || d._children) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			d3.select(this.parentElement)
				.select('path')
				.attr('d', getExpandCollapseIcon);
			_treelist.update();
		}
	}
	function resolveSelection() {
		// Compute the flattened node list.
		var nodeTotalCnt = root.value;
		var scrollPerc = scroll ? scroll.startPerc() : 0;
		var start = Math.round(scrollPerc * nodeTotalCnt);
		var end = Math.min(start + height / barHeight, nodeTotalCnt);
		var index = -1;
		var i = 0;
		nodes = [];
		root.eachBefore((n) => {
			if (i >= start && i <= end) {
				n.x = n.depth * 20;
				n.y = ++index * barHeight;
				nodes.push(n);
			}
			i++;
		});
	}

	var _treelist = function(_rootElm) {
		rootElm = _rootElm;
		labelG = _rootElm.append('g');
		var flatenedData = [];
		var maxDepth = 0;
		root.eachBefore(function(d) {
			flatenedData.push(d);
			maxDepth = Math.max(maxDepth, d.depth);
		});
		scroll = scrollbar(barHeight)
			.size(width, height)
			.data(flatenedData, maxDepth)
			.onDrag(function() { _treelist.update(); });

		_treelist.update();
		// construct scrollbar after main list in order to have in top
		scrollbarG = rootElm.append('g')
			.attr('class', 'scrollbar');
		scrollbarG.call(scroll);
		labelMoving.registerHandlers(rootElm);
		scroll.registerWheel(rootElm);
	};
	labelMoving = new SignalLabelManipulation(barHeight, _treelist);

	_treelist.size = function(_width, _height) {
		if (!arguments.length) { return [width, height]; }
		if (labelG && width !== _width) {
			// udpate width on all labels
			labelG.selectAll('.labelcell rect')
				.attr('width', function(d) {
					return _width - d.depth * 20 - barHeight / 2;
				});
		}
		width = _width;

		height = _height;
		if (scroll) {
			// also automatically renders also this list
			scroll.size(width, height);
		}
		return _treelist;
	};
	_treelist.data = function(_data, childrenGetter) {
		if (childrenGetter === undefined) {
			childrenGetter = function(d) { return d.children; };
		}
		root = d3.hierarchy(_data, childrenGetter);
		// Compute the flattened node list.
		root.sum(() => 1);
		var i = 0;
		root.eachBefore((n) => {
			n.id = i++;
		});

		if (rootElm) {
			_treelist.update();
		} else {
			resolveSelection();
		}
		return _treelist;
	};
	_treelist.onChange = function(fn) {
		if (arguments.length) {
			onChange = fn;
			return _treelist;
		}
		return onChange;
	};
	_treelist.visibleNodes = function() {
		return nodes;
	};
	_treelist.filter = function(predicate) {
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
		root.eachBefore(function(d) {
			if (!predicate(d.data)) {
				remove(d);
				updated = true;
			}
		});
		if (updated) {
			_treelist.update();
		}
	};
	_treelist.update = function() {
		resolveSelection();

		// Update the nodes
		var node = labelG.selectAll('.labelcell')
			.data(nodes, (d) => {
				return d.id;
			});

		var nodeEnter = node.enter().append('g')
			.classed('labelcell', true)
			// .attr("transform", () => "translate(" + source.y0 + "," + source.x0 + ")") // for transition
			.classed('selected', function(d) {
				return d.data.type.selected;
			});

		// background rectangle for highlight
		nodeEnter.append('rect')
			.attr('width', function(d) {
				return width - d.depth * 20 - barHeight / 2;
			})
			.attr('height', barHeight)
			.attr('x', barHeight / 2)
			.attr('y', -0.5 * barHeight);

		// adding arrows
		nodeEnter.append('path')
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')' + ' scale(' + (barHeight / faChevronDown.icon[1] * 0.5) + ')')
			.attr('d', getExpandCollapseIcon)
			.call(registerExpandHandler);

		// background for expand arrow
		nodeEnter.append('rect')
			.classed('expandable', (d) => d.children || d._children)
			.attr('width', barHeight / 2)
			.attr('height', barHeight)
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')')
			.style('opacity', 0)
			.call(registerExpandHandler);

		// adding file or folder names
		nodeEnter.append('text')
			.attr('dy', 3.5)
			.attr('dx', 15)
			.text((d) => d.data.name);
		nodeEnter
			.on('mouseover', function() {
				d3.select(this).classed('highlight', true);
			})
			.on('mouseout', function() {
				nodeEnter.classed('highlight', false);
			});

		// Transition nodes to their new position.
		nodeEnter.attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')');
		node.attr('transform', (d) => 'translate(' + d.x + ',' + d.y + ')');

		node.exit()
			.remove();

		if (onChange) {
			onChange(nodes);
		}
		labelMoving.registerDrag(labelG.selectAll('.labelcell'));
	};

	return _treelist;
}
