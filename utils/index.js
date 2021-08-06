const CryptoJS = require('crypto-js')
const qs = require('qs')
const fetch = require('node-fetch')
const { cookie } = require('./headers')
const { TaskSystem, download } = require('npm-flyc')

// CryptoJS.MD5('Test')
// CryptoJS.SHA256('Test1')
const hashCode = (input, sault = 'flyc-matoi') => CryptoJS.SHA256(`${input}${sault}`).toString()

const createUrl = (basicUrl = '', queryInput = '') => {
  if (typeof basicUrl !== 'string') return null
  if (!/https?:\/\//.test(basicUrl)) return null

  if (queryInput === null) return null
  if (typeof queryInput !== 'string' && typeof queryInput !== 'object') return null

  let query = typeof queryInput === 'object' ? qs.stringify(queryInput) : queryInput
  query.replace(/^\?/, '')

  return `${basicUrl}?${query}`
}

const basicUrl = 'https://worldcosplay.net/api/member/photos.json'
const getTotalPhotosNumber = async (member_id = 135407, basicMax = 1, basicMin = 1) => {
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

const maxLimit = 24
const fetchConfig = {
  headers: { cookie }
}
const getAllPhotosInfo = async (member_id, totalPages) => {
  const promiseList = [...Array(totalPages)].map((nothing, index) => {
    const page = index + 1
    const url = createUrl(basicUrl, { limit: maxLimit, member_id, page })

    return async () => ({
      result: await (await fetch(url, fetchConfig)).json(),
      sort: page
    })
  })
  const taskNumber = 2
  const task_search = new TaskSystem(promiseList, taskNumber, { randomDelay: 1000 /*毫秒*/ })
  const promiseResult = await task_search.doPromise()
  const flatResult = promiseResult
    .map(({ data }) => data)
    .sort((a, b) => a.sort - b.sort)
    .reduce((list, { result: { list: resultList } }) => list.concat(resultList), [])

  return flatResult
}

module.exports = { hashCode, createUrl, getTotalPhotosNumber, basicUrl, getAllPhotosInfo, maxLimit }
