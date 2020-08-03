import {resolve} from 'path'
//@ts-ignore
import {outputFile, copy} from 'fs-extra'
import {fork, serialize, allSettled} from 'effector'
import {renderStatic} from 'forest/server'

import {App, app, sections, versionDates, setClientState} from './app'
import {format} from 'prettier'
import {fetchData} from './fetchData'

async function generateStatic() {
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

  const renderedRaw = await renderStatic({
    scope,
    fn: App
  })

  const rendered = format(renderedRaw, {parser: 'html', printWidth: 60})

  await Promise.all([
    outputFile(resolve(__dirname, 'index.html'), rendered),
    copy(resolve(process.cwd(), 'src', 'assets'), resolve(__dirname, 'assets'))
  ])
}

generateStatic()
