"use strict";

export const TIME_UNITS = [
    [1, 'ps'],
    [1000, 'ns'],
    [1000000, 'us'],
    [1000000000, 'ms'],
    [1000000000000, 's']
];

export function createTimeFormatter (divider, unitName) {
    return function (d) {
        var v = d / divider;
        if (Number.isInteger(v)) {
            return v + ' ' + unitName;
        } 
        return v.toFixed(2) + ' ' + unitName;
    
    };
}

export function createTimeFormatterForTimeRange (timeRange) {
    timeRange = timeRange[1] - timeRange[0];
    var timeUnit = null;
    for (var i = 0; i < TIME_UNITS.length; i++) {
        var u = TIME_UNITS[i];
        if (timeRange < 1000 * u[0] || i === TIME_UNITS.length - 1) {
            timeUnit = u;
            break;
        }
    }
    return createTimeFormatter(timeUnit[0], timeUnit[1]);
}
