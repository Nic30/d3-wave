import {RowRendererBase} from "./base.js";

export class RowRendererBits extends RowRendererBase {
	select(typeInfo) {
		return typeInfo.name === "wire" && typeInfo.width > 1;
	}
    isValid(d) {
	    return d[1].indexOf('X') < 0;
    }
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
        var renderer = this;
		newRects.attr("transform", function(d) {
			var t = waveRowX(d[0]);
			return "translate(" + [t, 0] + ")";
		}).attr("class", function(d) { 
			if(renderer.isValid(d)) {
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
