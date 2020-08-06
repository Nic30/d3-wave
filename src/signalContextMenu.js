"use strict";

import { contextMenu } from './d3-context-menu.js';

export function signalContextMenuInit(graph) {
	function contextMenuItems(d) {
		var formatOptions = [];
		var formatters = d.data.type.renderer.FORMATTERS;
		for (var key in formatters) {
			if (formatters.hasOwnProperty(key)) {
				function genFormatChanger(key) {
					return function() {
						d.data.type.formatter = formatters[key];
						graph.draw();
					}
				}
				formatOptions.push({
					title: key,
					action: genFormatChanger(key),
				});
			}
		}
		return [
			{
				title: 'Remove',
				action: function(data) {
					data.data.type.selected = true;
					graph.treelist.filter((d) => {
						return !d.type.selected;
					});
				}
			},
			{
				title: 'Format',
				children: formatOptions,
				disabled: formatOptions.length == 0,
			}];
	}

	return contextMenu(contextMenuItems);
}