// Adapted from https://github.com/rollup/rollup-starter-lib/
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
//import replace from 'rollup-plugin-replace'
import pkg from './package.json';
console.log(process.env.NODE_ENV);
export default [
	// browser-friendly UMD build
	{
		input: 'src/index.js',
		output:{
			name: 'nuls-js',
      file: pkg.browser,
      format: 'umd'
    },
		moduleName: pkg.name,
		plugins: [
			resolve(),
      // replace(),
      commonjs()
		]
	},

	{
		input: 'src/index.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		],
		plugins: [
      // replace()
    ]
	}
];
