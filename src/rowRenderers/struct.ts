import { WaveGraphSignalTypeInfo } from '../data.js';
import { RowRendererBase } from './base.js';

/**
 * Reneers nothig, it is used for hierarchical signals as a parent container.
 */
export class RowRendererStruct extends RowRendererBase {
	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'struct';
	}
}
