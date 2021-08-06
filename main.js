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
  touchCoserPhotosInfo,
  startDownload
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
