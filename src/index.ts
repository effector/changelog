import {resolve} from 'path'
//@ts-ignore
import {outputFile} from 'fs-extra'
import {renderStatic} from 'forest/server'

import {App} from './app'
import {fetchData} from './fetchData'

const HTML_FILE_OUTPUT = resolve(__dirname, 'index.html')

run()

async function run() {
  const {sections, versionDates} = await fetchData()

  const rendered = await renderStatic(() => {
    App(sections, versionDates)
  })

  await outputFile(HTML_FILE_OUTPUT, rendered)
}
