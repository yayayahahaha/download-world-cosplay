const fetch = require('node-fetch')
const { TaskSystem, download } = require('npm-flyc')
const fs = require('fs')
const {
  basicUrl,
  hashCode,
  createUrl,
  getTotalPhotosNumber,
  getAllPhotosInfo,
  maxLimit,
  folderDetect
} = require('./utils/index')
const { cookie } = require('./utils/headers')

const ds = promise => promise.then(r => [r, null]).catch(e => [null, e])

// 用bisect 的形式找出最大length
const limit = 1
/*135407*/ /*19139*/ /*28898*/
const member_id = 135407
const page = 272

const basicQuery = { limit, member_id, page }

// touchCoserPhotos
touchCoserPhotos(19139)
// touchCoserPhotos(135407)
// touchCoserPhotos(28898)
async function touchCoserPhotos(member_id, touchFile = true) {
  folderDetect()
  const photosNumber = await getTotalPhotosNumber(member_id)
  console.log(`總張數: ${photosNumber}`)

  const totalPages = Math.ceil(photosNumber / maxLimit)
  console.log(`每頁 ${maxLimit} 張，總頁數: ${totalPages}`)

  // 這裡的就是該coser的全部照片了
  const photos = await getAllPhotosInfo(member_id, totalPages)
  if (!touchFile || !photos.length) return photos

  const {
    member: { global_name, id }
  } = photos[0]
  const coser = global_name || id
  const coserFolder = `result/${coser}`
  folderDetect(coserFolder)
  fs.writeFileSync(`./${coserFolder}/result.json`, JSON.stringify(photos, null, 2))

  return photos
}
