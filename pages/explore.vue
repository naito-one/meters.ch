<template>
  <div class="w-full">
    <app-header
      :title="$t('pages.explore.title')"
      :description="$t('pages.explore.description')"
      :back="true"
    ></app-header>

    <section
      class="relative bg-gray-100 rounded-md p-4 pt-2 md:p-6 md:pt-3 mb-48 mx-auto w-full lg:w-2/3 xl:w-3/5"
    >
      <explore-chart
        :class="[
          'chart-height-explore',
          'transition-opacity-100',
          resources.length > 0 ? 'opacity-1' : 'opacity-0',
        ]"
        :period="period"
        :agregation="agregation"
        :offset="offset"
        :resources="resources"
        @currentData="setCurrentData"
      ></explore-chart>
      <div
        :class="
          [
            'absolute',
            'top-0',
            'left-0',
            'w-full',
            'h-full',
            'flex',
            'items-center',
            'justify-center',
            'transition-opacity-100',
          ].concat(
            resources.length > 0
              ? ['opacity-0', 'pointer-events-none']
              : ['opacity-1', 'pointer-events-auto']
          )
        "
      >
        <span
          class="text-center font-medium p-4"
          v-text="$t('pages.explore.form.no_resources')"
        ></span>
      </div>
    </section>

    <!-- parameters -->
    <section
      class="fixed bottom-0 inset-x-0 w-full p-4 md:px-1/5 lg:px-1/4 xl:px-1/3 bg-naito-green-200 shadow-lg-top"
    >
      <section
        class="absolute top-0 right-0 -mt-32 text-gray-100 rounded-l-md flex flex-col"
      >
        <!-- download -->
        <button
          :title="$t('pages.explore.download.title')"
          :disabled="!hasData"
          @click="
            showDownloadPopup = true
            navPopup()
          "
          class="rounded-tl-md p-4 bg-naito-blue-300 simple-action"
        >
          <i class="material-icons text-xl">get_app</i>
        </button>
        <!-- bookmark -->
        <button
          :title="$t('pages.explore.bookmark.title')"
          :disabled="resources.length === 0"
          @click="
            showBookmarkPopup = true
            navPopup()
          "
          class="rounded-bl-md p-4 bg-naito-blue-300 simple-action"
        >
          <i class="material-icons text-xl">bookmark</i>
        </button>
      </section>

      <!-- button to collapse parameters -->
      <button
        :title="$t('pages.explore.collapse_settings')"
        @click="toggleCollapse($event)"
        class="clickable material-icons absolute top-0 left-0 -mt-12 min-w-10 min-h-10 p-5 text-2xl bg-naito-green-200 rounded-t-full text-gray-100"
        v-text="areSettingsCollapsed ? 'expand_less' : 'expand_more'"
      ></button>
      <div :class="areSettingsCollapsed ? 'hidden' : 'block'">
        <!-- resources multi select list -->
        <search-select-multi
          name="resources"
          :placeholder="$t('pages.explore.form.find_resources')"
          :options="formattedResources"
          :top="true"
          :single="true"
          v-model="resources"
        ></search-select-multi>
        <div class="flex my-2">
          <!-- agregation -->
          <div class="w-1/2 mr-1 material-select">
            <label
              for="agregation-input"
              v-text="$t('agregations.short')"
            ></label>
            <select
              name="agregation-input"
              id="agregation-input"
              v-model="agregation"
            >
              <option
                v-for="(option, i) in reverseAgregations"
                :key="i"
                :value="i"
                v-text="$t('agregations.' + option)"
              ></option>
            </select>
          </div>
          <!-- period -->
          <div class="w-1/2 ml-1 material-select">
            <label for="period-input" v-text="$t('periods.short')"></label>
            <select name="period-input" id="period-input" v-model="period">
              <option
                v-for="(option, i) in reversePeriods"
                :key="i"
                :value="i"
                v-text="$t('periods.' + option)"
              ></option>
            </select>
          </div>
        </div>
        <!-- offset -->
        <div class="flex justify-end items-center">
          <span
            class="text-gray-100 font-bold mr-4"
            v-text="periodOffsetString"
          ></span>
          <!-- previous -->
          <button
            class="w-10 h-10 bg-gray-100 rounded-l-md simple-action"
            @click="offset++"
          >
            <i class="material-icons text-2xl text-gray-800">arrow_left</i>
          </button>
          <!-- next -->
          <button
            class="w-10 h-10 bg-gray-100 simple-action"
            @click="offset--"
            :disabled="isLastPeriodOffset"
          >
            <i class="material-icons text-2xl text-gray-800">arrow_right</i>
          </button>
          <!-- last -->
          <button
            class="w-10 h-10 bg-gray-100 rounded-r-md simple-action"
            @click="offset = 0"
            :disabled="isLastPeriodOffset"
          >
            <i class="material-icons text-lg text-gray-800">fast_forward</i>
          </button>
        </div>
      </div>
    </section>

    <bookmark-popup
      @cancel="
        showBookmarkPopup = false
        $router.go(-1)
      "
      @confirm="bookmark"
      :show="showBookmarkPopup"
      :periodOffsetString="periodOffsetString"
      :defaultChartName="defaultChartName"
    ></bookmark-popup>

    <download-popup
      @cancel="
        showDownloadPopup = false
        $router.go(-1)
      "
      @confirm="download"
      :show="showDownloadPopup"
    ></download-popup>
    <a ref="downloader" class="hidden"></a>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import {
  reversePeriods,
  reverseAgregations,
  formatResource,
  exploreDatasetsToJson,
  exploreJsonToCsv,
  generateExploreChartName,
  handleNavigationError,
  removeTrailingSlash,
} from '../assets/utils'

