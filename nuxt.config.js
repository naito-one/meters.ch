import config from './config'
// copy the correct env file into the static folder
config()

export default {
  ssr: false,
  target: 'static',
  generate: {
    subFolders: false,
  },
  /*
   ** Headers of the page
   */
  head: {
    title: 'Meters',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { 'http-equiv': 'X-UA-Compatible', 'content': 'ie=edge' },
      {
        hid: 'description',
        name: 'description',
        content:
          "Meters is a service that helps you manage your company's energy consumption and temperatures",
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    noscript: [{ innerHTML: 'This website requires JavaScript.' }],

    script: [
      {
        // import the env file directly
        src: '/env.js',
      },
    ],
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
  /*
   ** Global CSS
   */
  css: [
    '~/assets/scss/tailwind.scss',
    '~/assets/scss/icons.scss',
    '~/assets/scss/components.scss',
    '~/assets/scss/fonts.scss',
    '~/assets/scss/styles.scss',
    '~/assets/scss/chart.scss',
  ],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '~/plugins/trailingslash',
    '~/plugins/vue-i18n',
    { src: '~/plugins/requests', mode: 'client' },
    { src: '~/plugins/api', mode: 'client' },
  ],

  router: {
    middleware: 'client-data',
  },

  /*
   ** Nuxt.js modules
   */
  modules: [['@nuxtjs/pwa', { workbox: false }]],
  buildModules: ['nuxt-purgecss'],

  // PWA
  manifest: {
    name: 'Meters.ch Web App',
    short_name: 'Meters.ch',
    author: 'Naito One',
    description:
      "Meters is a service that helps you manage your company's energy consumption and temperatures",
    theme_color: '#3C6285',
    background_color: '#e4e7e0',
  },

  purgeCSS: {
    mode: 'webpack',
    whitelist: ['leaflet-control-attribution'],
  },

  /*
   ** Build configuration
   */
  build: {
    extractCSS: true,
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: './tailwind.config.js',
        },
      },
    },
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {},
  },
}
