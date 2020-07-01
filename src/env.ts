export const USE_UNIQUE_ID = false
export const MANY_LINES = 15
export const LARGE_ARTICLE = 500
export const GITHUB_GQL_TOKEN = process.env.GITHUB_GQL_TOKEN

if (!GITHUB_GQL_TOKEN) throw Error('no github token in GITHUB_GQL_TOKEN')
