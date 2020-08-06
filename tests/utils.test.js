"use strict";

import { filterDataByTime } from '../src/filterData.js';

describe('filterDataByTime cornercases', () => {
	let data0 = [[1, '1'], [2, '2'], [3, '3']];

    it('trivial select', function () {
		let res = filterDataByTime(data0, [1, 2]);
		let expected = [[1, '1', 1], [2, '2', 0],];
        expect(res).toStrictEqual(expected);
    });
    it('expand end', function () {
		let data1 = [[1, '1'], [2, '2'], [40, '3']];
		let res = filterDataByTime(data1, [1, 40]);
		let expected = [[1, '1', 1], [2, '2', 38], [40, '3', 0]];
        expect(res).toStrictEqual(expected);
    });
	it('cut end', function () {
		let data2 = [[1, '1'], [2, '2']];
		let res = filterDataByTime(data2, [1, 10]);
		let expected = [[1, '1', 1], [2, '2', 8], ];
        expect(res).toStrictEqual(expected);
    
	});
	it('cut end with reminder', function () {
		let data2 = [[1, '1'], [2, '2'], [11, '11']];
		let res = filterDataByTime(data2, [1, 10]);
		let expected = [[1, '1', 1], [2, '2', 8], ];
        expect(res).toStrictEqual(expected);
	});
});