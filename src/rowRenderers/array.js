"use strict";

import { RowRendererBits } from './bits.js';
import { VECTOR_FORMAT } from './numFormat.js';

/**
 * A renderer for value rows with data of array type.
 * The record of data is of following format: [[<indexes>], <new value>]
 */
export class RowRendererArray extends RowRendererBits {
	constructor(waveGraph) {
		super(waveGraph);
		this.FORMATTERS = VECTOR_FORMAT;
		this.DEFAULT_FORMAT = VECTOR_FORMAT.UINT_HEX;
	}
    select (typeInfo) {
        return typeInfo.name === 'array';
    }
    isValid (d) {
	    if (typeof d === 'string')
            return d.indexOf('X') < 0;
        else
            return d[1][1].indexOf('X') < 0;
    }
}