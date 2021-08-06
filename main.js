const qs = require('qs')
const fetch = require('node-fetch')
const { TaskSystem, download } = require('npm-flyc')
const fs = require('fs')

const ds = promise => promise.then(r => [r, null]).catch(e => [null, e])

// 用bisect 的形式找出最大length
const limit = 1
const member_id = 135407
const page = 273

const basicUrl = 'https://worldcosplay.net/api/member/photos.json'
const basicQuery = { limit, member_id, page }

// start
;(async function (member_id) {
  const maxLimit = 24

  const photosNumber = await getTotalPhotosNumber(member_id)
  console.log(`photosNumber: ${photosNumber}`)

  const totalPages = Math.ceil(photosNumber / 24)

  const promiseList = [...Array(totalPages)].map((nothing, index) => {
    const page = index + 1
    const url = createUrl(basicUrl, { limit: maxLimit, member_id, page })

    return async () => ({
      result: await (await fetch(url)).json(),
      sort: page
    })
  })

  const taskNumber = 40
  const task_search = new TaskSystem(promiseList, taskNumber)
  const promiseResult = await task_search.doPromise()
  const flatResult = promiseResult
    .map(({ data }) => data)
    .sort((a, b) => a.sort - b.sort)
    .reduce((list, { result: { list: resultList } }) => list.concat(resultList), [])

  // 這裡的就是該coser的全部照片了
  fs.writeFileSync('result.json', JSON.stringify(flatResult, null, 2))
})(/*member_id*/ 28898)

// start()
async function start() {
  const url = createUrl(basicUrl, basicQuery)
  if (!url) return console.error('create url error')

  const [response, error] = await ds(fetch(url))
  if (error) return console.error(`fetch ${url} error`)

  const [data, jsonError] = await ds(response.json())
  if (jsonError) return console.error(`parse fetch ${url} response error`)

  console.log(data.list.length, data.pager)
}

function createUrl(basicUrl = '', queryInput = '') {
  if (typeof basicUrl !== 'string') return null
  if (!/https?:\/\//.test(basicUrl)) return null

  if (queryInput === null) return null
  if (typeof queryInput !== 'string' && typeof queryInput !== 'object') return null

  let query = typeof queryInput === 'object' ? qs.stringify(queryInput) : queryInput
  query.replace(/^\?/, '')

  return `${basicUrl}?${query}`
}

async function getTotalPhotosNumber(member_id = 135407, basicMax = 1, basicMin = 1) {
  if (Number(basicMin > basicMax)) {
    console.error('getTotalPhotosNumber: min 不可大於 max')
    return null
  }

  console.log(`-取得會員 ${member_id} 的照片張數-`)
  console.log(`member_id: ${member_id}`)
  console.log('')

  console.log('取得最大可能張數..')
  const [max, min] = await _findMax(basicMax, basicMin)
  console.log(`最大可能張數: ${max}`)
  console.log('')

  async function _findMax(max, min) {
    return new Promise(async resolve => {
      let getMaxCount = 0
      let resultMax = 0
      let resultMin = 0
      await _doFind(max, min)
      resolve([resultMax, resultMin])

      async function _doFind(max, previous) {
        getMaxCount++
        const page = max
        const url = createUrl(basicUrl, { member_id, limit: 1, page })

        console.log(`嘗試次數: ${getMaxCount}, 數目: ${page}`)
        const hasMore = !!(await (await fetch(url)).json()).list.length
        if (hasMore) return _doFind(max * 2, max)
        resultMax = max
        resultMin = previous
      }
    })
  }

  console.log('開始過濾頁數..')
  return new Promise(async resolve => {
    let totalNumber = 0
    let roundCount = 0

    await _do(member_id, { max, min })
    resolve(totalNumber)

    async function _do(member_id, { max, min }) {
      roundCount++
      const page = Math.floor((max + min) / 2)
      const url = createUrl(basicUrl, { member_id, limit: 1, page })
      const delta = max - min

      console.log(`Round: ${roundCount}, ${min}-->${page}-->${max}, delta: ${delta}`)
      const hasMore = !!(await (await fetch(url)).json()).list.length
      const noMore = !hasMore

      const nextConfig = { max: 0, min: 0 }

      if (delta <= 1) {
        const lastUrl = createUrl(basicUrl, { member_id, limit: 1, page: max })
        const lastHasMore = !!(await (await fetch(lastUrl)).json()).list.length
        if (lastHasMore) {
          totalNumber = max
        } else {
          totalNumber = min
        }
      } else if (hasMore) {
        nextConfig.max = max
        nextConfig.min = page
        await _do(member_id, nextConfig)
      } else if (noMore) {
        nextConfig.max = page
        nextConfig.min = min
        await _do(member_id, nextConfig)
      }
    }
  })
}
