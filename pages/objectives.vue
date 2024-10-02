<template>
  <div>
    <app-header
      :title="$t('pages.objectives.title')"
      :description="$t('pages.objectives.description')"
      :back="true"
    ></app-header>

    <p
      class="font-medium text-center mb-6"
      v-text="$t('pages.objectives.info')"
    ></p>

    <ul class="flex flex-col items-center">
      <li
        class="w-full lg:w-200 my-1 flex justify-between bg-gray-100 rounded-md hover:shadow-lg"
        v-for="(objective, i) in objectives"
        :key="i"
      >
        <button
          class="font-bold flex-grow py-4 pl-4 clickable focus:shadow-outline flex items-center"
          @click="update(objective.id)"
          :title="$t('pages.objectives.modes.edit')"
        >
          <span class="flex-grow" v-text="objective.value"></span>
          <i class="material-icons text-naito-blue-300 text-lg px-5">edit</i>
        </button>

        <button
          class="flex items-center text-naito-blue-300 text-lg py-4 px-5 clickable focus:shadow-outline popup confirmable"
          data-popup-show="false"
          :data-popup-text="$t('global.no_undoing')"
          @click="confirmDelete($event, objective)"
          @blur="$event.currentTarget.dataset.popupShow = 'false'"
          :title="$t('pages.objectives.modes.delete')"
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
        <span v-text="$t('pages.objectives.modes.create')"></span>
      </button>
    </div>

    <objective-popup
      :show="show"
      :mode="mode"
      :current="mainStore.objective({ objective_id: id })"
      @cancel="popupCancel"
      @confirm="popupConfirm"
    ></objective-popup>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import {
  formatResource,
  toClosestSuffixe,
  decimalDefaultFormat,
  handleNavigationError,
} from '../assets/utils'

import AppHeader from '../components/app-header.vue'
import ObjectivePopup from '../components/objective-popup.vue'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.objectives.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.objectives.description'),
        },
      ],
    }
  },
  components: { AppHeader, ObjectivePopup },
  async mounted() {
    await Promise.all([
      this.$getResources(),
      this.$getObjectives(),
      this.$getResourceTypes(),
      this.$getSensors(),
      this.$getSites(),
    ])
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
    del(id) {
      // make sure to hide any messages
      this.mainStore.hideMessage()

      this.$delObjective({ id })
    },
    /**
     * @param {{ currentTarget: HTMLElement}} event
     */
    confirmDelete(event, objective) {
      // need a second click to delete
      if (event.currentTarget.dataset.popupShow === 'false') {
        event.currentTarget.dataset.popupShow = 'true'
      } else {
        event.currentTarget.dataset.popupShow = 'false'
        this.del(objective.id)
      }
    },
    popupCancel() {
      this.show = false
      this.$router.go(-1)
    },
    popupConfirm(payload) {
      this.show = false
      this.$router.go(-1)

      if (payload.id !== undefined) {
        // update existing
        this.$putObjective(payload)
      } else {
        // create new
        this.$postObjective(payload)
      }
    },
  },
  computed: {
    ...mapStores(useMainStore),

    objectives() {
      const locale = this.$numberLocale()
      return this.mainStore.objectives.map((objective) => {
        const out = {
          id: objective.id,
          value: '',
        }

        const resource = this.mainStore.resource(objective)

        if (resource === null) {
          return out
        }

        const resourceType = this.mainStore.resourceType(resource)

        if (resourceType === null) {
          return out
        }

        const formattedResource = formatResource(
          this.$i18n,
          resource,
          resourceType
        )
        const type = this.$t('features.objective_types.' + objective.type)

        const result = toClosestSuffixe(objective.value)

        out.value = `${formattedResource}, ${result.number.toLocaleString(
          locale,
          decimalDefaultFormat
        )} ${result.unit + resourceType.symbol}/${type}`

        return out
      })
    },
  },
}
</script>