import AppHeader from '../components/app-header.vue'
import SearchSelectMulti from '../components/search-select-multi.vue'
import ExploreChart from '../components/explore-chart.vue'

import BookmarkPopup from '../components/bookmark-popup.vue'
import DownloadPopup from '../components/download-popup.vue'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.explore.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.explore.description'),
        },
      ],
    }
  },
  components: {
    AppHeader,
    SearchSelectMulti,
    BookmarkPopup,
    DownloadPopup,
    ExploreChart,
  },
  data() {
    return {
      offset: 0,
      agregation: 0,
      period: 0,
      resources: [],
      showBookmarkPopup: false,
      showDownloadPopup: false,
      currentData: null,
      hasData: false,
      areSettingsCollapsed: false,
    }
  },
  async mounted() {
    // only need resources to validate the query parameters
    // get resource types because it is needed to download the correct
    // readings in chart.vue (triggered on getting the query)
    await Promise.all([this.$getResources(), this.$getResourceTypes()])

    this.getQuery()

    // if we still don't have any resource shown, try to use the first one
    if (
      this.resources.length === 0 &&
      this.mainStore.data.resources.length > 0
    ) {
      this.resources = [this.mainStore.data.resources[0].id]
    }

    this.setQuery()

    await Promise.all([this.$getSensors(), this.$getSites(), this.$getUser()])
  },
  methods: {
    navPopup() {
      this.$router
        .push({ query: { ...this.$route.query, popup: null } })
        .catch(handleNavigationError)
    },
    setQuery() {
      const route = {
        path: removeTrailingSlash(this.$route.path),
        query: {
          offset: String(this.offset),
          agregation: reverseAgregations[this.agregation],
          period: reversePeriods[this.period],
          resources: this.resources.map(String),
        },
      }

      // small optimization to avoid replacing a route with itself
      if (JSON.stringify(route.query) === JSON.stringify(this.$route.query)) {
        return
      }

      this.$router.replace(route).catch(handleNavigationError)
    },
    getQuery() {
      const query = this.$route.query

      const period = reversePeriods.indexOf(query.period)
      if (period !== -1) {
        this.period = period
      }

      const agregation = reverseAgregations.indexOf(query.agregation)
      if (agregation !== -1) {
        this.agregation = agregation
      }

      const offset = parseInt(query.offset)
      if (!isNaN(offset) && offset >= 0) {
        // limit to 365
        this.offset = Math.min(offset, 365)
      }

      const resources = query.resources
      if (Array.isArray(resources)) {
        // filter existing resources
        this.resources = resources
          .map((id) => parseInt(id))
          .filter((id) => {
            return (
              !isNaN(id) && this.mainStore.dataById.resources[id] !== undefined
            )
          })
      } else {
        // if is contains a single value, it will parse as a single number
        const id = parseInt(resources)
        if (!isNaN(id) && this.mainStore.dataById.resources[id] !== undefined) {
          this.resources = [id]
        }
      }
    },
    setCurrentData({ datasets, hasData }) {
      this.currentData = datasets
      this.hasData = hasData
    },
    download(payload) {
      this.showDownloadPopup = false
      this.$router.go(-1)

      const jsonData = exploreDatasetsToJson(this.currentData)

      let dataStr = ''

      let name = `chart_period-${reversePeriods[this.period]}_offset-${
        this.offset
      }_agregation-${
        reverseAgregations[this.agregation]
      }_resources-${this.resources.join('-')}`

      if (payload.format === 'json') {
        dataStr =
          'data:text/json;charset=utf-8,' +
          encodeURIComponent(JSON.stringify(jsonData, null, 2))
        name += '.json'
      } else {
        dataStr =
          'data:text/csv;charset=utf-8,' +
          encodeURIComponent(exploreJsonToCsv(jsonData, this.$i18n))
        name += '.csv'
      }

      this.$refs.downloader.setAttribute('href', dataStr)
      this.$refs.downloader.setAttribute('download', name)
      this.$refs.downloader.click()
    },
    bookmark({ name }) {
      this.showBookmarkPopup = false
      this.$router.go(-1)

      const payload = {
        name,
        type: 'explore',
        offset: this.offset,
        agregation: reverseAgregations[this.agregation],
        period: reversePeriods[this.period],
        resources: this.resources,
      }

      this.mainStore.data.user.dashboard.charts.push(payload)

      this.$putUser(
        { dashboard: JSON.stringify(this.mainStore.dashboard) },
        this.$t('api.dashboard_updated'),
        3000
      )
    },
    toggleCollapse(event) {
      this.areSettingsCollapsed = !this.areSettingsCollapsed
      event.stopPropagation()
    },
  },
  watch: {
    offset() {
      this.setQuery()
    },
    agregation() {
      this.setQuery()
    },
    period() {
      this.setQuery()
    },
    resources() {
      this.setQuery()
    },
    $route(to) {
      if (!to.query.hasOwnProperty('popup')) {
        if (this.showBookmarkPopup) {
          this.showBookmarkPopup = false
        }
        if (this.showDownloadPopup) {
          this.showDownloadPopup = false
        }
      }
    },
  },
  computed: {
    ...mapStores(useMainStore),
    isLastPeriodOffset() {
      return this.offset === 0
    },
    reversePeriods() {
      return reversePeriods
    },
    reverseAgregations() {
      return reverseAgregations
    },
    periodOffsetString() {
      return this.$tc(
        'period_offsets.' + reversePeriods[this.period],
        this.offset,
        { count: this.offset }
      )
    },
    formattedResources() {
      return this.mainStore.resources.map((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        let site = null
        if (this.mainStore.numSites > 1) {
          const sensor = this.mainStore.sensor(resource)
          site = this.mainStore.site(sensor)
        }
        return {
          id: resource.id,
          value: formatResource(this.$i18n, resource, resourceType, site),
        }
      })
    },
    defaultChartName() {
      if (this.resources.length === 0) {
        return ''
      }

      if (!this.mainStore.dataById.resources) {
        return ''
      }

      return generateExploreChartName(
        {
          offset: this.offset,
          period: reversePeriods[this.period],
          resources: this.resources,
        },
        this.mainStore.dataById.resources,
        this.$i18n
      )
    },
  },
}
</script>
