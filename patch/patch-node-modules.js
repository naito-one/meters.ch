const fs = require('fs')
const nodeModules = __dirname + '/../node_modules'

console.log('[patch node_modules] removing moment')
try {
  fs.rmSync(nodeModules + '/moment', { recursive: true })
} catch (e) {
  console.warn(e.message)
}

console.log('[patch node_modules] patching @nuxt/vue-app/template/router.js')
fs.copyFileSync(
  __dirname + '/router.js',
  nodeModules + '/@nuxt/vue-app/template/router.js'
)
