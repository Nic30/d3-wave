import { RowRendererBits } from './bits';
import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, WaveGraphSignalTypeInfo } from '../data';

export const STRING_FORMAT: { [formatName: string]: (d: AnyWaveGraphValue) => string } = {
	"STRING": (d: AnyWaveGraphValue) => d.toString(),
}

/**
 * A renderer for enum value rows, enum value is a string, "" is resolved as invalid value
 * and is rendered with red color
 */
export class RowRendererEnum extends RowRendererBits {
	constructor(waveGraph: WaveGraph) {
		super(waveGraph);
		this.FORMATTERS = STRING_FORMAT;
		this.DEFAULT_FORMAT = STRING_FORMAT.STRING;
	}
	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'enum';
	}
	isValid(d: any) {
		return d[1] !== '';
	}
}
