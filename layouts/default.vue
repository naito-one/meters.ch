<template>
  <div
    class="background-image font-content w-screen h-screen flex overflow-x-hidden"
  >
    <loading-bar :show="isAppLoading"></loading-bar>
    <div class="absolute right-0 top-0">
      <language-selector
        :locale="locale"
        :locales="locales"
        :label="'global.set_locale'"
        name="page"
        @change="setLocale($event)"
      ></language-selector>
    </div>
    <main class="flex-grow w-full text-gray-900 px-2 sm:px-6">
      <nuxt />
    </main>
    <message-box></message-box>
    <div
      v-if="isIE && !hideIEWarning"
      class="fixed bottom-0 left-0 w-full bg-orange-300 text-gray-900 text-center flex flex-col"
    >
      <i
        @click="hideIEWarning = true"
        class="material-icons clickable w-full p-4"
        >close</i
      >
      <span
        class="p-4 pt-0"
        v-html="$t('global.browser_alert', { classes: 'green-link' })"
      ></span>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'pinia'
import { useMainStore } from '../store/index'

import MessageBox from '../components/message-box.vue'
import LanguageSelector from '../components/language-selector.vue'
import LoadingBar from '../components/loading-bar.vue'

export default {
  methods: {
    ...mapActions(useMainStore, [
      'setLocale',
      'updateSmallScreen',
      'addAwaitingEvent',
    ]),
  },
  components: { LanguageSelector, MessageBox, LoadingBar },
  data() {
    return {
      hideIEWarning: false,
    }
  },
  computed: {
    ...mapState(useMainStore, ['locale', 'locales', 'isAppLoading', 'isIE']),
  },
  mounted() {
    // show loading bar when changing page
    let navFrom = null
    let navTo = null
    let resolveFunc = null

    this.$router.beforeEach((to, from, next) => {
      if (to.name !== from.name) {
        navFrom = from.name
        navTo = to.name

        this.addAwaitingEvent(
          new Promise((resolve) => {
            resolveFunc = resolve
          })
        )
      }
      next()
    })

    this.$router.afterEach((to, from) => {
      if (to.name === navTo && from.name === navFrom) {
        navFrom = null
        navTo = null
        if (resolveFunc) {
          resolveFunc()
        }
      }
    })

    // handle chart axes when resizing
    window.onresize = () => {
      this.updateSmallScreen()
    }
  },
}
</script>
