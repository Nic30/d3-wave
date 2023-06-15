import { binarySearch } from './binarySearch'
import { SignalDataValueTuple } from './data';

export function filterDataByTime(data: SignalDataValueTuple[], rowRange: [number, number]): SignalDataValueTuple[] {
	// return list ([time, value, duration])
	var min = rowRange[0];
	if (min < 0) { throw new Error('min time has to be >= 0'); }
	var max = rowRange[1];
	var _data: SignalDataValueTuple[] = [];

	function boundaryCheckFn(ar: SignalDataValueTuple[], el: SignalDataValueTuple) {
		if (el[0] < ar[0][0]) { return 0; }
		if (el[0] > ar[ar.length - 1][0]) { return ar.length; }
		return -1;
	}
	for (var i = binarySearch(data, [min, "", 0], (a, b) => { return a[0] - b[0]; }, boundaryCheckFn); i < data.length; i++) {
		if (i < 0)
			break;
		var d = data[i];
		var t = d[0];

		if (t < min) {
			// data before actual dataset
		} else if (t <= max) {
			let prev = data[i - 1];
			if (_data.length === 0 && t !== min) {
				// first data, unaligned
				let prevVal: any;
				if (!prev) {
					prevVal = 'bX';
				} else {
					prevVal = prev[1];
				}
				_data.push([min, prevVal, t - min]);
			}
			// normal data in range
			var next = data[i + 1];
			var nextTime;
			if (next) {
				nextTime = Math.min(max, next[0]);
			} else {
				nextTime = max;
			}

			_data.push([t, d[1], nextTime - t]);
		} else {
			if (_data.length === 0) {
				// selection range smaller than one data item
				let prev = data[i - 1];
				let prevVal: any;
				if (!prev) {
					prevVal = 'bX';
				} else {
					prevVal = prev[1];
				}
				_data.push([min, prevVal, max - min]);
			}
			// after selected range
			break;
		}
	}

	if (_data.length === 0) {
		// no new data after selected range
		var last = data[data.length - 1];
		var lastVal: any;
		if (!last) {
			lastVal = 'bX';
		} else {
			lastVal = last[1];
		}
		_data.push([min, lastVal, max - min]);
	}

	return _data;
}
