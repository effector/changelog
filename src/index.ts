import {resolve} from 'path'
//@ts-ignore
import {outputFile, copy} from 'fs-extra'
import {renderStatic} from 'forest/server'

import {App} from './app'
import {fetchData} from './fetchData'

async function generateStatic() {
  const {sections, versionDates} = await fetchData()

  const rendered = await renderStatic(() => {
    App(sections, versionDates)
  })

  await Promise.all([
    outputFile(resolve(__dirname, 'index.html'), rendered),
    copy(resolve(process.cwd(), 'src', 'assets'), resolve(__dirname, 'assets'))
  ])
}

generateStatic()
