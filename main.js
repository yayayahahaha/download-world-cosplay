const qs = require('qs')
const fetch = require('node-fetch')

const ds = promise => promise.then(r => [r, null]).catch(e => [null, e])

console.log(typeof qs)
console.log(typeof fetch)

const url = 'https://worldcosplay.net/api/member/photos.json?limit=12&member_id=135407&page=1'

start()
async function start() {
  const [response, error] = await ds(fetch(url))
  if (error) return

  const [data, jsonError] = await ds(response.json())
  if (jsonError) return

  console.log(data)
}
