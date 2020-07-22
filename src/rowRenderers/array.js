"use strict";

import { RowRendererBits } from './bits.js';

export class RowRendererArray extends RowRendererBits {
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