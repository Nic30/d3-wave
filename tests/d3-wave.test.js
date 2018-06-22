import WaveGraph from '../src/d3-wave';

var d3 = require("d3");

describe('{unit}: Testing wave rendering', () => {
  var svg = d3.select("body")
    .append("svg");

  svg.attr("width", 500)
    .attr("height", 500);  

  var wave = new WaveGraph(svg);
  it("SVG has root g", function() {
	  var gs = svg.selectAll("g");
	  expect(gs.size()).toBe(1);
  });
  
});