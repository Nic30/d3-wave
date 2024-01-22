import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';

const production = false; //!process.env.ROLLUP_WATCH

export default {
	input: 'index.ts',
	external: ['@fortawesome/free-solid-svg-icons', 'd3'],
	plugins: [
		resolve({
			preventAssignment: true,
			jsnext: true,
			module: true,
		}),
		postcss({
			extensions: ['.css'],
		}),
		typescript({ sourceMap: !production, inlineSources: !production })
	],
	output: {
		extend: true,
		file: `dist/d3-wave.js`,
		sourcemap: !production,
		// https://dev.to/remshams/rolling-up-a-multi-module-system-esm-cjs-compatible-npm-library-with-typescript-and-babel-3gjg
		format: 'umd', // "ECMAScript Modul" (esm), "CommonJs" (cjs) and "Asynchronous Module Definition" (AMD)
		globals: {
			// lib name: name where lib exports itself on "window"
			"d3": "d3",
			'@fortawesome/free-solid-svg-icons': 'free-solid-svg-icons',
		},
		name: 'd3'
	}
}
