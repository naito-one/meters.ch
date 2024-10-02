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
        v-text="$t('pages.fresh.title')"
      ></h1>
    </section>

    <form
      class="my-8 flex flex-col items-center w-full sm:w-100 bg-gray-100 rounded-md px-4 py-8 font-medium"
      action="#"
      @submit="reset"
    >
      <p
        class="text-center text-gray-800 mb-4"
        v-text="$t('pages.fresh.form.explain')"
      ></p>
      <label
        class="w-full"
        for="password-input"
        v-text="$t('pages.login.form.password')"
      ></label>
      <input
        :disabled="resetting"
        class="w-full px-4 py-2 mb-8 transparent-input"
        type="password"
        name="password-input"
        id="password-input"
        required
      />
      <label
        class="w-full"
        for="confirm-input"
        v-text="$t('pages.fresh.form.confirm')"
      ></label>
      <input
        :disabled="resetting"
        class="w-full px-4 py-2 transparent-input"
        type="password"
        name="confirm-input"
        id="confirm-input"
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
            :disabled="resetting"
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
        :disabled="resetting"
        class="text-center action w-full bg-naito-green-200 text-gray-100"
        type="submit"
        :value="$t('pages.fresh.form.submit')"
      />
    </form>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { handleNavigationError } from '../assets/utils'
export default {
  middleware: ['has-verify-token', 'not-auth'],
  head() {
    return {
      title: `${this.$t('pages.fresh.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.fresh.description'),
        },
      ],
    }
  },
  data() {
    return {
      verifyToken: null,
      resetting: false,
      rememberMe: false,
    }
  },
  mounted() {
    this.verifyToken = this.$route.query.verify_token
    this.rememberMe = this.$route.query.hasOwnProperty('remember-me')
  },
  watch: {
    rememberMe(to, from) {
      if (to === from) {
        return
      }

      const route = {
        query: {
          verify_token: this.verifyToken,
        },
      }

      if (to) {
        route.query['remember-me'] = null
      }
      this.$router.replace(route).catch(handleNavigationError)
    },
  },
  computed: {
    ...mapStores(useMainStore),
  },
  methods: {
    async reset(event) {
      event.preventDefault()

      this.resetting = true
      const password = event.target[0].value
      const password_confirmation = event.target[1].value
      const rememberMe = event.target[2].checked

      // hide a potential message
      this.mainStore.hideMessage()

      try {
        const res = await this.$post('/reset', {
          verify_token: this.verifyToken,
          password,
          password_confirmation,
          remember_me: Boolean(rememberMe),
        })

        const parsed = await res.json()

        if (!res.ok) {
          // focus password
          event.target[0].focus()

          if (parsed.errors) {
            // get and show the first error message
            const firstError = Object.values(parsed.errors)[0][0]
            this.mainStore.showMessage(firstError, true)
          } else {
            this.mainStore.showMessage(parsed.message, true)
            this.$router.push('/reset').catch(handleNavigationError)
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
        this.resetting = false
      }
    },
  },
}
</script>
