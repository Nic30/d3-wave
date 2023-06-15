import * as d3 from 'd3';

// http://bl.ocks.org/mccannf/1629464
export class DragBarVertical {
	x: number;
	y: number;
	xMin: number;
	xMax: number;
	dragBehavior: d3.DragBehavior<SVGRectElement, any, any>;
	dragHandle: d3.Selection<SVGRectElement, this, any, any>;
	_size: [number, number];
	_onDrag?: (drag: DragBarVertical) => void;

	constructor(parentGElm: d3.Selection<SVGGElement, any, any, any>, size: [number, number], range: [number, number], init_pos: [number, number]) {
		this._onDrag = undefined;
		[this.xMin, this.xMax] = range;
		[this.x, this.y] = init_pos;
		this.dragBehavior = d3.drag<SVGRectElement, any, any>()
			.on('drag', this._onDragDelegate.bind(this));
		this.dragHandle = parentGElm.append<SVGRectElement>("rect")
			.data([this,])
			.classed('dragbar-vertical', true)
			.attr("fill", "lightblue")
			.attr("fill-opacity", .5)
			.attr("cursor", "ew-resize")
			.call(this.dragBehavior);

		this._size = [size[0], size[1]];
		this.size(size[0], size[1]);
	}
	range(xMin: number, xMax: number) {
		if (arguments.length) {
			[this.xMin, this.xMax] = [xMin, xMax];
		} else {
			return [this.xMin, this.xMax];
		}
	}
	size(width: number, height: number) {
		if (arguments.length) {
			this._size = [width, height];
			if (width > 0 && height > 0) {
				this.dragHandle
					.attr("x", function (d) { return d.x - (width / 2); })
					.attr("y", function (d) { return d.y; })
					.attr("height", height)
					.attr("width", width);
			}
		} else {
			return this._size;
		}
	}
	_onDragDelegate(ev: d3.D3DragEvent<SVGRectElement, this, any>, d: this) {
		var width = this._size[0];
		var dragx = Math.max(
			this.xMin + (width / 2),
			Math.min(this.xMax, d.x + ev.dx + (width / 2))
		);
		this.x = dragx - (width / 2);
		this.dragHandle
			.attr("x", function (d) { return d.x });
		if (this._onDrag)
			this._onDrag(this);
	}
	onDrag(_onDrag?: (drag: DragBarVertical) => void) {
		if (arguments.length) {
			this._onDrag = _onDrag;
			return this;
		} else {
			return this._onDrag;
		}
	}
}