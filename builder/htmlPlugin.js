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
  template: defaultTemplate,
  cdn: null
}

export function html(opts = {}) {
  const {fileName, publicPath, template, cdn} = Object.assign(
    {},
    defaults,
    opts
  )

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
        cdn,
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
        const fullPath = createPath({cdn, publicPath, fileName})
        switch (extension) {
          case 'css':
            bundleDef.styles.push(fullPath)
            break
          case 'js':
            bundleDef.scripts.push(fullPath)
            break
          default:
            bundleDef.assets.push(fullPath)
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

function createPath({cdn: cdnRaw, publicPath: publicPathRaw, fileName}) {
  let cdn = ''
  let publicPath = ''
  if (cdnRaw) {
    if (!cdnRaw.endsWith('/')) cdnRaw = `${cdnRaw}/`
    if (cdnRaw.startsWith('http') || cdnRaw.startsWith('/')) {
      cdn = cdnRaw
    } else {
      cdn = `//${cdnRaw}`
    }
  }
  if (publicPathRaw) {
    if (publicPathRaw === '/') {
      publicPath = cdn ? '' : publicPathRaw
    } else {
      if (publicPathRaw.startsWith('/') && cdn) {
        publicPathRaw = publicPathRaw.slice(1)
      }
      if (!publicPathRaw.endsWith('/')) {
        publicPathRaw = `${publicPathRaw}/`
      }
      publicPath = publicPathRaw
    }
  }
  return `${cdn}${publicPath}${fileName}`
}
