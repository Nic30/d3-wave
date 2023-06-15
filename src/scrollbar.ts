import * as d3 from 'd3';
import { HierarchyNodeWaveGraphSignalWithXYId } from './treeList';

/**
 * Implementation of SVG based scrollbar component which has a histogram like columns which are showing the
 * depth of the items in signal list.  
 */
export class Scrollbar {
    barHeight: number;
    selectorWidth: number;
    _onDrag: ((startPerc: number) => void) | null;
    scrollbarG: d3.Selection<SVGGElement, any, any, any>;
    moverElm: d3.Selection<SVGRectElement, null, SVGGElement, any>|null;
    width: number;
    height: number;
    _isScrollDisplayed: boolean;
    flatenedData: HierarchyNodeWaveGraphSignalWithXYId[];
    maxDepth: number;
    _startPerc: number;

    constructor( barHeight: number, _scrollbarG: d3.Selection<SVGGElement, any, any, any>) {
        this.barHeight = barHeight;
        this.selectorWidth = 20;
        this._onDrag = null;
        this.scrollbarG = _scrollbarG;
        this.moverElm = null;
        this.width = 0;
        this.height = 0;
        this._isScrollDisplayed = false;
        this.flatenedData = [];
        this.maxDepth = -1;
        this._startPerc = 0.0;

    }
    onDrag(fn: ((startPerc: number) => void) | null) {
		if (arguments.length) {
			this._onDrag = fn;
			return this;
		}
		return this._onDrag;
	};
    render()  {
        if (this._isScrollDisplayed) {
            var numBars = Math.round(this.height / this.barHeight);
            var xOverview = d3.scaleLinear()
                .domain([0, this.maxDepth + 1])
                .range([0, this.selectorWidth]);
            var yOverview = d3.scaleLinear()
                .domain([0, this.flatenedData.length])
                .range([0, this.height]);
            var subBars = this.scrollbarG.selectAll<SVGRectElement, HierarchyNodeWaveGraphSignalWithXYId>('.subBar')
                .data(this.flatenedData);
            const _this = this;
            
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
                    return _this.width - _this.selectorWidth;
                })
                .attr('y', function (d, i) {
                    return yOverview(i);
                });

            // dragable rect representing currently viewed window
            if (!this.moverElm) {
                this.moverElm = this.scrollbarG.selectAll('.mover')
                    .data([null])
                    .enter()
                    .append('rect');
            }

            this.moverElm
                .classed('mover', true)
                .attr('transform', 'translate(' + (this.width - this.selectorWidth) + ',0)')
                .attr('class', 'mover')
                .attr('x', 0)
                .attr('y', this._startPerc * this.height)
                .attr('height', Math.round((numBars / this.flatenedData.length) * this.height))
                .attr('width', this.selectorWidth);
            
            this.moverElm.call(d3.drag<SVGRectElement, null>().on('drag', function (ev) {
                var moverElm = d3.select(this);
                var y = parseInt(moverElm.attr('y'));
                var ny = y + ev.dy;
                var h = parseInt(moverElm.attr('height'));

                if (ny < 0 || ny + h > _this.height) {
                    // out of range
                    return;
                }
                moverElm.attr('y', ny);
                _this._startPerc = ny / _this.height;
                if (_this._onDrag) {
                    _this._onDrag(_this._startPerc);
                }
            }));
        } else {
            this.moverElm = null;
            this.scrollbarG.selectAll('*').remove();
        }
    
    }
    registerWheel(elm: d3.Selection<any, any, any, any>) {
        const _this = this;
        elm.on('wheel', function (ev) {
            if (!_this.moverElm)
                return;
            var step = ev.deltaY > 0 ? 1 : -1;
            ev.preventDefault();
            ev.stopPropagation();
            var y = parseInt(_this.moverElm.attr('y'));
            var ny = Math.max(0, y + _this.barHeight * step);
            var h = parseInt(_this.moverElm.attr('height'));

            if (ny < 0 || ny + h > _this.height) {
                // out of range
                return;
            }
            _this.moverElm.attr('y', ny);
            _this._startPerc = ny / _this.height;
            if (_this._onDrag) {
                _this._onDrag(_this._startPerc);
            }
        });
        return this;
    };
    size(_width: number, _height: number) {
        this.width = _width;
        this.height = _height;
        if (!Number.isFinite(this.height)) {
            throw new Error('Can not resolve height of scrollbar');
        }
        if (!Number.isFinite(this.width)) {
            throw new Error('Can not resolve width of scrollbar');
        }
        this.isScrollDisplayed();
        if (this.scrollbarG) {
            // redraw on size change
            this.render();
        }
        if (this._onDrag) {
	        this._onDrag(this._startPerc);
	    }
        return this;
    }
    isScrollDisplayed() {
        if (this.flatenedData) { this._isScrollDisplayed = this.barHeight * this.flatenedData.length > this.height; }
        return this._isScrollDisplayed;
    }
    data(_flatenedData:HierarchyNodeWaveGraphSignalWithXYId[], _maxDepth: number) {
        this.flatenedData = _flatenedData;
        this.maxDepth = _maxDepth;
        this.isScrollDisplayed();
        if (this.scrollbarG) {
            // redraw on size change
            this.render();
        }
        return this;
    }
    startPerc() {
        return this._startPerc;
    }
}