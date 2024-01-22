import { describe, expect, it } from '@jest/globals';

import { filterDataByTime } from '../src/filterData';
import { SignalDataValueTuple } from '../src/data';


describe('filterDataByTime cornercases', () => {
    let data0: SignalDataValueTuple[] = [[1, '1', 1], [2, '2', 1], [3, '3', 1]];

    it('trivial select', function() {
        let res = filterDataByTime(data0, [1, 2]);
        let expected = [[1, '1', 1], [2, '2', 0],];
        expect(res).toStrictEqual(expected);
    });
    it('expand end', function() {
        let data1: SignalDataValueTuple[] = [[1, '1', 1], [2, '2', 38], [40, '3', 1]];
        let res = filterDataByTime(data1, [1, 40]);
        let expected = [[1, '1', 1], [2, '2', 38], [40, '3', 0]];
        expect(res).toStrictEqual(expected);
    });
    it('cut end', function() {
        let data2: SignalDataValueTuple[] = [[1, '1', 1], [2, '2', 10]];
        let res = filterDataByTime(data2, [1, 10]);
        let expected = [[1, '1', 1], [2, '2', 8],];
        expect(res).toStrictEqual(expected);

    });
    it('cut end with reminder', function() {
        let data2: SignalDataValueTuple[] = [[1, '1', 1], [2, '2', 1], [11, '11', 10]];
        let res = filterDataByTime(data2, [1, 10]);
        let expected = [[1, '1', 1], [2, '2', 8],];
        expect(res).toStrictEqual(expected);
    });
});