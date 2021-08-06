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
  folderDetect,
  touchCoserPhotos
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
