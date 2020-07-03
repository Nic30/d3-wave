const NUM_FORMATS = {
		'b': 2,
		'o': 8,
		'd': 10,
		'x': 16
};

function gen_formater(new_base) {
	return function (d) {
		var base = d[0];
		var d = d.substring(1);
		base = NUM_FORMATS[base];
		if (base == new_base)
			return d;
		var contains_x = d.indexOf('X') >= 0;
		if (new_base == 10)
			return "X";

		var orig_d = d;
		if (contains_x) {
			d = d.replace("X", "0");
		}
		
		var num = parseInt(d, base); 
		if(num > Number.MAX_SAFE_INTEGER) {
			throw new Error("NotImplemented: integer larger than 53 bits");
		}
		var num = num.toString(new_base);
		
		
		if (new_base == 2)
			new_base = 1;
		if (base == 2)
			base = 2;

		if (contains_x) {
			var _num = [];
			for (var i = 0; i < num.length; i++) {
				_num.push(num[i]);
			}
			// set digits which are not valid to X
			if (base < new_base) {
				// e.g. bin -> hex
				var digit_ratio = new_base / base;
				for (var i = 0; i < num.length; i++) {
					var offset = i * digit_ratio;
					for (var i2 = 0; i2 < digit_ratio; i2++) {
						if (orig_d[offset + i2] == "X") {
							// invalidate corresponding digit if there was a X in original value
							_num[i] = "X";
							break
						}
					}
				}
			} else {
				// e.g. hex -> bin
				var digit_ratio = base / new_base;
				for (var i = 0; i < orig_d.length; i++) {
					if (orig_d[i] == "X") {
						var end = i * digit_ratio;
						// invalidate all corresponding digits if there was a X in original value
						for (var i2 = i * digit_ratio; i2 < end; i2++) {
							_num[i2] = "X";
						}
					}
				}
			}
			num = _num.join("");
		}
		
		return num;
	}
}

export const SCALAR_FORMAT = {
	UINT_BIN: gen_formater(2),
	UINT_OCT: gen_formater(8),
	UINT_DEC: gen_formater(10),
	UINT_HEX: gen_formater(16),
};

export class RowRendererBits {
	constructor(waveGraph) {
		this.waveGraph = waveGraph
	}
	select(typeInfo) {
		return typeInfo.name === "wire" && typeInfo.width > 1;
	};

	render(parent, data, typeInfo, formatInfo) {
	 	var waveRowHeight = this.waveGraph.sizes.row.height;
		var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
		var waveRowX = this.waveGraph.waveRowX;

		var rect = parent.selectAll("g .value-rect")
		     .remove()
		     .exit()
		     .data(data);
		
		var newRects = rect.enter()
		       			   .append("g");
		newRects.attr("transform", function(d) {
			var t = waveRowX(d[0]);
			return "translate(" + [t, 0] + ")";
		}).attr("class", function(d) { 
			if(d[1].indexOf('X') < 0) {
				return "value-rect value-rect-valid";
			} else {
				return "value-rect value-rect-invalid";
			}
		});

		// can not use index from d function because it is always 0
		newRects.append("path")
			    .attr("d", function(d) {
				    var duration = d[2];
				    var right = waveRowX(waveRowX.domain()[0] + duration);
				    var top = waveRowHeight;
				    if (right < 0) {
				    	throw new Error([right, d])
				    };
					//  <==> like shape
					var edgeW = 2
					return 'M '+ [0, top/2] + 
					  ' L ' + [edgeW, top] + 
					  ' L '+ [right - edgeW, top] + 
					  ' L '+ [right, top/2] +
					  ' L '+ [right - edgeW, 0] + 
					  ' L '+ [edgeW, 0] + ' Z';
				});
		
		// can not use index from d function because it is always 0
		newRects.append("text")
				.text(function(d) {
					// skip base
					return formatInfo(d[1]);
				})
				.attr("x", function (d){ 
					var duration = d[2]
					var x = waveRowX(waveRowX.domain()[0] + duration / 2);
					if (x < 0)
						throw new Error(x);
					return x;
				})
				.attr("y", waveRowHeight / 2 +  waveRowYpadding)
	}
}
