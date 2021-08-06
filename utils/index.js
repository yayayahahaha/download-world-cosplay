const CryptoJS = require('crypto-js')
const qs = require('qs')
const fetch = require('node-fetch')
const { cookie } = require('./headers')
const { TaskSystem, download } = require('npm-flyc')
const fs = require('fs')

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
  const taskNumber = 4
  const task_search = new TaskSystem(promiseList, taskNumber, { randomDelay: 1000 /*毫秒*/ })
  const promiseResult = await task_search.doPromise()
  const flatResult = promiseResult
    .map(({ data }) => data)
    .sort((a, b) => a.sort - b.sort)
    .reduce((list, { result: { list: resultList } }) => list.concat(resultList), [])

  return flatResult
}

const folderDetect = (path = 'result') => {
  const folderPath = `./${path}/`
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath)
}

async function touchCoserPhotosInfo(member_id, touchFile = true) {
  folderDetect()
  const photosNumber = await getTotalPhotosNumber(member_id)
  console.log(`總張數: ${photosNumber}`)

  const totalPages = Math.ceil(photosNumber / maxLimit)
  console.log(`每頁 ${maxLimit} 張，總頁數: ${totalPages}`)
  console.log('')

  // 這裡的就是該coser的全部照片了
  const photos = await getAllPhotosInfo(member_id, totalPages)
  console.log('')
  // TODO 補充 member 其他info 的取得方式
  if (!photos.length) {
    console.log(`id ${member_id} 沒有任何照片!`)
    return { coser: member_id, photos }
  }

  const {
    member: { global_name, id }
  } = photos[0]
  const coser = global_name || id
  const coserFolder = `result/${coser}`
  folderDetect(coserFolder)

  const resultFilePath = `./${coserFolder}/result.json`
  const logFilePath = `./${coserFolder}/log.json`
  fs.writeFileSync(resultFilePath, JSON.stringify(photos, null, 2))
  logPhotosInfo(logFilePath, photos)

  return { coser, photos }
}

function logPhotosInfo(filePath, list) {
  const id_hash = hashCode(list.map(item => item.id).join('-'))
  const photosNumber = list.length

  const { tags } = list.reduce(
    (info, item) => {
      if (!item.tag_arr.length) {
        const noTags = 'no-tags'
        const name = noTags
        info.tags[noTags] = info.tags['no-tags'] || { name, photos: [], length: 0 }
        const { id: photoId, subject } = item
        info.tags[noTags].photos.push(`${subject}-${photoId}`)
        info.tags[noTags].length = info.tags[noTags].photos.length
        return info
      }

      item.tag_arr.forEach(tag => {
        const { id, name } = tag
        info.tags[id] = info.tags[id] || { name, photos: [], length: 0 }

        const { id: photoId, subject } = item
        info.tags[id].photos.push(`${subject}-${photoId}`)
        info.tags[id].length = info.tags[id].photos.length
      })

      return info
    },
    { tags: {} }
  )

  const info = { id_hash, photosNumber, tags }
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2))
}

const ds = promise => promise.then(r => [r, null]).catch(e => [null, e])

async function startDownload(from, targetFolder) {
  if (typeof from === 'string') return downloadFromFile(from, targetFolder)
  if (Array.isArray(from)) return downloadFromArray(from, targetFolder)
  return new Error('陣列或檔名')

  function downloadFromFile(filePath, targetFolder) {
    let list
    try {
      list = JSON.parse(fs.readFileSync(filePath))
    } catch (e) {
      return e
    }

    return downloadFromArray(list, targetFolder)
  }
  function downloadFromArray(list, targetFolder) {
    const formatedList = _formatPhotos(list)
    return doDownload(formatedList, targetFolder)
  }
  function _formatPhotos(list) {
    return list.map(({ id, subject: name, img_url: url }) => {
      const type = url.match(/\.\w+$/)[0].match(/\w+/)[0]
      return { id, name, url, type }
    })
  }

  async function doDownload(list, targetFolder) {
    folderDetect(targetFolder)

    const taskList = list.slice(0, 5).map(item => {
      return function () {
        const { id, name, url, type } = item
        const filePath = `${targetFolder}/${name}-${id}.${type}`

        return new Promise(async resolve => {
          const [downloadResult, error] = await download(url, filePath)
            .then(r => [r, null])
            .catch(e => e)
          resolve({
            result: error ? false : true,
            meta: item
          })
        })
      }
    })
    const task_search = new TaskSystem(taskList, 4, { randomDelay: 1000 })
    const promiseResult = await task_search.doPromise()
    console.log('')

    return promiseResult
  }
}

async function fetchCoserPhotos(member_id) {
  const info = await touchCoserPhotosInfo(member_id)

  const { coser } = info
  const result = await startDownload(`./result/${coser}/result.json`, `./result/${coser}/photos`)

  const errorLog = result.map(({ data }) => data).filter(({ result }) => !result)
  if (errorLog.length) {
    folderDetect(`./result/${coser}/error-log`)
    fs.writeFileSync(`./result/${coser}/error-log/${Date.now()}.json`, JSON.stringify(errorLog, null, 2))
  }

  return true
}

module.exports = {
  hashCode,
  createUrl,
  getTotalPhotosNumber,
  basicUrl,
  getAllPhotosInfo,
  maxLimit,
  folderDetect,
  touchCoserPhotosInfo,
  logPhotosInfo,
  ds,
  startDownload,
  fetchCoserPhotos
}
