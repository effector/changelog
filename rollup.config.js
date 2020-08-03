require('dotenv').config()

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'
// import livereload from 'rollup-plugin-livereload'
import run from '@rollup/plugin-run'

import {PROJECT} from './builder/env'
import {extractCss} from './builder/extractCssPlugin'

const watch = process.env.ROLLUP_WATCH === 'true'

export default [
  {
    input: 'src/server.ts',
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
        extract: false,
        plugins: []
      }),
      run()
      // watch && livereload()
    ]
  },
  {
    input: 'src/client.ts',
    cache: false,
    output: {
      dir: './dist/client',
      format: 'esm',
      sourcemap: true,
      interop: false,
      assetFileNames: 'assets/[name][extname]'
      // assetFileNames: 'assets/[name]-[hash][extname]'
    },
    onwarn(warning, rollupWarn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        rollupWarn(warning)
      }
    },
    preserveEntrySignatures: false,
    external: [
      // 'forest',
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
      }),
      watch && serve('dist/client')
      // watch && livereload()
    ]
  }
]
