"use strict";

import * as d3 from 'd3';
import { scrollbar } from './scrollbar.js';
import { SignalLabelManipulation } from './signalLabelManipulation.js';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export class TreeList {
	constructor(barHeight, contextMenu) {
		this.barHeight = barHeight;
		this.contextMenu = contextMenu;
		this.root;
		this.rootElm;
		this.labelG;
		this.scrollbarG = null;
		var update = this.update.bind(this);
		this.scroll = scrollbar(barHeight)
			.onDrag(function() { update(); });

		this.width;
		this.height;
		this.onChange;
		this.nodes = [];
		this.labelMoving = new SignalLabelManipulation(barHeight, this);
	}
	getExpandCollapseIcon(d) {
		if (d.data.children || d.data._children) {
			var ico = faChevronRight;
			if (d.children != null) {
				ico = faChevronDown;
			}
			return ico.icon[4];
		}
		return '';
	}
	registerExpandHandler(elm) {
		var clickExpandCollapse = this.clickExpandCollapse.bind(this);
		return elm.on('click', function(d) { clickExpandCollapse(d, elm); })
			.on('mousedown', function() { d3.event.stopPropagation(); })
			.on('mouseup', function() { d3.event.stopPropagation(); });
	}
	clickExpandCollapse(d, elm) {
		d3.event.stopPropagation();
		if (d.children || d._children) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
			d3.select(elm.parentElement)
				.select('path')
				.attr('d', this.getExpandCollapseIcon);
			this.update();
		}
	}
	resolveSelection() {
		// Compute the flattened node list.
		if (!this.root) {
			// no data
			return;
		}
		var barHeight = this.barHeight;
		var nodeTotalCnt = this.root.value;
		var scrollPerc = this.scroll ? this.scroll.startPerc() : 0;
		var start = Math.round(scrollPerc * nodeTotalCnt);
		var end = Math.min(start + this.height / barHeight, nodeTotalCnt);
		var index = -1;
		var i = 0;
		var nodes = this.nodes = [];
		this.root.eachBefore((n) => {
			if (i >= start && i <= end) {
				n.x = n.depth * 20;
				n.y = ++index * barHeight;
				nodes.push(n);
			}
			i++;
		});
	};
	draw(_rootElm) {
		this.rootElm = _rootElm;
		this.labelG = _rootElm.append('g');

		this.update();
		// construct scrollbar after main list in order to have in top
		this.scrollbarG = this.rootElm.append('g')
			.attr('class', 'scrollbar');
		this.scrollbarG.call(this.scroll);
		this.scroll.registerWheel(this.rootElm);
	};
	_setLabelWidth(_width) {
		var barHeight = this.barHeight;
		// udpate width on all labels
		this.labelG.selectAll('.labelcell rect')
			.attr('width', function(d) {
				return _width - d.depth * 20 - barHeight / 2;
			});
		this.labelG.selectAll(".labelcell")
			.style("clip-path", function(d) {
				var width = _width - d.depth * 20 - barHeight / 2;
				return ["polygon(", 0, "px ", 0, "px, ",
					0, "px ", barHeight, "px, ",
					width, "px ", barHeight, "px, ",
					width, "px ", 0, "px)"].join("");
			});
	}
	size(_width, _height) {
		if (!arguments.length) { return [this.width, this.height]; }
		if (this.labelG && this.width !== _width) {
			this._setLabelWidth(_width);
		}
		this.width = _width;
		this.height = _height;
		if (this.scroll) {
			// also automatically renders also this list
			this.scroll.size(this.width, this.height);
		}
		return this;
	};
	data(_data, childrenGetter) {
		if (childrenGetter === undefined) {
			this.childrenGetter = function(d) { return d.children; };
		}
		this.root = d3.hierarchy(_data, childrenGetter);
		// Compute the flattened node list.
		this.root.sum(() => 1);
		var i = 0;
		this.root.eachBefore((n) => {
			n.id = i++;
		});
		var flatenedData = [];
		var maxDepth = 0;
		this.root.eachBefore(function(d) {
			flatenedData.push(d);
			maxDepth = Math.max(maxDepth, d.depth);
		});
		this.scroll.data(flatenedData, maxDepth);

		if (this.rootElm) {
			if (this.labelG)
				this.labelG.selectAll('.labelcell').remove();
			this.update();
		} else {
			this.resolveSelection();
			if (this._onChange) {
				this._onChange(this.nodes);
			}
		}
		return this;
	};
	onChange(fn) {
		if (arguments.length) {
			this._onChange = fn;
			return this;
		}
		return this._onChange;
	};
	visibleNodes() {
		return this.nodes;
	};
	filter(predicate) {
		function remove(d) {
			if (d.parent) {
				const index = d.parent.children.indexOf(d);
				if (index < 0) {
					throw new Error("Deleting something which is not there");
				}
				// remove an item from a children on parent
				d.parent.children.splice(index, 1);
			}
		}
		var updated = false;
		this.root.eachBefore(function(d) {
			if (!predicate(d.data)) {
				remove(d);
				updated = true;
			}
		});
		if (updated) {
			this.update();
		}
	};
	update() {
		this.resolveSelection();
		if (!this.labelG)
			return;
		// Update the nodes
		var node = this.labelG.selectAll('.labelcell')
			.data(this.nodes, (d) => {
				return d.id;
			});

		var nodeEnter = node.enter().append('g')
			.classed('labelcell', true)
			// .attr("transform", () => "translate(" + source.y0 + "," + source.x0 + ")") // for transition
			.classed('selected', function(d) {
				return d.data.type.selected;
			});

		var barHeight = this.barHeight;
		// background rectangle for highlight
		nodeEnter.append('rect')
			.attr('height', barHeight)
			.attr('x', barHeight / 2)
			.attr('y', -0.5 * barHeight);

		// adding arrows
		nodeEnter.append('path')
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')' + ' scale(' + (barHeight / faChevronDown.icon[1] * 0.5) + ')')
			.attr('d', this.getExpandCollapseIcon)
			.call(this.registerExpandHandler.bind(this));

		// background for expand arrow
		nodeEnter.append('rect')
			.classed('expandable', (d) => d.children || d._children)
			.attr('width', barHeight / 2)
			.attr('height', barHeight)
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')')
			.style('opacity', 0)
			.call(this.registerExpandHandler.bind(this));

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

		nodeEnter.on('contextmenu', this.contextMenu);
		this._setLabelWidth(this.width);
		if (this._onChange) {
			this._onChange(this.nodes);
		}
		this.labelMoving.registerDrag(
			this.labelG.selectAll('.labelcell')
		);
	};
}
