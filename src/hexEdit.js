"use strict";

import { SCALAR_FORMAT } from './rowRenderers/numFormat.js';
import { binarySearch } from './binarySearch.js';

/**
 * Returns an array with strings of the given size.
 *
 * @param str {String} string to split
 * @param chunkSize {Integer} Size of every group
 */
function chunkString(str, chunkSize) {
	return Array(Math.ceil(str.length / chunkSize)).fill().map(function(_, i) {
		return str.slice(i * chunkSize, i * chunkSize + chunkSize);
	});
}

export const PREVIEW_TYPE = {
	HEX_BYTES: function(d, size) {
		var res = SCALAR_FORMAT.UINT_HEX(d);
		var extend = '0';
		if (res[0] == 'X') {
			extend = 'X';
		}
		res = res.padStart(2 * size, extend);
		return chunkString(res, 2);
	},
	ASCII: "ASCII",
	...SCALAR_FORMAT,
};

function isPrintable(asciiCode) {
	return asciiCode >= 0x20 && asciiCode < 0x7f;
}
function asAscii(i) {
	return isPrintable(i) ? String.fromCharCode(i) : ".";
}

export class HexEdit {

	constructor(parent) {
		// view config
		this.addrRange = [0, 8 * 4];
		this.addrStep = 4;
		this.addrPos = 0;
		this.dataWordCellCnt = 4;
		// data
		this._data = null;
		this.currentData = [];
		this.currentTime = 0;
		this.dataCache = [];
		// html elements
		this.parent = parent;
		this.mainTable = null;
		this.dataAreas = []; // list of td elements in the rows which are displaying the data
	}
	/**
	* Get or set data to this viewer
	*/
	data(data) {
		if (arguments.length) {
			var w = data.type.width
			if (w.length != 2)
				throw new Error("NotImplemented");
			this.dataWordCellCnt = this.addrStep = Math.ceil(w[w.length - 1] / 8);
			this.addrRange = [0, w[0] * this.addrStep];
			this._data = data;
		} else {
			return this._data;
		}
	}
	// update select of data based on time
	setTime(newTime) {
		if (this.currentTime === newTime) { return; }
		// build currentData from update informations from data
		var cd = this.currentData;
		var t = this.currentTime;
		var data = this._data.data;
		var startI = 0;
		if (newTime > t) {
			// update current data
			startI = binarySearch(data, [t],
				(el0, el1) => { return el0[0] > el1[0]; },
				function(ar, el) {
					if (el < ar[0]) { return 0; }
					if (el > ar[ar.length - 1]) { return ar.length; }
					return -1;
				});
		} else {
			// create completly new data
			cd = this.currentData = [];
		}
		for (var i = startI; i < data.length && data[i][0] <= newTime; i++) {
			var d = data[i][1]; // [0] is time
			var addr = d[0];
			var d = d[1];
			cd[addr] = d;
		}
	}
	draw() {
		if (!this.mainTable) {
			var t = this.mainTable = this.parent.append("table")
			                                    .classed("d3-wave-hexedit", true);

			var inWordAddrTitles = [];
			for (var i = 0; i < this.dataWordCellCnt + 1; i++) {
				// the first one is padding for address column
				var title;
				if (i == 0) {
					title = "";
				} else {
					title = (i - 1).toString(16).padStart(2, "0");
				}
				inWordAddrTitles.push(title);
			}
			t.append("tr")
				.selectAll('td')
				.data(inWordAddrTitles).enter()
				.append('td')
				.classed("word-addr", true)
				.text(function(d) {
					return d;
				})

			this.dataAreas = [];
			var first = true;
			for (var a = this.addrRange[0]; a < this.addrRange[1]; a += this.addrStep) {
				// construct the rows of the table
				var tr = t.append("tr");
				// print first column with address
				tr.append("td")
					.classed("addr", true)
					.text("0x" + a.toString(16).padStart(2, "0"))
				if (first) {
					// first row contains the dell with data which spans over whole table
					// the data is in another table because we want to exclude the address
					// column from text selection in data area
					first = false;
					var da = tr.append("td")
					da.classed("data", true)
						.attr("colspan", this.dataWordCellCnt)
						.attr("rowspan", (this.addrRange[1] - this.addrRange[0]) / this.addrStep)
					this.dataAreas.push(da);
				}
			}
			var t = da.append("table");

			var da = this.dataAreas[0];
			var maxI = this.addrRange[1] / this.addrStep;
			for (var i = this.addrRange[0] / this.addrStep; i < maxI; i++) {
				var d = this.currentData[[i]];
				if (d === undefined) {
					d = "X";
				}
				var byteStrings = PREVIEW_TYPE.HEX_BYTES(d, this.dataWordCellCnt).reverse();
				t.append("tr")
					.selectAll("td")
					.data(byteStrings)
					.enter()
					.append("td")
					.classed("invalid", (d) => d.indexOf("X") >= 0)
					.text((d) => d);
			}

		}

	}
}
