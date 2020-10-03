"use strict";

import * as d3 from 'd3';

export function scrollbar (barHeight) {
    let selectorWidth = 20;
    let onDrag = null;
    let scrollbarG;
    let moverElm;
    let width;
    let height;
    let isScrollDisplayed;
    let flatenedData;
    let maxDepth;
    let startPerc = 0.0;

    var _scrollbar = function (_scrollbarG) {
        scrollbarG = _scrollbarG;
        if (isScrollDisplayed) {
            var numBars = Math.round(height / barHeight);
            var xOverview = d3.scaleLinear()
                .domain([0, maxDepth + 1])
                .range([0, selectorWidth]);
            var yOverview = d3.scaleLinear()
                .domain([0, flatenedData.length])
                .range([0, height]);
            var subBars = scrollbarG.selectAll('.subBar')
                .data(flatenedData);

            subBars.exit().remove();
            // small rectangles in scroll preview representing the values on that posssion
            subBars.enter()
                .append('rect')
                .classed('subBar', true)
                .merge(subBars)
                .attr('height', function () {
                    return yOverview(1);
                })
                .attr('width', function (d) {
                    return xOverview(d.depth + 1);
                })
                .attr('x', function () {
                    return width - selectorWidth;
                })
                .attr('y', function (d, i) {
                    return yOverview(i);
                });

            // dragable rect representing currently viewed window
            if (!moverElm) {
                moverElm = scrollbarG.selectAll('.mover')
                    .data([null])
                    .enter()
                    .append('rect');
            }

            moverElm
                .classed('mover', true)
                .attr('transform', 'translate(' + (width - selectorWidth) + ',0)')
                .attr('class', 'mover')
                .attr('x', 0)
                .attr('y', startPerc * height)
                .attr('height', Math.round((numBars / flatenedData.length) * height))
                .attr('width', selectorWidth);

            moverElm.call(d3.drag().on('drag', function (ev) {
                var moverElm = d3.select(this);
                var y = parseInt(moverElm.attr('y'));
                var ny = y + ev.dy;
                var h = parseInt(moverElm.attr('height'));

                if (ny < 0 || ny + h > height) {
                    // out of range
                    return;
                }
                moverElm.attr('y', ny);
                startPerc = ny / height;
                if (onDrag) {
                    onDrag(startPerc);
                }
            }));
        } else {
            moverElm = null;
            scrollbarG.selectAll('*').remove();
        }
        return _scrollbar;
    };
    _scrollbar.onDrag = function (fn) {
        if (arguments.length) {
            onDrag = fn;
            return _scrollbar;
        } 
        return onDrag;
    
    };
    _scrollbar.registerWheel = function (elm) {
        elm.on('wheel', function (ev) {
            var step = ev.deltaY > 0 ? 1 : -1;
            ev.preventDefault();
            ev.stopPropagation();
            var y = parseInt(moverElm.attr('y'));
            var ny = Math.max(0, y + barHeight * step);
            var h = parseInt(moverElm.attr('height'));

            if (ny < 0 || ny + h > height) {
                // out of range
                return;
            }
            moverElm.attr('y', ny);
            startPerc = ny / height;
            if (onDrag) {
                onDrag(startPerc);
            }
        });
    };
    _scrollbar.size = function (_width, _height) {
        if (!arguments.length) { return [width, height]; }
        width = _width;
        height = _height;
        if (!Number.isFinite(height)) {
            throw new Error('Can not resolve height of scrollbar');
        }
        if (!Number.isFinite(width)) {
            throw new Error('Can not resolve width of scrollbar');
        }
        _scrollbar.isScrollDisplayed();
        if (scrollbarG) {
            // redraw on size change
            _scrollbar(scrollbarG);
        }
        if (onDrag) { 
	        onDrag(startPerc);
	    }
        return _scrollbar;
    };
    _scrollbar.isScrollDisplayed = function () {
        if (flatenedData) { isScrollDisplayed = barHeight * flatenedData.length > height; }
        return isScrollDisplayed;
    };
    _scrollbar.data = function (_flatenedData, _maxDepth) {
        flatenedData = _flatenedData;
        maxDepth = _maxDepth;
        _scrollbar.isScrollDisplayed();
        if (scrollbarG) {
            // redraw on size change
            _scrollbar(scrollbarG);
        }
        return _scrollbar;
    };
    _scrollbar.startPerc = function () {
        return startPerc;
    };

    return _scrollbar;
}
