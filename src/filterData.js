
export function flattenSignals(sig, res) {
	if (sig.type === undefined) {
		return;
	}
	var t = sig.type.name;
	if (t == "struct") {
		res.push([sig.name, sig.type, []]);
		sig.data.forEach(function(ch) {
			flattenSignals(ch, res);
	    });
	} else {
		res.push([sig.name, sig.type, sig.data]);
	}
}


export function filterDataByTime(data, rowRange) {
    // return list ([time, value, duration])
     var min = rowRange[0];
     if (min < 0)
         throw new Error("min time has to be >= 0")
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
                    var prevVal = "bX";
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
                    var prevVal = "bX";
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
            var lastVal = "bX";
        }  else {
            var lastVal = last[1];
        }
        _data.push([min, lastVal, max])
    }
    
    return _data;
}
