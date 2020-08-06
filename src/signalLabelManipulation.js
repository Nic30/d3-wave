"use strict";

import * as d3 from 'd3';

export class SignalLabelManipulation {
	constructor(ROW_Y, signalList) {
		this.previouslyClicked = null;
		this.signalList = signalList;
		this.labels = null;
		this.ROW_Y = ROW_Y;
	}

	resolveInsertTarget(y) {
		var targetParentNode, onParentI, siblings;

		var nodes = this.signalList.visibleNodes();
		for (var i = 0; i < nodes.length; i++) {
			var n = nodes[i];
			if (y <= n.y - this.ROW_Y * 0.5 && n.parent) {
				// insert before n (parent is checked be)
				siblings = n.parent.children;
				targetParentNode = n.parent;
				onParentI = siblings.indexOf(n);
				break;
			} else if (y <= n.y + this.ROW_Y * 0.5) {
				// insert after
				// if n is hierarchical insert into
				if (n.children) {
					targetParentNode = n;
					onParentI = 0;
					break;
				} else {
					siblings = n.parent.children;
					targetParentNode = n.parent;
					onParentI = siblings.indexOf(n) + 1;
					break;
				}
			}
		}
		return [targetParentNode, onParentI];
	}

	// select and de-select all "g"
	// signal labels dragging, reordering
	dragStarted(elm, d) {
		// move to front to make it virtually on top of all others
		elm.raise();
		// d = index of clicked signal
		var current = d;
		var currentlySelected = current.data.type.selected;
		var shiftKey = d3.event.shiftKey || d3.event.sourceEvent.shiftKey;
		if (shiftKey && this.previouslyClicked) {
			// select all between last selected and clicked
			// de-select all
			if (this.signalList) {
				var prevId = this.previouslyClicked.id
				this.signalList.visibleNodes().forEach(function(d) {
					var i = d.id;
					if (prevId < current.id) {
						d.data.type.selected = prevId <= i && i <= current.id;
					} else {
						d.data.type.selected = prevId >= i && i >= current.id;
					}
				});
			}
			if (this.labels)
				this.labels.classed('selected', (d) => d.data.type.selected);
			return;
		}
		var altKey = d3.event.altKey || d3.event.sourceEvent.altKey;
		if (!altKey) {
			if (this.signalList) {
				this.signalList.visibleNodes().forEach(function(d) {
					d.data.type.selected = false;
				});
			}
		}
		// toggle selection
		current.data.type.selected = !currentlySelected;
		if (this.labels) {
			this.labels.classed('selected', (d) => d.data.type.selected);
		}
	}
	dragged(elm, d) {
		elm.attr('transform', 'translate(' + d.x + ',' + d3.event.y + ')');
	}
	regenerateDepth(d) {
		var offset = d.depth;
		(d.children || []).forEach((d2) => {
			d2.depth = offset + 1;
			this.regenerateDepth(d2);
		});
	}
	dragEnded(elm, d) {
		// move to front to make it virtually on top of all others
		elm.lower();
		var insertTarget = this.resolveInsertTarget(d3.event.y);
		var shiftKey = d3.event.shiftKey || d3.event.sourceEvent.shiftKey;
		if (!(this.previouslyClicked != null && shiftKey) && d.data.type.selected) {
			this.previouslyClicked = d;
		} else {
			this.previouslyClicked = null;
		}

		// check if inserting to it self
		var newParent = insertTarget[0];
		var newIndex = insertTarget[1];
		var _newParent = newParent;
		var insertingToItself = false;
		while (_newParent) {
			if (_newParent === d) {
				insertingToItself = true;
				break;
			}
			_newParent = _newParent.parent;
		}

		if (!insertingToItself && (
			newParent !== d.parent ||
			newIndex !== d.parent.children.indexOf(d) + 1)) {
			// moving on new place
			elm.classed('selected', false);
			d.data.type.selected = false;
			// insert on new place (we do it first, because we do not want to break indexing)
			var oldSiblings = d.parent.children;
			var oldIndex = oldSiblings.indexOf(d);
			var newSiblings = insertTarget[0].children;
			newSiblings.splice(newIndex, 0, d);
			// remove from original possition
			if (newSiblings === oldSiblings && newIndex < oldIndex) {
				oldIndex += 1;
			}
			oldSiblings.splice(oldIndex, 1);
			d.parent = insertTarget[0];
			d.depth = d.parent.depth + 1;
			this.regenerateDepth(d);
			if (this.signalList) {
				this.signalList.update();
			}
		} else {
			// put label back to it's original possition
			elm.attr('transform', 'translate(' + d.x + ',' + d.y + ')');
		}
	}
	registerDrag(labels) {
		var _this = this;
		this.labels = labels;
		function dragStarted(d) {
			return _this.dragStarted(d3.select(this), d);
		}
		function drag(d) {
			return _this.dragged(d3.select(this), d);
		}
		function dragEnd(d) {
			return _this.dragEnded(d3.select(this), d);
		}
		labels.call(
			d3.drag()
				.on('start', dragStarted)
				.on('drag', drag)
				.on('end', dragEnd)
		);
	}

}


