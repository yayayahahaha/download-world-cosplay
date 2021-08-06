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
const member_id = 28898
const page = 272

const basicQuery = { limit, member_id, page }

const start = async function (member_id, f) {
  folderDetect()
  const photosNumber = await getTotalPhotosNumber(member_id)

  const totalPages = Math.ceil(photosNumber / maxLimit)

  const result = await getAllPhotosInfo(member_id, totalPages)

  // 這裡的就是該coser的全部照片了
  fs.writeFileSync('result.json', JSON.stringify(result, null, 2))
}
// start
start(member_id)
