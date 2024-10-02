<template>
  <div class="mt-4 lg:mt-16 flex flex-col items-center">
    <section class="flex flex-col items-center">
      <img
        src="/images/naito-900.svg"
        :alt="$t('alt.naito_one_logo')"
        class="w-16 sm:mb-2 md:w-32"
      />
      <h1
        class="font-heading text-2xl text-center"
        v-text="$t('pages.login.title')"
      ></h1>
    </section>

    <form
      class="my-8 flex flex-col items-center w-full sm:w-100 bg-gray-100 rounded-md px-4 py-8 font-medium"
      action="#"
      @submit="login"
    >
      <label
        class="w-full"
        for="email-input"
        v-text="$t('global.email')"
      ></label>
      <input
        :disabled="loggingIn"
        v-model="email"
        class="w-full px-4 py-2 transparent-input"
        type="email"
        name="email-input"
        id="email-input"
        required
      />

      <div class="w-full pt-4 flex justify-between">
        <label
          class="flex-grow flex items-center"
          for="password-input"
          v-text="$t('pages.login.form.password')"
        ></label>
        <nuxt-link
          tabindex="1"
          :to="{ name: 'reset', query: { email } }"
          class="green-link text-right ml-4 p-4 md:p-0"
          v-text="$t('pages.login.form.forgotten_password')"
        ></nuxt-link>
      </div>
      <input
        :disabled="loggingIn"
        class="w-full px-4 py-2 transparent-input"
        type="password"
        name="password-input"
        id="password-input"
        required
      />

      <div class="w-full py-2 flex justify-end items-center">
        <label
          class="select-none"
          for="remember-me-input"
          v-text="$t('pages.login.form.remember_me')"
        ></label>
        <label
          class="material-checkbox text-naito-green-200"
          for="remember-me-input"
        >
          <input
            :disabled="loggingIn"
            type="checkbox"
            name="remember-me-input"
            id="remember-me-input"
            v-model="rememberMe"
          />
          <div
            class="material-checkbox-fake material-checkbox-fake__large"
          ></div>
        </label>
      </div>
      <input
        :disabled="loggingIn"
        :class="[
          'text-center',
          'action',
          loggingIn ? 'action__processing' : '',
          'w-full',
          'bg-naito-green-200',
          'text-gray-100',
        ]"
        type="submit"
        :value="$t('pages.login.form.submit')"
      />
    </form>

    <a
      v-if="!mainStore.isProbablyClient"
      class="my-8 w-full sm:w-120 action bg-naito-blue-300 text-gray-100 text-center"
      href="https://naito.one/meters"
      v-text="$t('pages.login.new_client')"
    ></a>
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
      title: this.$t('pages.login.title'),
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.login.description'),
        },
      ],
    }
  },
  data() {
    return {
      loggingIn: false,
      email: '',
      rememberMe: false,
    }
  },
  mounted() {
    this.rememberMe = this.$route.query.hasOwnProperty('remember-me')
  },
  watch: {
    rememberMe(to, from) {
      if (to === from) {
        return
      }

      const route = {
        query: {},
      }

      if (to) {
        route.query['remember-me'] = null
      }
      this.$router.replace(route).catch(handleNavigationError)
    },
  },
  methods: {
    /**
     * @param {SubmitEvent} event
     */
    async login(event) {
      event.preventDefault()

      /**
       * @type {HTMLCollectionOf<HTMLInputElement>}
       */
      const target = event.target

      this.loggingIn = true
      const email = target[0].value
      const password = target[1].value
      const rememberMe = target[2].checked

      // hide a potential message
      this.mainStore.hideMessage()

      try {
        const res = await this.$post('/login', {
          email,
          password,
          remember_me: rememberMe,
        })

        const parsed = await res.json()

        if (!res.ok) {
          // focus email
          event.target[0].focus()
          // empty password
          event.target[1].value = ''

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

        if (rememberMe) {
          this.mainStore.rememberMe = rememberMe
        }

        localStorage.setItem('hasConnected', true)
        this.mainStore.setApiToken(parsed.api_token)

        this.$router.push('/').catch(handleNavigationError)
      } catch (e) {
        console.error('Error getting response', e)
        this.mainStore.showMessage(this.$t('error.unknown'), true)
      } finally {
        this.loggingIn = false
      }
    },
  },
  computed: {
    ...mapStores(useMainStore),
  },
}
</script>
