<template>
  <div v-if="mainStore.isAdmin">
    <app-header
      :title="$t('pages.admin.title')"
      :description="$t('pages.admin.description')"
      :back="true"
    ></app-header>

    <p class="font-medium text-center mb-6" v-text="$t('pages.admin.info')"></p>

    <ul class="flex flex-col items-center">
      <li
        class="w-full lg:w-200 my-1 flex justify-between bg-gray-100 rounded-md hover:shadow-lg"
        v-for="(user, i) in users"
        :key="i"
      >
        <button
          class="font-bold flex-grow py-4 pl-4 clickable focus:shadow-outline flex items-center"
          @click="() => update(user.id)"
          :title="$t('pages.admin.modes.edit')"
        >
          <span
            class="flex-grow"
            v-text="`${user.name}, ${user.client}`"
          ></span>
          <i class="material-icons text-naito-blue-300 text-lg px-5">edit</i>
        </button>

        <button
          class="flex items-center text-naito-blue-300 text-lg py-4 px-5 clickable focus:shadow-outline popup confirmable"
          data-popup-show="false"
          :data-popup-text="$t('global.no_undoing')"
          @click="confirmDelete($event, user)"
          @blur="$event.currentTarget.dataset.popupShow = 'false'"
          :title="$t('pages.admin.modes.delete')"
        >
          <i class="material-icons">delete</i>
        </button>
      </li>
    </ul>

    <div class="mt-4 mb-24 md:mt-8 flex justify-center">
      <button
        class="w-full lg:w-200 action bg-naito-blue-300 text-gray-100 text-center relative"
        @click="create"
      >
        <i class="material-icons absolute left-0 m-4 top-0">add</i>
        <span v-text="$t('pages.admin.modes.create')"></span>
      </button>
    </div>

    <admin-user-popup
      :show="show"
      :mode="mode"
      :current="id === -1 ? null : mainStore.user({ user_id: id })"
      @cancel="popupCancel"
      @confirm="popupConfirm"
    ></admin-user-popup>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { DateTime } from 'luxon'

import AppHeader from '../components/app-header.vue'
import AdminUserPopup from '../components/admin-user-popup.vue'
import { handleNavigationError } from '../assets/utils'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.admin.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.admin.description'),
        },
      ],
    }
  },
  components: { AppHeader, AdminUserPopup },
  async mounted() {
    await Promise.all([this.$getUser(), this.$getUsers(), this.$getClients()])

    if (!this.mainStore.isAdmin) {
      this.$router.replace('/').catch(handleNavigationError)
    }
  },
  data() {
    return {
      mode: 'create',
      id: -1,
      show: false,
    }
  },
  watch: {
    $route(to) {
      if (!to.query.hasOwnProperty('popup') && this.show) {
        this.show = false
      }
    },
  },
  methods: {
    navPopup() {
      this.$router.push({ query: { popup: null } }).catch(handleNavigationError)
    },
    create() {
      // make sure to hide any messages
      this.mainStore.hideMessage()

      this.mode = 'create'
      this.show = true
      this.navPopup()
      return
    },
    update(id) {
      // make sure to hide any messages
      this.mainStore.hideMessage()

      this.mode = 'edit'
      this.id = id
      this.show = true
      this.navPopup()
    },
    async del(id) {
      // make sure to hide any messages
      this.mainStore.hideMessage()

      try {
        await this.$delUser({ id })
      } catch (e) {}

      // fetch up to date user list
      this.$getUsers(true)
    },
    /**
     * @param {{ currentTarget: HTMLElement}} event
     */
    confirmDelete(event, user) {
      // need a second click to delete
      if (event.currentTarget.dataset.popupShow === 'false') {
        event.currentTarget.dataset.popupShow = 'true'
      } else {
        event.currentTarget.dataset.popupShow = 'false'
        this.del(user.id)
      }
    },
    popupCancel() {
      this.show = false
      this.$router.go(-1)
    },
    async popupConfirm(payload) {
      this.show = false
      this.$router.go(-1)

      if (payload.id !== undefined) {
        // update existing
        try {
          await this.$putUser(payload)
        } catch (e) {}
      } else {
        // create new
        try {
          await this.$postUser(payload)
        } catch (e) {}
      }

      // fetch up to date user list
      this.$getUsers(true)
    },
  },
  computed: {
    ...mapStores(useMainStore),
    users() {
      return this.mainStore.users.map((user) => {
        const client = this.mainStore.client(user)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: DateTime.fromISO(user.created_at)
            .setLocale(this.$dateLocale())
            .toLocaleString(DateTime.DATE_FULL),
          client: client ? client.name : user.client_id,
        }
      })
    },
  },
}
</script>
