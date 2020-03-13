// Adapted from https://github.com/rollup/rollup-starter-lib/
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
//import replace from 'rollup-plugin-replace'
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
		output:{
			name: pkg.name,
      file: pkg.browser,
      format: 'umd'
    },
		plugins: [
			resolve({
				browser: true
			}),
      // replace(),
	    commonjs(),
			json()
		]
	},

	{
		input: 'src/index.js',
		external: [
			'ms',
			'@cityofzion/neon-core',
			'@cityofzion/neon-js',
			'axios'
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
		plugins: [ ]
	}
];
