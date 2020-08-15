import {extname} from 'path'

const defaultTemplate = async ({bundleDef: {publicPath, styles, scripts}}) => {
  const scriptTags = scripts
    .map(fileName => `<script src="${publicPath}${fileName}"></script>`)
    .join('\n')

  const styleTags = styles
    .map(fileName => `<link href="${publicPath}${fileName}" rel="stylesheet">`)
    .join('\n')

  return `
<!doctype html>
<html>
  <head>
    ${styleTags}
  </head>
  <body>
    ${scriptTags}
  </body>
</html>`
}

const defaults = {
  fileName: 'index.html',
  publicPath: '',
  template: defaultTemplate
}

export function html(opts = {}) {
  const {fileName, publicPath, template} = Object.assign({}, defaults, opts)

  return {
    name: 'html',
    async generateBundle(output, bundle) {
      let scriptType = null
      if (output.format === 'esm' || output.format === 'es') {
        scriptType = 'module'
      }

      const bundleDef = {
        scriptType,
        publicPath,
        scripts: [],
        styles: [],
        assets: []
      }
      const fileDefs = Object.values(bundle).filter(
        file => file.isEntry || file.type === 'asset'
      )
      const files = {}
      for (const file of fileDefs) {
        const {fileName} = file
        const extension = extname(fileName).substring(1)
        if (!files[extension]) files[extension] = []
        files[extension].push(file)
        switch (extension) {
          case 'css':
            bundleDef.styles.push(fileName)
            break
          case 'js':
            bundleDef.scripts.push(fileName)
            break
          default:
            bundleDef.assets.push(fileName)
        }
      }
      const source = await template({
        bundleDef
      })

      this.emitFile({
        type: 'asset',
        source: JSON.stringify(bundleDef, null, 2),
        name: 'bundle definition',
        fileName: 'bundleDef.json'
      })

      // this.emitFile({
      //   type: 'asset',
      //   source,
      //   name: 'html asset',
      //   fileName
      // })
    }
  }
}
