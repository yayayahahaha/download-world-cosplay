const { TaskSystem, download } = require('npm-flyc')
const fs = require('fs')
const {
  basicUrl,
  hashCode,
  createUrl,
  getTotalPhotosNumber,
  getAllPhotosInfo,
  maxLimit,
  folderDetect,
  touchCoserPhotosInfo
} = require('./utils/index')

/*135407*/ /*19139*/ /*28898*/
const member_id = 135407
const limit = 1
const page = 272

const basicQuery = { limit, member_id, page }

// touchCoserPhotosInfo
// touchCoserPhotosInfo(135407)
// touchCoserPhotosInfo(28898)

start(19139)
async function start(member_id) {
  const info = await touchCoserPhotosInfo(member_id)

  const { coser } = info
  const result = await startDownload(`./result/${coser}/result.json`, `./result/${coser}/photos`)

  const errorLog = result.map(({ data }) => data).filter(({ result }) => !result)
  if (errorLog.length) {
    folderDetect(`./result/${coser}/error-log`)
    fs.writeFileSync(`./result/${coser}/error-log/${Date.now()}.json`, JSON.stringify(errorLog, null, 2))
  }
  console.log('done!')
}

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
