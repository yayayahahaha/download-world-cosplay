// TODO jsDoc
// TODO README
// TODO 環境檔 (for token)
// TODO multi cosers: by search result or hand-in
// cache: by cache-time(haven't checked yet), by folder info(ls -al stuff)

const { fetchCoserPhotos, getUserInfo } = require('./utils/index')

// coser world-cosplay
/*135407 // Katsurayu */
/*19139 // Neneko */

// fetchCoserPhotos(4444) // error!
// fetchCoserPhotos(676767)
fetchCoserPhotos(135407)
;[...Array(2)].forEach((nothing, index) => {
  const memberId = index + 1
  fetchCoserPhotos(memberId)
})
