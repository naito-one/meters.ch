<template>
  <div>
    <app-header
      :title="$t('pages.settings.title')"
      :description="$t('pages.settings.description')"
      :back="true"
    ></app-header>

    <!-- actions -->

    <section class="mb-8 flex flex-col items-center">
      <a
        class="mb-4 w-5/6 sm:w-100 action bg-naito-blue-300 text-gray-100 text-center relative"
        href="mailto:support@naito.one"
      >
        <i class="material-icons absolute left-0 m-4 top-0">contact_support</i>
        <span v-text="$t('pages.settings.actions.support')"></span>
      </a>

      <a
        class="w-full sm:w-120 action bg-naito-green-200 text-gray-100 text-center relative"
        @click="logout"
        :href="loginUrl"
      >
        <i class="material-icons absolute left-0 m-4 top-0">launch</i>
        <span v-text="$t('pages.settings.actions.logout')"></span>
      </a>
    </section>

    <!-- information section -->

    <details open="open" @toggle="toggleDetail">
      <summary
        class="bg-gray-100 rounded-md p-4 mb-2 md:mx-20 lg:w-200 lg:mx-auto clickable focus:shadow-outline hover:shadow-lg text-lg font-bold"
        v-text="$t('pages.settings.infos.title')"
      ></summary>
      <section
        class="bg-gray-100 rounded-md p-4 mb-2 md:mx-20 lg:w-200 lg:mx-auto"
      >
        <h2
          class="text-lg font-bold mb-3"
          v-text="$t('pages.settings.infos.client')"
        ></h2>
        <ul>
          <li
            class="flex items-center my-1"
            v-for="(data, i) in clientData"
            :key="i"
          >
            <p class="font-medium w-1/2 pr-2" v-text="$t(data.name)"></p>
            <p v-text="data.value"></p>
          </li>
        </ul>
      </section>

      <section
        class="bg-gray-100 rounded-md p-4 mb-8 md:mx-20 lg:w-200 lg:mx-auto"
      >
        <h2
          class="text-lg font-bold mb-3"
          v-text="$t('pages.settings.infos.user')"
        ></h2>
        <ul>
          <li
            class="flex items-center my-1"
            v-for="(data, i) in userData"
            :key="i"
          >
            <p class="font-medium w-1/2 pr-2" v-text="$t(data.name)"></p>
            <p v-text="data.value"></p>
          </li>
          <li class="flex items-center mt-1">
            <p
              class="font-medium w-1/2 pr-2"
              v-text="$t('pages.settings.infos.data.locale')"
            ></p>
            <language-selector
              :locale="userLocale"
              :locales="locales"
              :label="'global.set_locale'"
              name="backend"
              @change="saveUserLocale"
            ></language-selector>
          </li>
          <li>
            <p
              class="text-gray-800 mb-1"
              v-text="$t('pages.settings.infos.locale_explain')"
            ></p>
          </li>
        </ul>
      </section>
    </details>

    <!-- sensor subscriptions section -->

    <details @toggle="toggleDetail">
      <summary
        class="bg-gray-100 rounded-md p-4 mb-2 md:mx-20 lg:w-200 lg:mx-auto clickable focus:shadow-outline hover:shadow-lg text-lg font-bold"
        v-text="$t('pages.settings.sensor_subscriptions.title')"
      ></summary>
      <section
        class="bg-gray-100 rounded-md mb-1 p-4 md:mx-20 lg:w-200 lg:mx-auto text-center"
      >
        <p
          class="text-center"
          v-text="$t('pages.settings.sensor_subscriptions.details')"
        ></p>
      </section>

      <ul class="flex flex-col items-center mb-8 md:mx-20 lg:w-200 lg:mx-auto">
        <li
          class="w-full my-1 flex justify-between items-center bg-gray-100 rounded-md hover:shadow-lg"
          v-for="(sensor, i) in sensors"
          :key="i"
        >
          <label
            :for="i + '-subscribe-input'"
            class="font-bold flex-grow p-4 clickable focus:shadow-outline flex items-center"
          >
            <span class="font-mono uppercase" v-text="`${sensor.name}`"></span>
            <span
              class="pl-4"
              v-text="getFormattedSensorResources(sensor.id)"
            ></span>
          </label>

          <!-- checkbox -->
          <label
            class="material-checkbox text-naito-blue-300"
            :for="i + '-subscribe-input'"
          >
            <input
              type="checkbox"
              :name="i + '-subscribe-input'"
              :id="i + '-subscribe-input'"
              :checked="isSubscribed(sensor.id)"
              @change="toggleSubscribe(sensor.id)"
            />
            <div
              class="material-checkbox-fake material-checkbox-fake__large"
            ></div>
          </label>
        </li>
      </ul>
    </details>

    <!-- sessions section -->

    <details @toggle="toggleDetail">
      <summary
        class="bg-gray-100 rounded-md p-4 mb-2 md:mx-20 lg:w-200 lg:mx-auto clickable focus:shadow-outline hover:shadow-lg text-lg font-bold"
        v-text="$t('pages.settings.sessions.title')"
      ></summary>

      <ul class="flex flex-col items-center mb-8 md:mx-20 lg:w-200 lg:mx-auto">
        <li
          class="w-full my-1 flex justify-between items-center bg-gray-100 rounded-md"
          v-for="(session, i) in formattedSessions"
          :key="i"
        >
          <div class="flex-grow pl-4 pt-4 flex flex-col">
            <div class="flex flex-grow items-center pr-4">
              <img
                class="h-6 mr-2 text-gray-100 select-none text-gray-900 font-bold"
                :src="session.browserImage"
                :alt="session.browserAlt"
              />
              <i
                class="material-icons text-2xl select-none"
                v-text="session.platformIcon"
              ></i>

              <span
                class="flex-grow text-sm text-right ml-2"
                v-text="session.lastUsedAt"
              ></span>

              <span
                v-if="session.expiresAt"
                v-text="
                  `${$t('pages.settings.sessions.expires')} ${
                    session.expiresAt
                  }`
                "
                class="ml-2 italic text-sm"
              ></span>
            </div>

            <div class="flex mt-2">
              <p class="flex flex-col text-sm flex-grow">
                <span
                  class="font-bold leading-tight"
                  v-text="session.description"
                ></span>
                <span class="leading-tight" v-text="session.ipAddress"></span>
              </p>

              <button
                class="flex items-center text-naito-blue-300 text-lg py-4 px-5 clickable focus:shadow-outline popup confirmable"
                data-popup-show="false"
                :data-popup-text="$t('global.no_undoing')"
                @click="confirmDeleteSession($event, session)"
                @blur="$event.currentTarget.dataset.popupShow = 'false'"
                :title="$t('pages.settings.sessions.delete')"
              >
                <i class="material-icons">delete</i>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </details>

    <!-- licenses -->

    <section
      class="bg-gray-100 rounded-md mb-24 p-4 md:mx-20 lg:w-200 lg:mx-auto text-center"
    >
      <span v-text="$t('copyright.meteo')"></span>
      <a
        class="green-link"
        rel="noreferrer"
        target="_blank"
        href="https://www.prevision-meteo.ch"
        >www.prevision-meteo.ch</a
      >
    </section>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { DateTime } from 'luxon'

