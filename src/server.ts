import {resolve} from 'path'
//@ts-ignore
import {outputFile, copy, readFile} from 'fs-extra'
import {fork, serialize, allSettled, restore} from 'effector'
import {h, block, spec, list} from 'forest'
import {renderStatic} from 'forest/server'

import {app} from './root'
import {changelogMarkdown, versionDates, Body} from './app'
import {format} from 'prettier'
import {fetchData} from './fetchData'

const USE_SPA = process.env.USE_SPA === 'true'

const basePath = USE_SPA ? '' : '//changelog-asset.effector.dev'

const setClientState = app.createEvent<any>()
const clientState = restore(setClientState, {})

const styles = app.createStore<string[]>([])
const scripts = app.createStore<string[]>([])

const ClientScript = block({
  fn() {
    const clientStateString = clientState.map(state => JSON.stringify(state))
    h('script', {
      attr: {id: 'initial_state', type: 'application/json'},
      text: clientStateString
    })
  }
})

const HTMLHead = block({
  fn() {
    h('title', {
      text: 'Effector changelog'
    })
    h('meta', {
      attr: {charset: 'utf-8'}
    })
    Meta('viewport', {
      content: [
        'width=device-width',
        // 'user-scalable=no',
        'initial-scale=1',
        // 'maximum-scale=1'
        'viewport-fit=cover'
      ].join(', ')
    })
    Meta('apple-mobile-web-app-capable', {
      content: 'yes'
    })
    Meta('apple-mobile-web-app-status-bar-style', {
      content: 'black'
    })
    Meta('apple-mobile-web-app-title', {
      content: 'Effector changelog'
    })
    Meta('description', {
      content:
        'Changelog for effector, effector-react and effector-vue releases'
    })
    Meta('application-name', {
      content: 'changelog'
    })
    Meta('theme-color', {
      content: '#120309'
    })
    Meta('twitter:card', {
      content: 'summary'
    })
    Meta('og:title', {
      content: 'Effector changelog',
      property: true
    })
    Meta('og:type', {
      content: 'website',
      property: true
    })
    Meta('og:url', {
      content: 'https://changelog.effector.dev',
      property: true
    })
    Meta('og:description', {
      content:
        'Changelog for effector, effector-react and effector-vue releases',
      property: true
    })
    list(styles, ({store}) => {
      const href = store.map(fileName =>
        createPath({
          cdn: basePath,
          publicPath: '/',
          fileName
        })
      )
      h('link', {
        attr: {
          href,
          rel: 'stylesheet'
        }
      })
    })
    h('link', {
      attr: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: 'https://editor-prod.effector.dev/apple-touch-icon.png'
      }
    })
    h('link', {
      attr: {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: 'https://editor-prod.effector.dev/favicon-32x32.png'
      }
    })
    h('link', {
      attr: {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: 'https://editor-prod.effector.dev/favicon-16x16.png'
      }
    })
    h('link', {
      attr: {
        rel: 'shortcut icon',
        href: 'https://editor-prod.effector.dev/favicon.ico'
      }
    })
  }
})

function createPath({
  cdn: cdnRaw,
  publicPath: publicPathRaw,
  fileName
}: {
  cdn: string | null
  publicPath?: string | null
  fileName: string
}) {
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

const App = block({
  fn() {
    h('html', () => {
      h('head', () => {
        HTMLHead()
      })

      h('body', () => {
        if (!USE_SPA) {
          Body()
        }
        ClientScript()
        list(scripts, ({store}) => {
          const src = store.map(fileName =>
            createPath({
              cdn: basePath,
              publicPath: '/',
              fileName
            })
          )
          h('script', {
            attr: {
              src,
              type: 'module',
              async: true
            }
          })
        })
      })
    })
  }
})

function Meta(
  name: string,
  {content, property = false}: {content; property?: boolean}
) {
  h('meta', {
    attr: {content},
    fn() {
      if (property) {
        spec({attr: {property: name}})
      } else {
        spec({attr: {name}})
      }
    }
  })
}

async function readBundleDef(): Promise<{
  scripts: string[]
  styles: string[]
  assets: string[]
}> {
  const raw = await readFile(
    resolve(__dirname, 'client', 'bundleDef.json'),
    'utf8'
  )
  return JSON.parse(raw)
}

async function generateStatic() {
  console.log('start')
  const [data, bundleDef] = await Promise.all([fetchData(), readBundleDef()])
  const scope = fork(app, {
    values: new Map()
      .set(changelogMarkdown, data.changelogContent)
      .set(versionDates, data.versionDates)
      .set(styles, bundleDef.styles)
      .set(scripts, bundleDef.scripts)
  })

  const serialized = serialize(scope, {
    onlyChanges: true
  })
  await allSettled(setClientState, {
    params: serialized,
    scope
  })

  console.log('render')
  const renderedRaw = await renderStatic({
    scope,
    fn: App
  })

  let rendered = renderedRaw
  if (USE_SPA) {
    console.log('format')
    rendered = format(renderedRaw, {parser: 'html', printWidth: 120})
  }

  console.log('output')
  await Promise.all([
    outputFile(resolve(__dirname, 'client', 'index.html'), rendered),
    outputFile(resolve(__dirname, 'content', 'index.html'), rendered),
    copy(
      resolve(process.cwd(), 'src', 'assets'),
      resolve(__dirname, 'client', 'assets')
    )
  ])
  console.log('end')
  if (process.send) {
    // process.send({type: 'result', value: 'foo'})
  }
}

// if (!USE_SPA) {
generateStatic()
// }
