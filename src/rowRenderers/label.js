"use strict";

import {RowRendererBase} from './base.js';

export class RowRendererLabel extends RowRendererBase {
    select (typeInfo) {
        return typeInfo.name === 'enum';
    }
}