import AppHeader from '../components/app-header.vue'
import LanguageSelector from '../components/language-selector.vue'
import { formatResource } from '../assets/utils'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.settings.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.settings.description'),
        },
      ],
    }
  },
  components: { AppHeader, LanguageSelector },
  data() {
    return {
      loginUrl: '/login',
      details: null,
    }
  },
  async mounted() {
    if (this.mainStore.rememberMe) {
      this.loginUrl = '/login?remember-me'
    }

    this.details = [...this.$el.getElementsByTagName('details')]

    await Promise.all([
      this.$getUser(),
      this.$getSensors(),
      this.$getResources(),
      this.$getResourceTypes(),
      this.$getSites(),
      this.$getClient(),
      // always update the sessions
      this.$getSessions(true),
    ])
  },
  methods: {
    saveUserLocale(payload) {
      this.$putUser(payload)
    },
    isSubscribed(sensorId) {
      return this.sensorSubscriptions.includes(sensorId)
    },
    async toggleSubscribe(sensorId) {
      const index = this.sensorSubscriptions.indexOf(sensorId)

      const newSensorSubscriptions = [...this.sensorSubscriptions]

      if (index !== -1) {
        newSensorSubscriptions.splice(index, 1)
      } else {
        newSensorSubscriptions.push(sensorId)
      }

      try {
        await this.$putUser(
          { sensor_subscriptions: JSON.stringify(newSensorSubscriptions) },
          this.$t('api.sensor_subscriptions_updated'),
          6000
        )

        // save to local store
        this.mainStore.setSensorSubscriptions(newSensorSubscriptions)
      } catch (e) {
        // failed to put user. error are handled by the put method
      }
    },
    getFormattedSensorResources(sensorId) {
      const resources = this.mainStore.resources.filter(
        (resource) => resource.sensor_id === sensorId
      )

      if (resources.length === 0) {
        return this.$t(
          'pages.settings.sensor_subscriptions.no_associated_resources'
        )
      }

      return resources
        .map((resource) =>
          formatResource(
            this.$i18n,
            resource,
            this.mainStore.resourceType(resource)
          )
        )
        .join(', ')
    },
    async logout(event) {
      event.preventDefault()

      // logout on the backend to delete the session
      try {
        const res = await this.$post('/logout', {
          api_token: this.mainStore.apiToken,
        })
      } catch (e) {
        console.error(e)
      }

      this.mainStore.logout()
      this.$router.push(this.loginUrl)
    },
    /**
     * @param {{ currentTarget: HTMLElement}} event
     */
    async confirmDeleteSession(event, session) {
      // need a second click to delete
      if (event.currentTarget.dataset.popupShow === 'false') {
        event.currentTarget.dataset.popupShow = 'true'
      } else {
        event.currentTarget.dataset.popupShow = 'false'
        // make sure to hide any messages
        this.mainStore.hideMessage()
        try {
          await this.$delSession({ id: session.id })
        } catch (e) {}

        // fetch up to date session list
        this.$getSessions(true)
      }
    },
    /**
     * @param {{ currentTarget: HTMLElement}} event
     */
    toggleDetail(event) {
      if (event.currentTarget.open) {
        // close all others
        this.details.forEach((detail) => {
          if (detail === event.currentTarget) {
            return
          }

          if (detail.open) {
            detail.open = false
          }
        })
      }
    },
  },
  computed: {
    ...mapStores(useMainStore),

    /**
     * @returns {string}
     */
    name() {
      return this.mainStore.name
    },
    clientData() {
      const locale = this.$numberLocale()
      return [
        {
          name: 'pages.settings.infos.data.client_name',
          value: this.mainStore.clientName,
        },
        {
          name: 'pages.settings.infos.data.client_number',
          value: this.mainStore.clientNumber,
        },
        { name: 'global.email', value: this.mainStore.clientEmail },
        {
          name: 'pages.settings.infos.data.num_sensors',
          value: this.mainStore.numResources.toLocaleString(locale),
        },
        {
          name: 'pages.settings.infos.data.num_sites',
          value: this.mainStore.numSites.toLocaleString(locale),
        },
      ]
    },
    userData() {
      return [
        {
          name: 'pages.settings.infos.data.user_name',
          value: this.mainStore.name,
        },
        { name: 'global.email', value: this.mainStore.email },
        {
          name: 'pages.settings.infos.data.created_at',
          value: this.mainStore.accountCreatedAt
            .setLocale(this.$dateLocale())
            .toLocaleString(DateTime.DATE_FULL),
        },
      ]
    },
    userLocale() {
      return this.mainStore.userLocale
    },
    locales() {
      return this.mainStore.locales
    },
    /**
     * @returns {number[]} a list of the ids of the sensors to which the user subscribed to
     */
    sensorSubscriptions() {
      return this.mainStore.sensorSubscriptions
    },
    sensors() {
      return this.mainStore.sensors
    },
    sessions() {
      return this.mainStore.sessions
    },
    formattedSessions() {
      const now = DateTime.local()
      const nowMillis = now.toMillis()
      return (
        this.sessions
          .map((session) => {
            // first get the expires at date parsed
            const expiresAt =
              session['expires_at'] === null
                ? null
                : DateTime.fromISO(session['expires_at'])

            return [expiresAt, session]
          })
          .filter(([expiresAt]) => {
            // then remove the ones that have expired
            return !expiresAt || nowMillis < expiresAt.toMillis()
          })
          .map(([expiresAt, session]) => {
            const lastUsedAt = DateTime.fromISO(session['last_used_at'])

            // return with the last used at date for sorting
            return [
              lastUsedAt.toMillis(),
              {
                id: session.id,
                browserImage: `/images/browsers/${session['user_agent']['browser']}.svg`,
                browserAlt:
                  session['user_agent']['browser'] ||
                  this.$t('pages.settings.sessions.unknown_browser'),
                platformIcon: session['user_agent']['is_mobile']
                  ? 'smartphone'
                  : 'computer',
                description: session['user_agent']['description'],
                lastUsedAt: lastUsedAt
                  .startOf('second')
                  .minus({ second: 2 })
                  .setLocale(this.$dateLocale())
                  .toRelative({ base: now, style: 'short' }),
                expiresAt: expiresAt
                  ? expiresAt
                      .startOf('second')
                      .plus({ second: 2 })
                      .setLocale(this.$dateLocale())
                      .toRelative({ base: now, style: 'short' })
                  : null,
                ipAddress: session['ip_address'],
              },
            ]
          })
          .sort((a, b) => b[0] - a[0])
          // remove date included for sorting
          .map((x) => x[1])
      )
    },
  },
}
</script>
