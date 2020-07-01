import {docRequestBlob} from './githubApi'
import {parseToAST, AstToken} from './mdParser'
import {VersionDate} from './index.h'

import effectorInfo from './sourceData/effector.json'
import effectorReactInfo from './sourceData/effector-react.json'
import effectorVueInfo from './sourceData/effector-vue.json'

export async function fetchData() {
  const versionDates = [
    ...prepareVersionDates(effectorInfo),
    ...prepareVersionDates(effectorReactInfo),
    ...prepareVersionDates(effectorVueInfo),
  ]

  const changelog = await docRequestBlob('CHANGELOG.md')
  if (changelog.isTruncated) throw Error('truncated changelog')

  const ast = parseToAST(changelog.text)
  const sections: AstToken[][] = []
  let releaseHeaderAppeared = false
  let currentSection: AstToken[] = []
  for (const token of ast) {
    if (token.type === 'heading') {
      if (token.level === 1) {
        currentSection = []
        continue
      }
      if (currentSection.length > 0) {
        if (releaseHeaderAppeared) sections.push(currentSection)
      }
      releaseHeaderAppeared = true
      currentSection = [token]
    } else {
      currentSection.push(token)
    }
  }
  if (currentSection.length > 0 && releaseHeaderAppeared)
    sections.push(currentSection)

  return {sections, versionDates}
}

function prepareVersionDates({
  name,
  time,
}: {
  name: string
  time: {[version: string]: string}
}) {
  delete time.created
  delete time.modified
  const results = [] as VersionDate[]
  for (const version in time) {
    results.push({
      library: name,
      version,
      date: +new Date(time[version]),
    })
  }
  return results
}
