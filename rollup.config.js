const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const copy = require('rollup-plugin-copy');

module.exports = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/pkce-utils.esm.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/pkce-utils.umd.js',
        format: 'umd',
        name: 'PkceUtils',
        sourcemap: true,
      },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      copy({
        targets: [
          // To allow for source maps
          { src: 'src/**/*.ts', dest: 'dist/src' },
        ],
      }),
    ],
  },
];