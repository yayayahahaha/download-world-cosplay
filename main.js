const qs = require('qs')
const fetch = require('node-fetch')
const { TaskSystem, download } = require('npm-flyc')

const ds = promise => promise.then(r => [r, null]).catch(e => [null, e])

const basicUrl = 'https://worldcosplay.net/api/member/photos.json'
const basicQuery = {
  limit: 12,
  member_id: 135407,
  page: 1,
}

start()
async function start() {
  const url = createUrl(basicUrl, basicQuery)
  if (!url) return

  const [response, error] = await ds(fetch(url))
  if (error) return

  const [data, jsonError] = await ds(response.json())
  if (jsonError) return

  console.log(data)
}

function createUrl(basicUrl = '', queryInput = '') {
  if (typeof basicUrl !== 'string') return null
  if (!/https?:\/\//.test(basicUrl)) return null

  if (queryInput === null) return
  if (typeof queryInput !== 'string' && typeof queryInput !== 'object') return null

  let query = typeof queryInput === 'object' ? qs.stringify(queryInput) : queryInput
  query.replace(/^\?/, '')

  return `${basicUrl}?${query}`
}
