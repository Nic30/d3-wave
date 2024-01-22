import { RowRendererBase } from './base';
import { SCALAR_FORMAT } from './numFormat';
import type { WaveGraph } from '../waveGraph';
import type { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo } from '../data';

/**
 * A renderer for bit vector value rows.
 * Value is supposed to be a number or based string without leading 0 (eg. "x10" instead of "0x10" )
 */
export class RowRendererBits extends RowRendererBase {
	constructor(waveGraph: WaveGraph) {
		super(waveGraph);
		this.FORMATTERS = SCALAR_FORMAT;
		this.DEFAULT_FORMAT = SCALAR_FORMAT.UINT_HEX as ((d: AnyWaveGraphValue) => string);
	}

	select(typeInfo: WaveGraphSignalTypeInfo) {
		return typeInfo.name === 'wire' && typeInfo.width as number > 1;
	}
	isValid(d: any) {
		return d[1].indexOf('X') < 0;
	}
	/*eslint no-unused-vars: ["error", { "args": "none" }]*/
	render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)) {
		super.render(parent, data, typeInfo, formatter);
		var waveRowHeight = this.waveGraph.sizes.row.height;
		var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
		var waveRowX = this.waveGraph.waveRowX;
		if (!waveRowX)
			throw new Error("waveRowX on waveGraph must be initialized");
		if (!formatter || typeof formatter === 'string')
			throw new Error("Unsupported formater");

		var rect = parent.selectAll('g .value-rect')
			.remove()
			.exit()
			.data(data);

		var newRects = rect.enter()
			.append('g');
		var renderer = this;
		newRects
			.attr('transform', function (d: SignalDataValueTuple) {
				if (!waveRowX)
					throw new Error("waveRowX on waveGraph must be initialized");
				var t = waveRowX(d[0]);
				return 'translate(' + [t, 0] + ')';
			})
			.attr('class', function (d: SignalDataValueTuple) {
				if (renderer.isValid(d)) {
					return 'value-rect value-rect-valid';
				}
				return 'value-rect value-rect-invalid';
			})
		var x0 = waveRowX.domain()[0];
		// can not use index from d function because it is always 0
		newRects.append('path')
			.attr('d', function (d: SignalDataValueTuple) {
				var duration = d[2];
				if (!waveRowX)
					throw new Error("waveRowX on waveGraph must be initialized");
				var right = waveRowX(x0 + duration);
				var top = waveRowHeight;
				if (right < 0) {
					throw new Error(`${right}, ${d}`);
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
			.attr('x', function (d: SignalDataValueTuple) {
				var duration = d[2];
				if (!waveRowX)
					throw new Error("waveRowX on waveGraph must be initialized");
				var x = waveRowX(x0 + duration / 2);
				if (x < 0) { throw new Error(x.toString()); }
				return x;
			})
			.attr('y', waveRowHeight / 2 + waveRowYpadding)
			.text(function (d: SignalDataValueTuple) {
				let fontSizeStr = window.getComputedStyle(this).fontSize;
				let fontSize = NaN;
				if (fontSizeStr === "") {
					// default font size
					fontSize = 16;
				} else if (fontSizeStr.substr(fontSizeStr.length - 2) !== "px") {
					throw new Error(fontSizeStr);
				} else {
					fontSize = Number(fontSizeStr.substr(0, fontSizeStr.length - 2));
				}
				var formatedText = formatter(d[1]);
				var duration = d[2];
				if (!waveRowX)
					throw new Error("waveRowX on waveGraph must be initialized");
				var width = waveRowX(x0 + duration) - waveRowX(x0);
				if (width < 0) {
					throw new Error(`${x0}, ${duration}, ${width}`);
				}
				if (formatedText.length * fontSize > width) {
					var chars = Math.ceil(width / fontSize);
					return formatedText.substr(0, chars);
				}
				return formatedText;
			});

	}
}
