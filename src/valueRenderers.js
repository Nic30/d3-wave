import * as d3 from "d3";

export const T_BIT = "bit"
export const T_ENUM = "enum"
export const T_BITS = "bits"

export function renderBitLine(parent, data, signalWidth, waveRowHeight, waveRowYpadding, waveRowX, waveRowY){
	var lastInvalid = null
	var linePoints = []
	var invalidRanges = []
	data.forEach(function(d) {
		if (d[1].indexOf('x') >= 0) {
			invalidRanges.push(d)
		} else {
			var v = Number.parseInt(d[1])
			linePoints.push([d[0], v])
			linePoints.push([d[0] + d[2], v])
		}
	})
	
    console.log("data", data)
    //console.log("linePoints", linePoints)
    //console.log("invalidRanges", invalidRanges)
    var line = d3.line()
    	     .x(function(d) {
    	          return waveRowX(d[0]);
    	      })
    	     .y(function(d) {
    	    	 return waveRowY(d[1])
    	      })
    	      .curve(d3.curveStepAfter)
		
    // wave line
    parent.attr("clip-path", "url(#clip)")
    var lines = parent.selectAll("path")
                      .data([linePoints])
    lines.enter().append("path")
          .attr("class", "value-line")
          .merge(lines)
          .attr("d", line)

	
	// Add the scatterplot for invalid values
	parent.selectAll("rect")
	 .remove()
	 .exit()
	 .data(invalidRanges)
	 .enter()
     .append('g')
	 .attr("class", "value-rect-invalid")
	 .append("rect")						
	 .attr("height", waveRowHeight - waveRowYpadding)
	 .attr("width",  function (d){ 
		               return waveRowX(waveRowX.domain()[0] + d[2]) 
	  })
	 .attr("x", function(d) { 
		 			return waveRowX(d[0]) 
	  })		 
	 .attr("y", function(d) { 
		            return waveRowY(0) - waveRowHeight + waveRowYpadding 
	  })
}

export function renderBitsLine(parent, data, signalWidth, waveRowHeight,
		                waveRowYpadding, waveRowX, waveRowY) {
	var waveRowHeight = 20
	var waveRowYpadding = 5
    var rect = parent.selectAll("g .value-rect")
                     .remove()
	                 .exit()
                     .data(data);
	
	var newRects = rect.enter()
	                   .append("g")
    var rectG = newRects
                  .attr("transform", function(d) {
				    return "translate(" + 
				    		[waveRowX(d[0]) ,
				    		(waveRowY(0) - waveRowHeight + waveRowYpadding)]
				    		+ ")";
				  }).attr("class", function(d){ 
                        if(d[1].indexOf('x') < 0) {
                           return "value-rect value-rect-valid"
                        } else {
                           return "value-rect value-rect-invalid"
                        }
		           })

    // can not use index from d function because it is always 0
    newRects.append("path")
       .attr("d", function(d) {
    	 var duration = d[2];
	     var right = waveRowX(waveRowX.domain()[0] + duration);
	     var top = waveRowHeight;
	     if (right < 0) {
	        throw new Error([right, d])
	     }
	 	 //  <==> like shape
         var edgeW = 2
	 	 return 'M '+ [0, top/2] + 
	 	         ' L ' + [edgeW, top] + 
	 	         ' L '+ [right - edgeW, top] + 
	 	         ' L '+ [right, top/2] +
	 	         ' L '+ [right - edgeW, 0] + 
	 	         ' L '+ [edgeW, 0] +' Z'
	    })
    
    // can not use index from d function because it is always 0
    newRects.append("text")
	   .text(function(d) {
		   return d[1]
	   })
	   .attr("x", function (d){ 
		   var duration = d[2]
		   var x = waveRowX(waveRowX.domain()[0] + duration / 2);
		   if (x < 0)
		      throw new Error(x)
		   return x
	   })
	   .attr("y", (waveRowHeight) / 2 +  waveRowYpadding)

}

export function filterData(data, rowRange) {
	// return list ([time, value, duration])
	 var min = rowRange[0];
	 if (min < 0)
		 throw new Error("min time has to be > 0")
	 var max = rowRange[1];
	 var _data = [];

	for (var i = 0; i < data.length; i++) {
		var d = data[i];
		var t = d[0];

		if (t < min) {
			// data before actual dataset
		} else if (t <= max) {
			var prev = data[i - 1]
			if (_data.length == 0 && t != min) {
				// first data, unaligned
				if (!prev) {
					var prevVal = "x";
				}  else {
					var prevVal = prev[1];
				}
				_data.push([min, prevVal, d[0] - min])
			}
			// normal data in range
			var next = data[i + 1]
			if (next) {
				var nextTime = next[0];
			} else {
				var nextTime = max;
			}
			
			_data.push([d[0], d[1], nextTime - d[0]]);
		} else {
			if (_data.length == 0) {
				// selection range smaller than one data item
				var prev = data[i - 1]
				if (!prev) {
					var prevVal = "x";
				}  else {
					var prevVal = prev[1];
				}
				_data.push([min, prevVal, max])
			}
			// after selected range
			break;
		}
	}
	
	if (_data.length == 0) {
		// no new data after selected range
		var last = data[data.length - 1]
		if (!last) {
			var lastVal = "x";
		}  else {
			var lastVal = last[1];
		}
		_data.push([min, lastVal, max])
	}
	
	return _data;
}

export function renderWaveRow(indx, signalType, data, graph, parent){
	var waveRowHeight = graph.sizes.row.height;
	var waveRowYpadding = graph.sizes.row.ypadding;
	var waveRowX = graph.waveRowX;
	var waveRowY = d3.scaleLinear()
	                 .domain([0, 1])
	                 .range([(waveRowHeight + waveRowYpadding)
	                	      * (indx + 1) - waveRowYpadding,
	                	     (waveRowHeight + waveRowYpadding)
	                	      * indx + waveRowYpadding] );
    data = filterData(data, graph.sizes.row.range)
	if (signalType.name === T_BIT){
		var signalWidth = 1
		renderBitLine(parent, data, signalWidth, waveRowHeight, waveRowYpadding,
				      waveRowX, waveRowY)
	} else {
		 renderBitsLine(parent, data, signalType.width, waveRowHeight, waveRowYpadding, 
				        waveRowX, waveRowY)
	}
}

