"use strict";

import {RowRendererBase} from './base.js';

export class RowRendererStruct extends RowRendererBase {
    select (typeInfo) {
        return typeInfo.name === 'struct';
    }
}
