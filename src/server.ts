import {resolve} from 'path'
//@ts-ignore
import {outputFile, copy} from 'fs-extra'
import {fork, serialize, allSettled} from 'effector'
import {h, text, block, spec} from 'forest'
import {renderStatic} from 'forest/server'

import {
  // Body,
  app,
  sections,
  versionDates,
  clientState,
  setClientState
} from './app'
import {format} from 'prettier'
import {fetchData} from './fetchData'

const ClientScript = block({
  fn() {
    const clientStateString = clientState.map(state => JSON.stringify(state))
    h('script', () => {
      text`window.__INITIAL_STATE__ = ${clientStateString}`
    })
  }
})

const App = block({
  fn() {
    h('html', () => {
      h('head', () => {
        HTMLHead()
        ClientScript()
        h('script', {
          attr: {
            src: '/client.js',
            type: 'module',
            async: true
          }
        })
      })
      h('body', () => {
        // Body()
      })
    })
  }
})

async function generateStatic() {
  console.log('start')
  const data = await fetchData()

  const scope = fork(app, {
    values: new Map()
      .set(sections, data.sections)
      .set(versionDates, data.versionDates)
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

  const rendered = format(renderedRaw, {parser: 'html', printWidth: 60})

  console.log('output')
  await Promise.all([
    outputFile(resolve(__dirname, 'client', 'index.html'), rendered),
    copy(
      resolve(process.cwd(), 'src', 'assets'),
      resolve(__dirname, 'client', 'assets')
    )
  ])
  console.log('end')
}

generateStatic()

function HTMLHead() {
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
    content: 'Changelog for effector, effector-react and effector-vue releases'
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
    content: 'Changelog for effector, effector-react and effector-vue releases',
    property: true
  })
  h('link', {
    attr: {href: '/assets/src_styles_forest.css', rel: 'stylesheet'}
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
