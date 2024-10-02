<template>
  <div class="mt-4 lg:mt-16 flex flex-col items-center">
    <div class="absolute left-0 top-0">
      <nuxt-link
        :title="$t('global.back')"
        to="login"
        class="clickable material-icons focus:shadow-outline hover:lighten-10 active:darken-10 absolute left-0 top-0 min-w-10 min-h-10 px-5 py-4 text-2xl"
      >
        arrow_back
      </nuxt-link>
    </div>
    <section class="flex flex-col items-center">
      <img
        src="/images/naito-900.svg"
        :alt="$t('alt.naito_one_logo')"
        class="w-16 sm:mb-2 md:w-32"
      />
      <h1
        class="font-heading text-2xl text-center"
        v-text="$t('pages.reset.title')"
      ></h1>
    </section>

    <form
      class="my-8 flex flex-col items-center w-full sm:w-100 bg-gray-100 rounded-md px-4 py-8 font-medium"
      action="#"
      @submit="reset"
    >
      <p
        class="text-center text-gray-800"
        v-text="$t('pages.reset.form.explain')"
      ></p>
      <p
        class="text-center text-gray-600 mb-4"
        v-text="$t('pages.reset.form.note')"
      ></p>
      <label
        class="w-full"
        for="email-input"
        v-text="$t('global.email')"
      ></label>
      <input
        :disabled="resetting"
        v-model="email"
        class="w-full px-4 py-2 mb-8 transparent-input"
        type="email"
        name="email-input"
        id="email-input"
        required
      />
      <input
        :disabled="resetting"
        class="text-center action w-full bg-naito-green-200 text-gray-100"
        type="submit"
        :value="$t('pages.reset.form.submit')"
      />
    </form>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { handleNavigationError } from '../assets/utils'
export default {
  middleware: 'not-auth',
  head() {
    return {
      title: `${this.$t('pages.reset.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.reset.description'),
        },
      ],
    }
  },
  mounted() {
    this.email = this.$route.query.email
  },
  data() {
    return {
      resetting: false,
      email: '',
    }
  },
  methods: {
    async reset(event) {
      event.preventDefault()

      this.resetting = true
      const email = event.target[0].value

      // hide a potential message
      this.mainStore.hideMessage()

      try {
        const res = await this.$get('/reset', {
          email,
        })

        const parsed = await res.json()

        if (!res.ok) {
          // focus email
          event.target[0].focus()

          if (parsed.errors) {
            // get and show the first error message
            const firstError = Object.values(parsed.errors)[0][0]
            this.mainStore.showMessage(firstError, true)
          } else {
            this.mainStore.showMessage(parsed.message, true)
          }

          // stop here
          return
        }

        // store the message then return to the login page
        this.mainStore.showMessage(parsed.message, false)

        this.$router.push('/login').catch(handleNavigationError)
      } catch (e) {
        console.error('Error getting response', e)
        this.mainStore.showMessage(this.$t('error.unknown'), true)
      } finally {
        this.resetting = false
      }
    },
  },
  computed: {
    ...mapStores(useMainStore),
  },
}
</script>
