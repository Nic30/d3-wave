import { RowRendererBase } from './base.js';
import {shape, line, curveStepAfter} from 'd3-shape';
const d3 = {shape, curveStepAfter, line};

export class RowRendererBit extends RowRendererBase {
    select (typeInfo) {
        return typeInfo.name === 'wire' && typeInfo.width === 1;
    }

    render (parent, data, typeInfo, formatInfo) {
        var waveRowHeight = this.waveGraph.sizes.row.height;
        // var waveRowYpadding = this.waveGraph.sizes.row.ypadding;
        var waveRowX = this.waveGraph.waveRowX;
        var waveRowY = this.waveGraph.waveRowY;

        var linePoints = [];
        var invalidRanges = [];
        data.forEach(function (d) {
            if (d[1].indexOf('X') >= 0) {
                invalidRanges.push(d);
            } else {
                var v = Number.parseInt(d[1]);
                linePoints.push([d[0], v]);
                linePoints.push([d[0] + d[2], v]);
            }
        });

        var line = d3.line()
            .x(function (d) {
                return waveRowX(d[0]);
            })
            .y(function (d) {
                return waveRowY(d[1]);
            })
            .curve(d3.curveStepAfter);

        // wave line
        parent.attr('clip-path', 'url(#clip)');
        var lines = parent.selectAll('path')
            .data([linePoints]);
        lines.enter()
            .append('path')
            .attr('class', 'value-line')
            .merge(lines)
            .attr('d', line);

        // Add the scatterplot for invalid values
        parent.selectAll('rect')
            .remove()
            .exit()
            .data(invalidRanges)
            .enter()
            .append('g')
            .attr('class', 'value-rect-invalid')
            .append('rect')
            .attr('height', waveRowHeight)
            .attr('width', function (d) {
                return waveRowX(waveRowX.domain()[0] + d[2]);
            })
            .attr('x', function (d) {
                return waveRowX(d[0]);
            })
            .attr('y', function () {
                return waveRowY(0);
            });
    }
}
