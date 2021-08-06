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
  console.log(info.photos.length, info.coser)

  startDownload(`./result/${coser}/result.json`, `./result/${coser}/photos`)
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
    console.log(`targetFolder: ${targetFolder}`)

    const formatedList = _formatPhotos(list)
    folderDetect(targetFolder)

    // TODO task-system
    formatedList.slice(0, 1).forEach(item => {
      const { id, name, url, type } = item
      const filePath = `${targetFolder}/${name}-${id}.${type}`

      download(url, filePath)
    })
  }

  function _formatPhotos(list) {
    return list.map(({ id, subject: name, img_url: url }) => {
      const type = url.match(/\.\w+$/)[0].match(/\w+/)[0]
      return { id, name, url, type }
    })
  }
}
