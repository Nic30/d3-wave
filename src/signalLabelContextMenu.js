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
						var newFormatter = formatters[key];
						d.data.type.formatter = newFormatter;
						var currentRenderrer = d.data.type.renderer;
						graph.treelist.visibleNodes().forEach(function(d) {
							if (d.data.type.selected && d.data.type.renderer === currentRenderrer) {
								d.data.type.formatter = newFormatter;
							}
						});
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