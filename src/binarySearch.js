"use strict";

/**
 *
 * @param compareFn: example (a, b) => { return a - b; }
 * @param boundaryCheckFn: a function used to check array boundaris
 *        before main alg, example:
 *        function (ar, el) {
 *           if (el < ar[0]) { return 0; }
 *           if (el > ar[ar.length - 1]) { return ar.length; }
 *           return -1;
 *        }
 * 
 */
export function binarySearch (ar, el, compareFn, boundaryCheckFn) {
	if (ar.length === 0)
	   return -1;
	var res = boundaryCheckFn(ar, el);
	if (res >= 0)
	   return res;

    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1; // floor(n+m/2)
        var cmp = compareFn(el, ar[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if (cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return m - 1;
}
