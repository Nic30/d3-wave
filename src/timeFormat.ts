import * as d3 from 'd3';

export const TIME_UNITS: [number, string][] = [
	[1, 'ps'],
	[1000, 'ns'],
	[1000000, 'us'],
	[1000000000, 'ms'],
	[1000000000000, 's']
];

export function createTimeFormatter(divider: number, unitName: string) {
	return function(d: d3.NumberValue, i: number) {
		var v = d as number / divider;
		if (Number.isInteger(v)) {
			return v + ' ' + unitName;
		}
		return v.toFixed(2) + ' ' + unitName;

	};
}

export function createTimeFormatterForTimeRange(timeRange: [number, number]): (d: d3.NumberValue, i: number) => string {
	const _timeRange = timeRange[1] - timeRange[0];
	for (var i = 0; i < TIME_UNITS.length; i++) {
		var u = TIME_UNITS[i];
		if (_timeRange < 1000 * u[0] || i === TIME_UNITS.length - 1) {
			return createTimeFormatter(u[0], u[1]);
		}
	}
	throw new Error("Time out of range of defined units");
}
