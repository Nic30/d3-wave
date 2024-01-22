import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo } from '../data';

export class RowRendererBase {
	waveGraph: WaveGraph;
	FORMATTERS: { [formatName: string]: (d: any) => string };
	DEFAULT_FORMAT?: string | ((d: AnyWaveGraphValue) => string);

	constructor(waveGraph: WaveGraph) {
		this.waveGraph = waveGraph;
		this.FORMATTERS = {};
		this.DEFAULT_FORMAT = undefined;
	}
	/*eslint no-unused-vars: ["error", { "args": "none" }]*/
	select(typeInfo: WaveGraphSignalTypeInfo): boolean {
		throw new Error('Should be overriden in class implementation');
	}

	render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)) {
		var waveRowHeight = this.waveGraph.sizes.row.height;
		// var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
		var waveRowX = this.waveGraph.waveRowX;
		
		if (!waveRowX)
			throw new Error("waveRowX on waveGraph must be initialized");
		
		parent
			.selectAll<SVGGElement, WaveGraphSignalTypeInfo>('.value-background')
			.remove()
			.exit()
			.data([typeInfo])
			.enter()
			.append<SVGRectElement>("rect")
			.attr('class', 'value-background')
			.attr('x', -2)
			.attr('width', this.waveGraph.sizes.width)
			.attr('height', waveRowHeight + 4)
			.classed('selected', (d) => !!d.isSelected)
	}
}
