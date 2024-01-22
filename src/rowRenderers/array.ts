import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, WaveGraphSignalTypeInfo } from '../data';
import { RowRendererBits } from './bits';
import { VECTOR_FORMAT } from './numFormat';

/**
 * A renderer for value rows with data of array type.
 * The record of data is of following format: [[<indexes>], <new value>]
 */
export class RowRendererArray extends RowRendererBits {
    constructor(waveGraph: WaveGraph) {
        super(waveGraph);
        this.FORMATTERS = VECTOR_FORMAT;
        this.DEFAULT_FORMAT = VECTOR_FORMAT.UINT_HEX as ((d: AnyWaveGraphValue) => string);
    }
    select(typeInfo: WaveGraphSignalTypeInfo) {
        return typeInfo.name === 'array';
    }
    isValid(d: any) {
        if (typeof d === 'string')
            return d.indexOf('X') < 0;
        else
            return d[1][1].indexOf('X') < 0;
    }
}