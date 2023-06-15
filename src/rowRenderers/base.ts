import type { WaveGraph } from '../d3-wave';
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
	}
}
