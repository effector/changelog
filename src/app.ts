import {h, spec, DOMProperty, AttributeStore} from 'forest'

import {AstToken, extractText} from './mdParser'

import {USE_UNIQUE_ID, MANY_LINES, LARGE_ARTICLE} from './env'
import {VersionDate} from './index.h'

import './styles'

type ReleaseNote = {
  version: string
  library: 'effector' | 'react' | 'vue'
  content: AstToken[]
  manyLines: boolean
  largeArticle: boolean
}

export function App(sections: AstToken[][], versionDates: VersionDate[]) {
  const ids = new Map<string, number>()

  h('html', () => {
    h('head', () => {
      HTMLHead()
    })
    h('body', () => {
      Body()
    })
  })

  function getId(title: string) {
    title = formatId(title)
    if (!ids.has(title) || !USE_UNIQUE_ID) {
      ids.set(title, 1)
      return title
    }
    const id = ids.get(title)
    ids.set(title, id + 1)
    return `${title}-${id}`
  }
  function queryVersionDate(library: string, version: string) {
    const versions = version.match(/(\d+\.\d+\.\d+(-[a-z]+[a-z0-9.]*)?)/g)
    const results = [] as Array<{version: string; date: number}>
    for (const version of versions) {
      const versionDate = versionDates.find(
        e => e.library === library && e.version === version
      )
      if (!versionDate) {
        console.warn(`no version info found for ${library} ${version}`)
        continue
      }
      const {date} = versionDate
      results.push({
        version,
        date
      })
    }
    return results
  }
  function Body() {
    const releases = [] as ReleaseNote[]
    for (const releaseNotesAst of sections) {
      const titleText = extractText([releaseNotesAst[0]]).join('')
      const effReactMentioned = /effector\-react/.test(titleText)
      const effVueMentioned = /effector\-vue/.test(titleText)
      const effectorMentioned = /effector(?!\-)/.test(titleText)
      const content = releaseNotesAst.slice(1)
      const textContent = extractText(content, {
        skipNodes: ['code'],
        keepLineBreaks: true
      }).join('')
      const manyLines = textContent.split(/\n/g).length > MANY_LINES
      const largeArticle = textContent.length > LARGE_ARTICLE
      // console.log({
      //   title: titleText,
      //   content: textContent.length,
      //   lines: textContent.split(/\n/g).length,
      //   manyLines,
      //   largeArticle
      // })
      if (effectorMentioned && !effVueMentioned && !effReactMentioned) {
        releases.push({
          version: titleText.replace('effector', '').trim(),
          library: 'effector',
          content,
          manyLines,
          largeArticle
        })
      } else if (!effectorMentioned && !effVueMentioned && !effReactMentioned) {
        releases.push({
          version: titleText,
          library: 'effector',
          content,
          manyLines,
          largeArticle
        })
      } else {
        if (effectorMentioned) {
          const versionMatcher = /(?<=effector[^-]).*?(\d+\.\d+\.\d+(-\d+\.\d+\.\d+)?)/gm
          const [, version] = versionMatcher.exec(titleText)
          releases.push({
            version: version,
            library: 'effector',
            content,
            manyLines,
            largeArticle
          })
        }
        if (effReactMentioned) {
          const versionMatcher = /(?<=effector-react).*?(\d+\.\d+\.\d+)/gm
          const [, version] = versionMatcher.exec(titleText)
          releases.push({
            version: version,
            library: 'react',
            content,
            manyLines,
            largeArticle
          })
        }
        if (effVueMentioned) {
          const versionMatcher = /(?<=effector-vue).*?(\d+\.\d+\.\d+)/gm
          const [, version] = versionMatcher.exec(titleText)
          releases.push({
            version: version,
            library: 'vue',
            content,
            manyLines,
            largeArticle
          })
        }
      }
    }
    const effectorReleases = releases.filter(
      ({library}) => library === 'effector'
    )
    const reactReleases = releases.filter(({library}) => library === 'react')
    const vueReleases = releases.filter(({library}) => library === 'vue')

    h('div', {
      data: {fillTop: true},
      attr: {'aria-hidden': 'true'},
      text: '.'
    })
    h('section', {
      data: {releaseList: true, appSection: 'docs'},
      fn() {
        h('header', () => {
          h('h1', {
            data: {headLink: 1},
            text: 'Changelog'
          })
        })
        h('nav', {
          data: {releaseGroupNav: true},
          fn() {
            h('a', {
              attr: {href: `#${formatId('effector')}`},
              text: 'effector'
            })
            h('a', {
              attr: {href: `#${formatId('effector-react')}`},
              text: 'effector-react'
            })
            h('a', {
              attr: {href: `#${formatId('effector-vue')}`},
              text: 'effector-vue'
            })
          }
        })
        ReleaseGroup('effector', effectorReleases)
        ReleaseGroup('effector-react', reactReleases)
        ReleaseGroup('effector-vue', vueReleases)
      }
    })
  }
  function ReleaseGroup(name: string, releases: ReleaseNote[]) {
    const releaseGroupId = getId(name)
    HiddenLink(name, true)
    h('section', {
      data: {releaseGroup: true},
      fn() {
        h('header', () => {
          h('h2', {
            data: {headLink: 2},
            fn() {
              h('a', {
                attr: {href: `#${releaseGroupId}`},
                text: name
              })
            }
          })
        })
        for (const {version, content, manyLines, largeArticle} of releases) {
          const id = getId(`${name} ${version}`)
          const {date} = queryVersionDate(name, version)[0]
          const dateString = new Date(date).toLocaleDateString(['en-US'], {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          const dateISO = new Date(date).toISOString()
          HiddenLink(`${name} ${version}`)
          h('article', {
            data: {release: true, manyLines, largeArticle},
            fn() {
              h('header', () => {
                h('h3', {
                  data: {headLink: 3},
                  fn() {
                    h('a', {
                      attr: {href: `#${id}`},
                      text: version
                    })
                  }
                })
                h('time', {
                  attr: {datetime: dateISO},
                  text: dateString
                })
              })
              content.forEach(renderToken)
            }
          })
        }
      }
    })
  }
  function HiddenLink(name: string, groupLink: boolean = false) {
    h('a', {
      data: {anchor: groupLink ? 'group' : 'release'},
      attr: {
        id: getId(name),
        'aria-hidden': 'true'
      },
      text: ' '
    })
  }

  function renderToken(token: AstToken) {
    switch (token.type) {
      case 'strong':
      case 'em':
      case 'del':
      case 'blockquote':
        h(token.type, () => {
          token.child.forEach(renderToken)
        })
        break
      case 'br':
      case 'hr':
        h(token.type, () => {})
        break
      case 'codespan':
        h('code', {
          text: token.value
        })
        break
      case 'paragraph':
        h('p', {
          data: {mdElement: 'paragraph'},
          fn() {
            token.child.forEach(renderToken)
          }
        })
        break
      case 'space':
        h('span', {
          text: ' '
        })
        break
      case 'text':
      case 'escape':
      case 'tag':
      case 'html':
        h('span', {
          text: token.value
        })
        break
      case 'heading':
        //@ts-ignore
        h(`h${token.level}`, {
          data: {headLink: token.level},
          fn() {
            const id = getId(extractText(token.child).join(''))
            h('a', {
              attr: {href: `#${id}`},
              fn() {
                token.child.forEach(renderToken)
              }
            })
          }
        })
        break
      case 'link': {
        let {title, href} = token
        if (title != null) throw Error('not supported')
        if (href == null || href === '') {
          console.count('link without href')
        }
        if (href.endsWith('.md')) href = `#${href.replace('.md', '')}`
        else if (href.endsWith('.MD')) href = `#${href.replace('.MD', '')}`
        else if (/\.md\#/.test(href)) {
          href = href.replace(/\.md\#/, '#')
        } else if (/\.MD\#/.test(href)) {
          href = href.replace(/\.MD\#/, '#')
        }
        h('a', {
          attr: {href},
          fn() {
            token.child.forEach(renderToken)
          }
        })
        break
      }
      case 'code':
        // h('pre', () => {
        //   data({element: 'code'})
        //   h('code', () => {
        //     text(token.value)
        //   })
        // })
        break
      case 'list': {
        const htmlTag = token.ordered ? 'ol' : 'ul'
        h(htmlTag, {
          data: {mdElement: 'list'},
          fn() {
            token.child.forEach(renderToken)
          }
        })
        break
      }
      case 'listitem': {
        if (token.task || token.checked !== undefined)
          throw Error('not supported')
        h('li', () => {
          token.child.forEach(renderToken)
        })
        break
      }
      case 'checkbox':
        h('input', {
          attr: {type: 'checkbox', checked: token.checked}
        })
        break
      case 'image':
        h('img', {
          attr: {src: token.href}
        })
        break
    }
  }
}

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
    attr: {href: 'index.css', rel: 'stylesheet'}
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

function formatId(title: string) {
  return title
    .replace(/[(),?{}.:\[\]=;&$]+/g, '-')
    .replace(/ +/g, '-')
    .replace(/-+/g, '-')
    .replace(/-+$/, '')
    .toLowerCase()
}
