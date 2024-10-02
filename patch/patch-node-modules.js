const fs = require('fs')
const nodeModules = __dirname + '/../node_modules'

if (fs.existsSync(nodeModules + '/moment')) {
  console.log('[patch node_modules] removing moment')
  fs.rmSync(nodeModules + '/moment', { recursive: true })
} else {
  console.log('[patch node_modules] moment already removed')
}

if (fs.existsSync(nodeModules + '/@nuxt/vue-app-edge/template/router.js')) {
  console.log(
    '[patch node_modules] patching @nuxt/vue-app-edge/template/router.js'
  )
  fs.copyFileSync(
    __dirname + '/router.js',
    nodeModules + '/@nuxt/vue-app-edge/template/router.js'
  )
} else {
  console.log(
    '[patch node_modules] cannot find @nuxt/vue-app-edge/template/router.js'
  )
}
