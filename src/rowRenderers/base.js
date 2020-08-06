"use strict";

export class RowRendererBase {
    constructor (waveGraph) {
        this.waveGraph = waveGraph;
		this.FORMATTERS = {};
		this.DEFAULT_FORMAT = null;
	}
    /*eslint no-unused-vars: ["error", { "args": "none" }]*/
    select (typeInfo) {
        throw new Error('Should be overriden in class implementation');
    }
    render (parent, data, typeInfo, formatInfo) {
    }
}
