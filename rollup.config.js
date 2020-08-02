require('dotenv').config()

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import postcss from 'rollup-plugin-postcss'

import {ENTRY, PROJECT} from './builder/env'
import {extractCss} from './builder/extractCssPlugin'

export default {
  input: ENTRY,
  cache: false,
  output: {
    dir: './dist',
    format: 'commonjs',
    sourcemap: true,
    interop: false
  },
  onwarn(warning, rollupWarn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      rollupWarn(warning)
    }
  },
  preserveEntrySignatures: false,
  external: [
    'forest',
    'forest/server',
    'prettier',
    'fs-extra',
    'cross-fetch',
    'pacote',
    'path'
  ],
  plugins: [
    replace({
      'process.env.GITHUB_GQL_TOKEN': `"${
        process.env.GITHUB_GQL_TOKEN || 'no token'
      }"`
    }),
    extractCss({project: PROJECT}),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts', '.mjs'],
      skipPreflightCheck: true
      // exclude: /(\.re|node_modules.*)/
    }),
    resolve({
      extensions: ['.js', '.ts', '.mjs', '.json']
    }),
    postcss({
      extract: true,
      plugins: []
    })
  ]
}
