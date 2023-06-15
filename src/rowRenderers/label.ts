import { WaveGraphSignalTypeInfo } from '../data';
import { RowRendererBase } from './base';
/**
 * A renderer for a label which poses no data and it is only a form of separator between value rows
 */
export class RowRendererLabel extends RowRendererBase {
	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'label';
	}
}
