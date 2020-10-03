"use strict";

import * as d3 from 'd3';


export class Tooltip {
	constructor(tooltipHtmlGetter) {
		if (!tooltipHtmlGetter)
			tooltipHtmlGetter = (d) => d.tooltip;
		this.tooltipHtmlGetter = tooltipHtmlGetter;
		this.tooltipDiv = d3.select('body').append('div')
			.attr('class', 'd3-wave tooltip')
			.style('opacity', 0)
			.style('display', 'none');
	}
	addToElm(selection) {
		var tooltipDiv = this.tooltipDiv;
		var tooltipHtmlGetter = this.tooltipHtmlGetter;
		return selection.on('mouseover', function(ev, d) {
			tooltipDiv.transition()
				.duration(200)
				.style('display', 'block')
				.style('opacity', 0.9);
			var tootipHtml = tooltipHtmlGetter(d)
			tooltipDiv.html(tootipHtml)
				.style('left', (ev.pageX) + 'px')
				.style('top', (ev.pageY - 28) + 'px');
		})
		.on('mouseout', function() {
			tooltipDiv.transition()
				.duration(500)
				.style('opacity', 0)
				.style('display', 'none');
		});
	}	
}