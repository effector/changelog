import fetch from 'cross-fetch'

import {GITHUB_GQL_TOKEN} from './env'

type RepoTreeDir = {
  seqName: string[]
  path: string
  name: string
  dirs: RepoTreeDir[]
  files: RepoTreeFile[]
}
type RepoTreeFile = {
  seqName: string[]
  path: string
  name: string
  text: string
}
type DocsRequestBlob = {
  oid: string
  isTruncated: boolean
  byteSize: number
  text: string
}
type DocsRequestTree = {
  entries: Array<{
    oid: string
    name: string
    type: 'blob' | 'tree'
  }>
}

export async function docRequestBlob(path: string) {
  const result = await docRequest(path)
  if ('entries' in result) throw Error('blob expected')
  return result
}

async function docRequestTree(path: string) {
  const result = await docRequest(path)
  if ('entries' in result) return result
  throw Error('tree expected')
}

async function docRequest(
  path,
  {owner = 'zerobias', repo = 'effector'}: {owner?: string; repo?: string} = {}
): Promise<DocsRequestBlob | DocsRequestTree> {
  const result = await gqlRequest({
    query: `
      query DocsRequest($owner: String!, $repo: String!, $path: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: $path) {
            ... on Tree {
              entries {
                oid
                name
      #           mode
                type
              }
            }
            ... on Blob {
              oid
              isTruncated
              byteSize
              text
            }
          }
        }
      }
    `,
    variables: {
      owner,
      repo,
      path: `master:${path}`
    }
  })
  if ('message' in result) throw Error(String(result.message))
  return result.data.repository.object
}

async function gqlRequest({
  query,
  variables = {}
}: {
  query: string
  variables?: Object
}) {
  const req = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({query, variables}),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'newt jest',
      Cookie: 'logged_in=no',
      Authorization: `bearer ${GITHUB_GQL_TOKEN}`
    }
  })
  return req.json()
}

async function dirRequest(pathSeq: string[]): Promise<RepoTreeDir> {
  const path = pathSeq.join('/')
  const {entries} = await docRequestTree(path)
  const blobs = entries.filter(e => e.type === 'blob')
  const trees = entries.filter(e => e.type === 'tree')
  const blobRequests = blobs.map(async ({name}) => {
    const seqName = [...pathSeq, name]
    const path = seqName.join('/')
    const blob = await docRequestBlob(path)
    if (blob.isTruncated) throw Error(`truncated file "${path}"`)
    return {
      seqName,
      path,
      name,
      text: blob.text
    }
  })
  const treeRequests = trees.map(({name}) => {
    return dirRequest([...pathSeq, name])
  })
  const [files, dirs] = await Promise.all([
    Promise.all(blobRequests),
    Promise.all(treeRequests)
  ])
  return {
    seqName: pathSeq,
    path,
    name: pathSeq[pathSeq.length - 1],
    dirs,
    files
  }
}
