const definition = require('./package.json')
const dependencies = Object.keys(definition.dependencies)
import {nodeResolve} from '@rollup/plugin-node-resolve';


export default {
  input: 'index',
  external: dependencies,
  plugins: [
	nodeResolve({
    jsnext: true,
    module: true
  }),
  ],
  output: {
    extend: true,
    file: `dist/${definition.name}.js`,
    format: 'umd',
    globals: {
	  // lib name: name where lib exports itself on "window"
      "d3-drag"     : "d3", 
      "d3-shape"    : "d3",
      "d3-hierarchy": "d3",
      "d3-scale"    : "d3",
      "d3-zoom"     : "d3",
      "d3-axis"     : "d3",
      '@fortawesome/free-solid-svg-icons': 'free-solid-svg-icons',
    },
    name: 'd3'
  },
  onwarn: function(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return;
    }
    warn(warning);
  }
}
