import generate from '@babel/generator'
import {parse} from '@babel/parser'
import t from '@babel/types'
import traverse from '@babel/traverse'
import template from '@babel/template'

import {serialize, compile, stringify} from 'stylis'

import {relative} from 'path'

import {PROJECT} from './env'

const isTsProjectFile = new RegExp(`.*${PROJECT}\/.*\.ts$`, 'gi')
const mathFileName = new RegExp(`(?<=.*${PROJECT}\/)(.*)(?=\.ts$)`, 'gi')

const specDataCall = template('cssSpec({data: {ID: true}})')
const specDataVarCall = template('cssSpec({data: {ID: true},styleVar: VAR})')

export const extractCssPlugin = () => {
  const root = process.cwd()
  const cssLookup = new Map()
  return {
    name: 'forest-extract-css',
    load(id) {
      if (id.endsWith('_forest.css')) return cssLookup.get(id)
    },
    resolveId(source, importer) {
      if (source.endsWith('_forest.css')) return source
    },
    async transform(code, id) {
      if (isTsProjectFile.test(id)) {
        const sourceFileName = relative(root, id)
        const [fileName] = String(id).match(mathFileName)
        const cssRecords = []
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript'],
        })
        function processStyleCall(methodName, index, path) {
          const node = path.node
          if (node.callee.name !== methodName || node.arguments.length <= index)
            return
          const config = node.arguments[index]

          if (t.isObjectExpression(config)) {
            const styleProp = config.properties.find(
              (prop) =>
                t.isIdentifier(prop.key) &&
                prop.key.name === 'style' &&
                t.isObjectExpression(prop.value),
            )

            if (styleProp) {
              const styleSID = generateStableID(sourceFileName, styleProp.start)
              const styleVarProperties = []
              const cssFields = []
              const toRemove = []
              for (const property of styleProp.value.properties) {
                if (t.isIdentifier(property.key)) {
                  const sid = generateStableID(sourceFileName, property.start)
                  let cssPropName = property.key.name.replace(
                    /[A-Z]/g,
                    (char) => `-${char.toLowerCase()}`,
                  )
                  if (
                    property.key.name.startsWith('webkit') ||
                    property.key.name.startsWith('moz')
                  ) {
                    cssPropName = `-${cssPropName}`
                  }
                  if (
                    t.isStringLiteral(property.value) ||
                    t.isNumericLiteral(property.value)
                  ) {
                    cssFields.push(`${cssPropName}: ${property.value.value};`)
                    toRemove.push(property)
                  } else {
                    cssFields.push(`${cssPropName}: var(--${sid});`)
                    styleVarProperties.push(
                      t.objectProperty(t.identifier(sid), property.value),
                    )
                    toRemove.push(property)
                  }
                }
              }
              toRemove.forEach((property) => {
                styleProp.value.properties.splice(
                  styleProp.value.properties.indexOf(property),
                  1,
                )
              })
              if (styleProp.value.properties.length === 0) {
                config.properties.splice(
                  config.properties.indexOf(styleProp),
                  1,
                )
              }
              const css = `[data-${styleSID}] {${cssFields.join(' ')}}`
              if (cssFields.length > 0) {
                cssRecords.push(css)
              }
              const newConfigFields = [
                t.objectProperty(
                  t.identifier('styleVar'),
                  t.objectExpression(styleVarProperties),
                ),
                // t.objectProperty(t.identifier('rawCss'), t.stringLiteral(css)),
                t.objectProperty(
                  t.identifier('data'),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier(styleSID),
                      t.booleanLiteral(true),
                    ),
                  ]),
                ),
              ]
              if (config.properties.length > 0) {
                newConfigFields.push(
                  t.objectProperty(t.identifier('ɔ'), config),
                )
              }
              node.arguments[index] = t.objectExpression(newConfigFields)
            }
          }
        }
        let cssSpecImportInserted = false
        traverse(ast, {
          CallExpression(path) {
            processStyleCall('spec', 0, path)
            processStyleCall('h', 1, path)
          },
          TaggedTemplateExpression(path) {
            const {node} = path
            if (
              node.tag.name !== 'css' &&
              node.tag.name !== 'createGlobalStyle'
            )
              return
            const isGlobalStyle = node.tag.name === 'createGlobalStyle'
            function getQuasiValue(quasi) {
              if (!t.isTemplateElement(quasi)) return
              return quasi.value.cooked
            }
            if (!cssSpecImportInserted) {
              cssSpecImportInserted = true
              const programPath = path.find((path) => path.isProgram())
              programPath.node.body.unshift(
                t.importDeclaration(
                  [
                    t.importSpecifier(
                      t.identifier('cssSpec'),
                      t.identifier('spec'),
                    ),
                  ],
                  t.stringLiteral('forest'),
                ),
              )
            }
            const sid = generateStableID(sourceFileName, node.start)
            const styleParts = []
            if (!isGlobalStyle) styleParts.push(`[data-${sid}] {`)
            let replacement
            if (node.quasi.expressions.length === 0) {
              replacement = specDataCall({ID: t.identifier(sid)})
              styleParts.push(getQuasiValue(node.quasi.quasis[0]))
            } else {
              const vars = []
              node.quasi.expressions.forEach((expr, i) => {
                const id = `${sid}_${i}`
                const quasi = getQuasiValue(node.quasi.quasis[i])
                styleParts.push(`${quasi}var(--${id})`)
                vars.push(t.objectProperty(t.identifier(id), expr))
              })
              const lastQuasi = node.quasi.quasis[node.quasi.quasis.length - 1]
              styleParts[styleParts.length - 1] += getQuasiValue(lastQuasi)
              replacement = specDataVarCall({
                ID: t.identifier(sid),
                VAR: t.objectExpression(vars),
              })
            }
            if (!isGlobalStyle) styleParts.push(`}`)
            const fullStyle = serialize(
              compile(styleParts.join(`\n`)),
              stringify,
            )
            cssRecords.push(fullStyle)
            if (isGlobalStyle) {
              path.remove()
            } else {
              path.replaceWith(replacement)
            }
          },
        })
        if (cssRecords.length === 0) return null
        const babelResult = generate(ast, {}, code)
        const cssSource = cssRecords.join(`\n`)
        const cssFileName = `${fileName}_forest.css`
        cssLookup.set(cssFileName, cssSource)
        return {
          code: `import '${cssFileName}';\n${babelResult.code}`,
          map: null,
        }
      }
      return null
    },
  }
}

function generateStableID(fileName, position) {
  return hashCode(`${fileName || ''} [${position}]`)
}
function hashCode(s) {
  let h = 0
  let i = 0
  if (s.length > 0)
    while (i < s.length) h = ((h << 5) - h + s.charCodeAt(i++)) | 0
  return `sid_${Math.abs(h).toString(36)}`
}
