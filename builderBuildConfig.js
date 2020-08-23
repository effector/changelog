import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

import {run} from './builder/runPlugin'

export default {
  input: 'generator.ts',
  cache: false,
  output: {
    file: './generator.js',
    format: 'commonjs',
    sourcemap: false
    // interop: false
  },
  onwarn(warning, rollupWarn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      rollupWarn(warning)
    }
  },
  preserveEntrySignatures: false,
  external: [
    'path',
    'child_process',
    'fs',
    'http',
    'https',
    'dotenv',
    'rollup',
    '@rollup/plugin-babel',
    '@rollup/plugin-node-resolve',
    '@rollup/plugin-replace',
    'rollup-plugin-postcss',
    '@rollup/plugin-alias',
    'stylis',
    '@babel/generator',
    '@babel/parser',
    '@babel/types',
    '@babel/traverse',
    '@babel/template',
    'mime',
    'opener'
  ],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts', '.mjs'],
      skipPreflightCheck: true
      // exclude: /(\.re|node_modules.*)/
    }),
    resolve({
      extensions: ['.mjs', '.js', '.ts', '.json']
    }),
    run()
  ]
}
