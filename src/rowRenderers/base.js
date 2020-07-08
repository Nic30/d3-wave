
export class RowRendererBase {
	constructor(waveGraph) {
		this.waveGraph = waveGraph
	}
	select(typeInfo) {
		throw new Error("Should be overriden in class implementation");
	}
	render(parent, data, typeInfo, formatInfo) {
	}
}