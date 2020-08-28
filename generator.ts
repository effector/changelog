require('dotenv').config()

import {rollup, watch as rollupWatch} from 'rollup'

import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import postcss from 'rollup-plugin-postcss'
// import alias from '@rollup/plugin-alias'

import {PROJECT} from './builder/env'
import {extractCss} from './builder/extractCssPlugin'
import {html} from './builder/htmlPlugin'
import {serve} from './builder/servePlugin'
import {run} from './builder/runPlugin'

const watch = process.env.ROLLUP_WATCH === 'true'
const prod = process.env.NODE_ENV === 'production'
const GITHUB_GQL_TOKEN = process.env.GITHUB_GQL_TOKEN || 'no token'
const USE_SPA = process.env.USE_SPA === 'true'

const fullConfig = [
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
        'process.env.GITHUB_GQL_TOKEN': `"${GITHUB_GQL_TOKEN}"`,
        'process.env.USE_SPA': `"${USE_SPA}"`
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
        'process.env.GITHUB_GQL_TOKEN': `"hidden"`,
        'process.env.USE_SPA': `"${USE_SPA}"`
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
      // prod && import('rollup-plugin-terser').then(({terser}) => terser()),
      //@ts-ignore
      watch && serve({contentBase: 'dist/client', livereload: true})
    ]
  }
]
runGenerator()
async function runGenerator() {
  if (watch) {
    //@ts-ignore
    const watcher = rollupWatch(fullConfig)
    watcher.on('event', event => {
      // event.code can be one of:
      //   START        — the watcher is (re)starting
      //   BUNDLE_START — building an individual bundle
      //   BUNDLE_END   — finished building a bundle
      //   END          — finished building all bundles
      //   ERROR        — encountered an error while bundling
      // console.log('watcher event', event)
    })
  } else {
    console.log('generate bundles')
    const [serverBundle, clientBundle] = await Promise.all([
      //@ts-ignore
      rollup(fullConfig[0]),
      //@ts-ignore
      rollup(fullConfig[1])
    ])
    console.log('generate outputs')
    const [serverOutput, clientOutput] = await Promise.all([
      //@ts-ignore
      serverBundle.write(fullConfig[0].output),
      //@ts-ignore
      clientBundle.write(fullConfig[1].output)
    ])
    console.log('complete')
  }
}
