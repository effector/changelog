import {docRequestBlob} from './githubApi'
import {fetchPackageHistory} from './npmApi'
import {parseToAST, AstToken} from './mdParser'

export async function fetchData() {
  const [sections, versionDates] = await Promise.all([
    getChangelogSections(),
    getVersionDates()
  ])

  return {sections, versionDates}
}

async function getVersionDates() {
  const [effector, effectorReact, effectorVue] = await Promise.all([
    fetchPackageHistory('effector'),
    fetchPackageHistory('effector-react'),
    fetchPackageHistory('effector-vue')
  ])

  return [...effector, ...effectorReact, ...effectorVue]
}

async function getChangelogSections() {
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
  return sections
}
