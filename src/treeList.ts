import * as d3 from 'd3';
import { Scrollbar } from './scrollbar';
import { SignalLabelManipulation } from './signalLabelManipulation';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import type { SignalContextMenu } from './signalLabelContextMenu';
import { WaveGraphSignal } from './data';
import { DragBarVertical } from './dragBar';

export interface HierarchyNodeWaveGraphSignalWithXYId extends d3.HierarchyNode<WaveGraphSignal> {
	x?: number;
	y?: number;
	_children?: this[];
}

export class TreeList {
	barHeight: number;
	labelMoving: SignalLabelManipulation;
	width: number | undefined;
	height: number | undefined;
	rootElm: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
	root: HierarchyNodeWaveGraphSignalWithXYId | null;
	labelG: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined> | null;
	scrollbarG: d3.Selection<SVGGElement, any, any, any> | null;
	scroll: Scrollbar | null;
	contextMenu: SignalContextMenu;
	nodes:HierarchyNodeWaveGraphSignalWithXYId[];
	_onChange: ((nodes: HierarchyNodeWaveGraphSignalWithXYId[]) => void) | null;

	constructor(barHeight: number, contextMenu: SignalContextMenu) {
		this.barHeight = barHeight;
		this.contextMenu = contextMenu;
		this.rootElm = null;
		this.root = null;
		this.labelG = null;
		this.scrollbarG = null;
		this.scroll = null;
		this.width = undefined;
		this.height = undefined;
		this._onChange = null;
		this.nodes = [];
		this.labelMoving = new SignalLabelManipulation(barHeight, this);
	}

	public static getExpandCollapseIcon(d: HierarchyNodeWaveGraphSignalWithXYId) {
		if (d.data.children || d.data._children) {
			var ico = faChevronRight;
			if (d.children != null) {
				ico = faChevronDown;
			}
			return ico.icon[4];
		}
		return '';
	}
	registerExpandHandler<GElement extends SVGElement, PElement extends SVGElement, PDatum>(elm: d3.Selection<GElement, HierarchyNodeWaveGraphSignalWithXYId, PElement, PDatum>) {
		var clickExpandCollapse = this.clickExpandCollapse.bind(this);
		elm.on('click', function (ev, d) { clickExpandCollapse(ev, d, this); })
			.on('mousedown', function (ev) { ev.stopPropagation(); })
			.on('mouseup', function (ev) { ev.stopPropagation(); });
		return elm;
	}
	clickExpandCollapse(ev: any, d: HierarchyNodeWaveGraphSignalWithXYId, elm: SVGElement) {
		ev.stopPropagation();
		if (d.children || d._children) {
			if (d.children) {
				d._children = d.children;
				d.children = undefined;
			} else {
				d.children = d._children;
				d._children = undefined;
			}
			d3.select<SVGElement, HierarchyNodeWaveGraphSignalWithXYId>(elm.parentElement as any as SVGElement)
				.select('path')
				.attr('d', TreeList.getExpandCollapseIcon);
			this.update();
		}
	}
	resolveSelection() {
		// Compute the flattened node list.
		if (!this.root) {
			// no data
			return;
		}
		const barHeight = this.barHeight;
		const nodeTotalCnt = this.root.value as number;
		const scrollPerc = this.scroll ? this.scroll.startPerc() : 0;
		const start = Math.round(scrollPerc * nodeTotalCnt);
		const end = Math.min(start + (this.height as number) / barHeight, nodeTotalCnt);
		let index = -1;
		let i = 0;
		const nodes = this.nodes;
		nodes.splice(0, nodes.length); // clear
		this.root.eachBefore((n: HierarchyNodeWaveGraphSignalWithXYId) => {
			if (i >= start && i <= end) {
				n.x = n.depth * 20;
				n.y = ++index * barHeight;
				nodes.push(n);
			}
			i++;
		});
	}
	draw(_rootElm: d3.Selection<SVGGElement, undefined, HTMLDivElement, undefined>) {
		this.rootElm = _rootElm;
		this.labelG = _rootElm.append('g');

		this.update();
		// construct scrollbar after main list in order to have in top
		this.scrollbarG = this.rootElm.append('g')
			.attr('class', 'scrollbar');

		this.scroll = new Scrollbar(this.barHeight, this.scrollbarG);
		var update = this.update.bind(this);
		this.scroll
			.registerWheel(this.rootElm)
			.onDrag(function (startPrec: number) { update(); });
	}
	_setLabelWidth(_width: number) {
		var barHeight = this.barHeight;
		// udpate width on all labels
		if (this.labelG) {
			this.labelG.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>('.labelcell rect')
				.attr('width', function (d: HierarchyNodeWaveGraphSignalWithXYId) {
					return _width - d.depth * 20 - barHeight / 2;
				});
			this.labelG.selectAll<SVGPathElement, HierarchyNodeWaveGraphSignalWithXYId>(".labelcell")
				.style("clip-path", function (d) {
					var width = _width - d.depth * 20 - barHeight / 2;
					return ["polygon(", 0, "px ", 0, "px, ",
						0, "px ", barHeight, "px, ",
						width, "px ", barHeight, "px, ",
						width, "px ", 0, "px)"].join("");
				});
		}
	}
	size(_width: number, _height: number) {
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
	}
	data(_data: WaveGraphSignal) {
		this.root = d3.hierarchy(_data, function (d: WaveGraphSignal) { return d.children; });
		// Compute the flattened node list.
		this.root.sum(() => 1);
		var i = 0;
		this.root.eachBefore((n: HierarchyNodeWaveGraphSignalWithXYId) => {
			(n as any).id = i++;
		});
		const flatenedData: HierarchyNodeWaveGraphSignalWithXYId[] = [];
		let maxDepth = 0;
		this.root.eachBefore(function (d) {
			flatenedData.push(d);
			maxDepth = Math.max(maxDepth, d.depth);
		});
		if (this.scroll) {
			this.scroll.data(flatenedData, maxDepth);
		}

		if (this.rootElm) {
			// update rendered
			if (this.labelG)
				this.labelG.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>('.labelcell').remove();
			this.update();
		} else {
			// update before rendering
			this.resolveSelection();
			if (this._onChange) {
				this._onChange(this.nodes);
			}
		}
		return this;
	}
	onChange(fn: ((nodes: HierarchyNodeWaveGraphSignalWithXYId[]) => void) | null) {
		if (arguments.length) {
			this._onChange = fn;
			return this;
		}
		return this._onChange;
	}
	visibleNodes() {
		return this.nodes;
	}
	filter(predicate: (d: WaveGraphSignal) => boolean) {
		if (!this.root)
			return;
		function remove(d: HierarchyNodeWaveGraphSignalWithXYId) {
			if (d.parent) {
				if (!d.parent.children) {
					throw new Error("Parent must have children because we are searching it because of children");
				}
				const index = d.parent.children.indexOf(d);
				if (index < 0) {
					throw new Error("Deleting something which is not there");
				}
				// remove an item from a children on parent
				d.parent.children.splice(index, 1);
			}
		}
		var updated = false;
		this.root.eachBefore(function (d: HierarchyNodeWaveGraphSignalWithXYId) {
			if (!predicate(d.data)) {
				remove(d);
				updated = true;
			}
		});
		if (updated) {
			this.update();
		}
	}
	update() {
		this.resolveSelection();
		if (!this.labelG)
			return;
		// Update the nodes
		var node = this.labelG.selectAll<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId>('.labelcell')
			.data(this.nodes, (d: HierarchyNodeWaveGraphSignalWithXYId) => {
				return d.id?.toString() as string;
			});

		var nodeEnter = node.enter().append<SVGGElement>('g')
			.classed('labelcell', true)
			// .attr("transform", () => "translate(" + source.y0 + "," + source.x0 + ")") // for transition
			.classed('selected', function (d: HierarchyNodeWaveGraphSignalWithXYId) {
				return !!d.data.type.isSelected;
			});

		var barHeight = this.barHeight;
		// background rectangle for highlight
		nodeEnter.append<SVGRectElement>('rect')
			.attr('height', barHeight)
			.attr('x', barHeight / 2)
			.attr('y', -0.5 * barHeight);

		// adding arrows
		nodeEnter.append<SVGPathElement>('path')
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')' + ' scale(' + (barHeight / faChevronDown.icon[1] * 0.5) + ')')
			.attr('d', TreeList.getExpandCollapseIcon)
			.call(this.registerExpandHandler.bind(this));

