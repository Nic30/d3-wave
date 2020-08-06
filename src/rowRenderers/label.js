"use strict";

import {RowRendererBase} from './base.js';

/**
 * A renderer for a label which poses no data and it is only a form of separator between value rows
 */
export class RowRendererLabel extends RowRendererBase {
    select (typeInfo) {
        return typeInfo.name === 'label';
    }
}
