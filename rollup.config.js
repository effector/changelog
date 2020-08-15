require('dotenv').config()

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import postcss from 'rollup-plugin-postcss'
// import livereload from 'rollup-plugin-livereload'
import run from '@rollup/plugin-run'
// import alias from '@rollup/plugin-alias'
import {terser} from 'rollup-plugin-terser'

import {PROJECT} from './builder/env'
import {extractCss} from './builder/extractCssPlugin'
import {html} from './builder/htmlPlugin'

const watch = process.env.ROLLUP_WATCH === 'true'
const prod = process.env.NODE_ENV === 'production'

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
      // 'forest',
      // 'forest/server',
      'prettier',
      'fs-extra',
      'cross-fetch',
      'pacote',
      'path'
    ],
    plugins: [
      // alias({
      //   entries: {
      //     'forest/server.mjs': './src/npm/forest/server.mjs',
      //     'forest/server': './src/npm/forest/server.mjs',
      //     forest: './src/npm/forest/forest.mjs',
      //     'effector/effector.mjs': './src/npm/effector/effector.mjs',
      //     effector: './src/npm/effector/effector.mjs'
      //   }
      // }),
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
        extensions: ['.mjs', '.js', '.ts', '.json']
      }),
      postcss({
        extract: false,
        plugins: []
      }),
      html({
        publicPath: '/',
        cdn: 'changelog-asset.effector.dev'
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
      sourcemap: false,
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
      // 'forest/server',
      'prettier',
      'fs-extra',
      'cross-fetch',
      'pacote',
      'path'
    ],
    plugins: [
      // alias({
      //   entries: {
      //     'forest/server.mjs': './src/npm/forest/server.mjs',
      //     'forest/server': './src/npm/forest/server.mjs',
      //     forest: './src/npm/forest/forest.mjs',
      //     'effector/effector.mjs': './src/npm/effector/effector.mjs',
      //     effector: './src/npm/effector/effector.mjs'
      //   }
      // }),
      replace({
        'process.env.GITHUB_GQL_TOKEN': `"hidden"`
      }),
      extractCss({project: PROJECT}),
      babel({
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts', '.mjs'],
        skipPreflightCheck: true
        // exclude: /(\.re|node_modules.*)/
      }),
      resolve({
        extensions: ['.mjs', '.js', '.ts', '.json']
      }),
      postcss({
        extract: true,
        plugins: []
      }),
      prod && import('rollup-plugin-terser').then(({terser}) => terser()),
      watch &&
        import('rollup-plugin-serve').then(({default: serve}) =>
          serve('dist/client')
        )
      // watch && livereload()
    ]
  }
]
