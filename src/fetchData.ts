import {docRequestBlob} from './githubApi'
import {fetchPackageHistory} from './npmApi'

export async function fetchData() {
  const [changelogContent, versionDates] = await Promise.all([
    getChangelogSections(),
    getVersionDates()
  ])

  return {changelogContent, versionDates}
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
  return changelog.text
}
