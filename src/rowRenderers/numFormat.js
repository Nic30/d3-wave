"use strict";

const NUM_FORMATS = {
    'b': 2,
    'o': 8,
    'd': 10,
    'x': 16
};

function genFormatter (newBase) {
    return function (d) {
        if (typeof d === 'number') { return d.toString(newBase); }
		if (d === "X") { return d; }
        let baseChar = d[0];
        d = d.substring(1);
        let base = NUM_FORMATS[baseChar];
        if (base === newBase) { return d; }
        let containsX = d.indexOf('X') >= 0;
        if (containsX && newBase === 10) { return 'X'; }

        let origD = d;
        if (containsX) {
            d = d.replace(/X/g, '0');
        }

        let num = BigInt('0' + baseChar + d);
        num = num.toString(newBase);

        if (newBase === 2) { newBase = 1; }
        if (base === 2) { base = 1; }

        if (containsX) {
            let _num = [];
            for (let i = 0; i < num.length; i++) {
                _num.push(num[i]);
            }
            // set digits which are not valid to X
            if (base < newBase) {
                // e.g. bin -> hex
                let digitRatio = newBase / base;
                for (let i = 0; i < num.length; i++) {
                    let offset = i * digitRatio;
                    for (var i2 = 0; i2 < digitRatio; i2++) {
                        if (origD[offset + i2] === 'X') {
                            // invalidate corresponding digit if there was a X in original value
                            _num[i] = 'X';
                            break;
                        }
                    }
                }
            } else {
                // e.g. hex -> bin
                let digitRatio = base / newBase;
                for (let i = 0; i < origD.length; i++) {
                    if (origD[i] === 'X') {
                        let end = i * digitRatio;
                        // invalidate all corresponding digits if there was a X in original value
                        for (let i2 = i * digitRatio; i2 < end; i2++) {
                            _num[i2] = 'X';
                        }
                    }
                }
            }
            num = _num.join('');
        }

        return num;
    };
}

function genVectorFormatter(newBase) {
	var itemFormat = genFormatter(newBase);
	return function (d) {
		if (typeof d === 'string')
		   return itemFormat(d);
		// @param d: [[index list], value]
        var buff = [];
        var indexes = d[0];
        indexes.forEach(function (i) {
	       buff.push("[");
	       buff.push(i);
           buff.push("]"); 
        })
        buff.push("=");
        buff.push(itemFormat(d[1]));
        return buff.join("");
	}
}

export const SCALAR_FORMAT = {
    UINT_BIN: genFormatter(2),
    UINT_OCT: genFormatter(8),
    UINT_DEC: genFormatter(10),
    UINT_HEX: genFormatter(16),
};

export const VECTOR_FORMAT = {
    UINT_BIN: genVectorFormatter(2),
    UINT_OCT: genVectorFormatter(8),
    UINT_DEC: genVectorFormatter(10),
    UINT_HEX: genVectorFormatter(16)
};
