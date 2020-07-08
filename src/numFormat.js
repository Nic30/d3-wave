
const NUM_FORMATS = {
		'b': 2,
		'o': 8,
		'd': 10,
		'x': 16
};

function gen_formater(new_base) {
	return function (d) {
		if (typeof d == "number")
			return d.toString(new_base);
		var base_char = d[0];
		var d = d.substring(1);
		var base = NUM_FORMATS[base];
		if (base == new_base)
			return d;
		var contains_x = d.indexOf('X') >= 0;
		if (new_base == 10)
			return "X";

		var orig_d = d;
		if (contains_x) {
			d = d.replace(/X/g, "0");
		}
		
		var num = BigInt("0" + base_char + d); 
		var num = num.toString(new_base);
		
		if (new_base == 2)
			new_base = 1;
		if (base == 2)
			base = 1;

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