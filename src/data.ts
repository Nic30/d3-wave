import type { RowRendererBase } from "./rowRenderers/base";

export type NumbericDataValue = string | number;
export type NumbericDataVectorValue = string | [number[], NumbericDataValue];
export type AnyWaveGraphValue = NumbericDataValue | NumbericDataVectorValue;
export type SignalDataValueTuple = [number, AnyWaveGraphValue, number]; // start time, value, duration

export class WaveGraphSignalTypeInfo {
	name: string;
	width?: number | number[]; // width for bit vectors or sequence of array sizes ending with width of bit vector elements in this array
	formatter?: string | ((d: AnyWaveGraphValue) => string); // string constant or function which specifies how the renderer should format values
	renderer: RowRendererBase | undefined;
	isSelected?: boolean; // specifies if the signal row was selected in GUI, used for highglight and manipulation
	
	constructor(name: string, width: number | undefined) {
		this.name = name;
		this.width = width;
	}
};

/**
 * Class for signal data which is used as an input to the signal wave graph. 
 */
export class WaveGraphSignal {
	name: string;
	type: WaveGraphSignalTypeInfo;
	data: SignalDataValueTuple[];
	children?: WaveGraphSignal[];
	_children?: WaveGraphSignal[];

	constructor(name: string, type: WaveGraphSignalTypeInfo, data: SignalDataValueTuple[],
		children: WaveGraphSignal[] | undefined = undefined, expanded: boolean = true) {
		this.name = name;
		this.type = type;
		this.data = data;
		if (expanded) {
			this.children = children;
		} else {
			this.children = children;
		}

	}
};
