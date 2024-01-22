import { WaveGraphSignalTypeInfo } from '../data';
import { RowRendererBase } from './base';

/**
 * Reneers nothig, it is used for hierarchical signals as a parent container.
 */
export class RowRendererStruct extends RowRendererBase {
	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'struct';
	}
}
