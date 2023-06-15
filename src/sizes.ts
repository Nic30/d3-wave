
export class WaveGraphSizesRow {
	// currently used time range
	range: [number, number];
	height: number;
	ypadding: number;
	constructor() {
		this.range = [0, 1];
		this.height = 20;
		this.ypadding = 5;
	}
}

export class WaveGraphSizesMargin {
	top: number;
	right: number;
	bottom: number;
	left: number;
	constructor() {
		this.top = 20;
		this.right = 20;
		this.bottom = 20;
		this.left = 180;
	}
}

export class WaveGraphSizes {
	row: WaveGraphSizesRow;
	margin: WaveGraphSizesMargin;
	dragWidth: number;
	width: number;
	height: number;
	constructor() {
		this.row = new WaveGraphSizesRow();
		this.margin = new WaveGraphSizesMargin();
		this.dragWidth = 5;
		this.width = -1;
		this.height = -1;
	}
};
