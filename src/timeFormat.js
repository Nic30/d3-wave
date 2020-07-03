export const TIME_UNITS = [
	[1, "ps"],
	[1000, "ns"],
	[1000000, "us"],
	[1000000000, "ms"],
	[1000000000000, "s"],
];

export function create_time_formater(divider, unit_name) {
	return function(d) {
		var v = d / divider;
		if (Number.isInteger(v)) {
			return v + " " + unit_name;
		} else {
			return  v.toFixed(2) + " " + unit_name;
		}
	}
}

export function create_time_formater_for_time_range(time_range) {
   	time_range = time_range[1] - time_range[0];
	var time_unit = null;
    for (var i = 0; i < TIME_UNITS.length; i++) {
    	var u = TIME_UNITS[i];
    	if (time_range < 1000 * u[0] || i == TIME_UNITS.length - 1) {
    		time_unit = u;
    		break;
    	}
    }
    return create_time_formater(time_unit[0], time_unit[1]);
}