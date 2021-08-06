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
touchCoserPhotosInfo(28898)
