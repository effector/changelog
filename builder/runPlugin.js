import {fork} from 'child_process'
import {resolve, dirname, join} from 'path'

export function run(opts = {}) {
  let input
  let proc

  const args = opts.args || []
  const forkOptions = opts.options || opts
  delete forkOptions.args
  forkOptions.serialization = 'advanced'
  return {
    name: 'run',

    buildStart(options) {
      let inputs = options.input

      if (typeof inputs === 'string') {
        inputs = [inputs]
      }

      if (typeof inputs === 'object') {
        inputs = Object.values(inputs)
      }

      if (inputs.length > 1) {
        throw new Error(
          `@rollup/plugin-run only works with a single entry point`
        )
      }

      input = resolve(inputs[0])
    },

    generateBundle(_outputOptions, _bundle, isWrite) {
      if (!isWrite) {
        this.error(
          `@rollup/plugin-run currently only works with bundles that are written to disk`
        )
      }
    },

    async writeBundle(outputOptions, bundle) {
      const dir = outputOptions.dir || dirname(outputOptions.file)
      const entryFileName = Object.keys(bundle).find(fileName => {
        const chunk = bundle[fileName]
        return chunk.isEntry && chunk.facadeModuleId === input
      })

      if (entryFileName) {
        if (proc) proc.kill()
        const {child, req} = runBundle(dir, entryFileName, args, forkOptions)
        proc = child
        await req
      } else {
        this.error(`@rollup/plugin-run could not find output chunk`)
      }
    }
  }
}

function runBundle(dir, entryFileName, args, forkOptions) {
  const prc = fork(join(dir, entryFileName), args, forkOptions)
  prc.on('message', msg => {
    console.log('message', msg)
  })
  const req = new Promise(rs => {
    prc.on('exit', code => {
      if (code) console.warn('exited with code', code)
      rs()
    })
  })
  return {child: prc, req}
}
