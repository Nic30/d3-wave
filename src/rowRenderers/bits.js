"use strict";

import { RowRendererBase } from './base.js';
import { SCALAR_FORMAT } from './numFormat.js';

/**
 * A renderer for bit vector value rows.
 * Value is supposed to be a number or based string without leading 0 (eg. "x10" instead of "0x10" )
 */
export class RowRendererBits extends RowRendererBase {
	constructor(waveGraph) {
		super(waveGraph);
		this.FORMATTERS = SCALAR_FORMAT;
		this.DEFAULT_FORMAT = SCALAR_FORMAT.UINT_HEX;
	}
	
    select (typeInfo) {
        return typeInfo.name === 'wire' && typeInfo.width > 1;
    }
    isValid (d) {
        return d[1].indexOf('X') < 0;
    }
    /*eslint no-unused-vars: ["error", { "args": "none" }]*/
    render (parent, data, typeInfo, formatInfo) {
        var waveRowHeight = this.waveGraph.sizes.row.height;
        var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
        var waveRowX = this.waveGraph.waveRowX;

        var rect = parent.selectAll('g .value-rect')
            .remove()
            .exit()
            .data(data);

        var newRects = rect.enter()
            .append('g');
        var renderer = this;
        newRects.attr('transform', function (d) {
            var t = waveRowX(d[0]);
            return 'translate(' + [t, 0] + ')';
        })
 		.attr('class', function (d) {
            if (renderer.isValid(d)) {
                return 'value-rect value-rect-valid';
            } 
            return 'value-rect value-rect-invalid';
        })
		var x0 = waveRowX.domain()[0];
        // can not use index from d function because it is always 0
        newRects.append('path')
            .attr('d', function (d) {
                var duration = d[2];
                var right = waveRowX(x0 + duration);
                var top = waveRowHeight;
                if (right < 0) {
                    throw new Error([right, d]);
                }
                //  <==> like shape
                var edgeW = 2;
                return 'M ' + [0, top / 2] +
               ' L ' + [edgeW, top] +
               ' L ' + [right - edgeW, top] +
               ' L ' + [right, top / 2] +
               ' L ' + [right - edgeW, 0] +
               ' L ' + [edgeW, 0] + ' Z';
            });


        // can not use index from d function because it is always 0
        newRects.append('text')
            .attr('x', function (d) {
                var duration = d[2];
                var x = waveRowX(x0 + duration / 2);
                if (x < 0) { throw new Error(x); }
                return x;
            })
            .attr('y', waveRowHeight / 2 + waveRowYpadding)
            .text(function (d) {
				var fontSize = window.getComputedStyle(this).fontSize;
				if (fontSize === "") {
					// default font size
					fontSize = 16;
				} else if (fontSize.substr(fontSize.length - 2) !== "px") {
					throw new Error(fontSize);
				} else {
					fontSize = Number(fontSize.substr(0, fontSize.length - 2));
				}
				var formatedText = formatInfo(d[1]);
				var duration = d[2];
				var width = waveRowX(x0 + duration) - waveRowX(x0);
				if (width < 0) {
					throw new Error([x0, duration, width]);
				}
				if (formatedText.length * fontSize > width) {
					var chars = Math.ceil(width/fontSize);
					return formatedText.substr(0, chars);
				}
				return formatedText;
            });
	
    }
}
