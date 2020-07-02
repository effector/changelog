import {packument} from 'pacote'

import {VersionDate} from './index.h'

export async function fetchPackageHistory(name: string) {
  const packageInfo = await packument(name, {fullMetadata: true})
  return prepareVersionDates(packageInfo)
}

function prepareVersionDates({
  name,
  time
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
      date: +new Date(time[version])
    })
  }
  return results
}