		// background for expand arrow
		nodeEnter.append<SVGRectElement>('rect')
			.classed('expandable', function (this: SVGRectElement, d: HierarchyNodeWaveGraphSignalWithXYId): boolean {
				return !!(d.data.children || d.data._children);
			})
			.attr('width', barHeight / 2)
			.attr('height', barHeight)
			.attr('transform', 'translate(0,' + -(barHeight / 2) + ')')
			.style('opacity', 0)
			.call(this.registerExpandHandler.bind(this));

		// adding file or folder names
		nodeEnter.append<SVGTextElement>('text')
			.attr('dy', 3.5)
			.attr('dx', 15)
			.text((d: HierarchyNodeWaveGraphSignalWithXYId) => d.data.name);
		nodeEnter
			.on('mouseover', function (this: SVGGElement, event: any, d: HierarchyNodeWaveGraphSignalWithXYId) {
				if (!this)
					return;
				d3.select(this)
					.classed('highlight', true);
			})
			.on('mouseout', function (this: SVGGElement, event: any, d: HierarchyNodeWaveGraphSignalWithXYId) {
				nodeEnter.classed('highlight', false);
			});

		// Transition nodes to their new position.
		nodeEnter.attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')');
		node.attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')');

		node.exit()
			.remove();
		const contextmenu = this.contextMenu.render.bind(this.contextMenu);
		nodeEnter.on('contextmenu', function (this: SVGGElement, ev: any, d: HierarchyNodeWaveGraphSignalWithXYId) {
			contextmenu(this, ev, d);
		});
		this._setLabelWidth(this.width as number);
		if (this._onChange) {
			this._onChange(this.nodes);
		}
		this.labelMoving.registerDrag(
			this.labelG.selectAll<SVGGElement, HierarchyNodeWaveGraphSignalWithXYId>('.labelcell')
		);
	}
}
