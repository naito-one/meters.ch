<template>
  <div class="w-full">
    <app-header
      :title="$t('pages.signature.title')"
      :description="$t('pages.signature.description')"
      :back="true"
    ></app-header>

    <section
      class="relative bg-gray-100 rounded-md p-4 pt-2 md:p-6 md:pt-3 mb-48 mx-auto w-full lg:w-2/3 xl:w-3/5"
    >
      <signature-chart
        :class="[
          'chart-height-explore',
          'transition-opacity-100',
          isQueryValid ? 'opacity-1' : 'opacity-0',
        ]"
        :site="site"
        :temperature="temperature"
        :heater="heater"
        :period="period"
        :offset="offset"
        :filter="filter"
        :highlight="highlight"
        @currentData="setCurrentData"
      ></signature-chart>

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
            isQueryValid
              ? ['opacity-0', 'pointer-events-none']
              : ['opacity-1', 'pointer-events-auto']
          )
        "
      >
        <span
          class="text-center font-medium p-4"
          v-text="$t('pages.signature.form.invalid_query')"
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
          :disabled="!isQueryValid"
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
        <!-- site select list -->
        <search-select
          name="site-input"
          class="mb-2"
          :placeholder="$t('pages.signature.form.site')"
          :options="formattedSites"
          :top="true"
          :single="true"
          v-model="site"
        ></search-select>

        <!-- interior temp resource select list -->
        <search-select
          name="temperature-input"
          class="mb-2"
          :placeholder="$t('pages.signature.form.temperature')"
          :options="formattedTemperatures"
          :top="true"
          :single="true"
          v-model="temperature"
        ></search-select>

        <!-- heater resource select list -->
        <search-select
          name="heater-input"
          class="mb-2"
          :placeholder="$t('pages.signature.form.heater')"
          :options="formattedHeaters"
          :top="true"
          :single="true"
          v-model="heater"
        ></search-select>

        <!-- period -->
        <div class="material-select mb-2">
          <label for="period-input" v-text="$t('periods.short')"></label>
          <select name="period-input" id="period-input" v-model="period">
            <option
              v-for="(option, i) in filteredPeriods"
              :key="i"
              :value="signaturePeriods[option]"
              v-text="$t('periods.' + option)"
            ></option>
          </select>
        </div>

        <!-- filter range -->
        <div class="w-full flex items-center mb-2">
          <label
            class="text-gray-100 font-bold mr-4 flex-grow"
            for="filter-input"
            v-text="$t('pages.signature.form.filter')"
          ></label>
          <input
            class="range-slider__range w-1/2"
            type="range"
            name="filter-input"
            id="filter-input"
            min="0"
            max="1"
            step="0.05"
            v-model.number="filter"
          />
        </div>

        <!-- highlight range -->
        <div class="w-full flex items-center mb-2">
          <label
            class="text-gray-100 font-bold mr-4 flex-grow"
            for="highlight-input"
            v-text="$t('pages.signature.form.highlight')"
          ></label>
          <input
            class="range-slider__range w-1/2"
            type="range"
            name="highlight-input"
            id="highlight-input"
            min="0"
            max="1"
            step="0.05"
            v-model.number="highlight"
          />
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
  formatResource,
  signatureJsonToCsv,
  HEATING_RESOURCE_TYPES,
  reverseSignaturePeriods,
  signaturePeriods,
  generateSignatureChartName,
  signatureDatasetsToJson,
  handleNavigationError,
  removeTrailingSlash,
} from '../assets/utils'

import AppHeader from '../components/app-header.vue'
import SearchSelect from '../components/search-select.vue'
import SignatureChart from '../components/signature-chart.vue'

import BookmarkPopup from '../components/bookmark-popup.vue'
import DownloadPopup from '../components/download-popup.vue'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.signature.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.signature.description'),
        },
      ],
    }
  },
  components: {
    AppHeader,
    SearchSelect,
    BookmarkPopup,
    DownloadPopup,
    SignatureChart,
  },
  data() {
    return {
      site: -1,
      temperature: -1,
      heater: -1,
      // start at one because there is no day period for signature
      // default: monthly
      period: 2,
      // default to showing previous period
      offset: 1,
      filter: 0,
      highlight: 0.2,

      showBookmarkPopup: false,
      showDownloadPopup: false,
      currentData: null,
      hasData: false,
      areSettingsCollapsed: false,
    }
  },
  async mounted() {
    // only need resources and sites to validate the query parameters
    // get sensors to filter resources by site
    // get resource types because it is needed to download the correct
    // readings in chart.vue (triggered on getting the query)
    await Promise.all([
      this.$getSites(),
      this.$getResources(),
      this.$getResourceTypes(),
      this.$getSensors(),
    ])

    this.getQuery()

    // if there is a single site and none selected, select it automatically
    if (this.mainStore.numSites === 1 && this.site === -1) {
      this.site = this.formattedSites[0].id
    }

    this.setQuery()

    await Promise.all([this.$getUser(), this.$getMeteoLocations()])
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
          site: this.site === -1 ? undefined : String(this.site),
          temperature:
            this.temperature === -1 ? undefined : String(this.temperature),
          heater: this.heater === -1 ? undefined : String(this.heater),
          period: reverseSignaturePeriods[this.period],
          offset: String(this.offset),
          filter: String(this.filter),
          highlight: String(this.highlight),
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

      const site = parseInt(query.site)
      // check site has a meteo location id
      if (
        !isNaN(site) &&
        this.mainStore.dataById.sites[site] !== undefined &&
        this.mainStore.dataById.sites[site].meteo_location_id !== null
      ) {
        this.site = site
      }

      const temperature = parseInt(query.temperature)
      if (
        !isNaN(temperature) &&
        this.mainStore.dataById.resources[temperature] !== undefined
      ) {
        // check is temperature resource
        const resourceType = this.mainStore.resourceType(
          this.mainStore.dataById.resources[temperature]
        )

        if (resourceType && resourceType.name === 'Temperature') {
          this.temperature = temperature
        }
      }

      const heater = parseInt(query.heater)
      if (
        !isNaN(heater) &&
        this.mainStore.dataById.resources[heater] !== undefined
      ) {
        // check is heater resource
        const resourceType = this.mainStore.resourceType(
          this.mainStore.dataById.resources[heater]
        )

        if (
          resourceType &&
          HEATING_RESOURCE_TYPES.includes(resourceType.name)
        ) {
          this.heater = heater
        }
      }

      const period = reverseSignaturePeriods.indexOf(query.period)
      if (period !== -1) {
        this.period = period
      }

      const offset = parseInt(query.offset)
      if (!isNaN(offset) && offset >= 0) {
        // back 1 year in weeks
        this.offset = Math.min(offset, 53)
      }

      const filter = parseFloat(query.filter)
      if (!isNaN(filter) && filter >= 0 && filter <= 1) {
        this.filter = filter
      }

      const highlight = parseFloat(query.highlight)
      if (!isNaN(highlight) && highlight >= 0 && highlight <= 1) {
        this.highlight = highlight
      }
    },
    setCurrentData({ datasets, hasData }) {
      this.currentData = datasets
      this.hasData = hasData
    },
    download(payload) {
      this.showDownloadPopup = false
      this.$router.go(-1)

      const jsonData = signatureDatasetsToJson(this.currentData)

      let dataStr = ''

      let name = `chart_site-${this.site}_temp-${this.temperature}_heat-${
        this.heater
      }_period-${reverseSignaturePeriods[this.period]}_offset-${
        this.offset
      }_filter-${this.filter}_highlight-${this.highlight}`

      if (payload.format === 'json') {
        dataStr =
          'data:text/json;charset=utf-8,' +
          encodeURIComponent(JSON.stringify(jsonData, null, 2))
        name += '.json'
      } else {
        dataStr =
          'data:text/csv;charset=utf-8,' +
          encodeURIComponent(signatureJsonToCsv(jsonData, this.$i18n))
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
        type: 'signature',
        site: this.site,
        temperature: this.temperature,
        heater: this.heater,
        period: reverseSignaturePeriods[this.period],
        offset: this.offset,
        filter: this.filter,
        highlight: this.highlight,
      }

      this.mainStore.addDashboardChart(payload)

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
    site() {
      this.setQuery()
    },
    temperature() {
      this.setQuery()
    },
    heater() {
      this.setQuery()
    },
    period() {
      this.setQuery()
    },
    offset() {
      this.setQuery()
    },
    filter() {
      this.setQuery()
    },
    highlight() {
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

    reverseSignaturePeriods() {
      return reverseSignaturePeriods
    },
    signaturePeriods() {
      return signaturePeriods
    },
    filteredPeriods() {
      return reverseSignaturePeriods.filter(Boolean)
    },
    isLastPeriodOffset() {
      return this.offset === 0
    },
    periodOffsetString() {
      return this.$tc(
        'period_offsets.' + reverseSignaturePeriods[this.period],
        this.offset,
        { count: this.offset }
      )
    },
    formattedSites() {
      // meteo_location_id is nullable. don't include sites that don't have it
      return this.mainStore.sites
        .filter((site) => site.meteo_location_id !== null)
        .map((site) => {
          return {
            id: site.id,
            value: `${site.name}, ${site.zip} ${site.city}`,
          }
        })
    },
    allTemperatures() {
      return this.mainStore.resources.filter((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        return resourceType && resourceType.name === 'Temperature'
      })
    },
    formattedTemperatures() {
      return this.allTemperatures
        .filter((resource) => {
          const sensor = this.mainStore.sensor(resource)
          return sensor && sensor.site_id === this.site
        })
        .map((resource) => {
          return {
            id: resource.id,
            value: resource.description,
          }
        })
    },
    allHeaters() {
      return this.mainStore.resources.filter((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        return (
          resourceType && HEATING_RESOURCE_TYPES.includes(resourceType.name)
        )
      })
    },
    formattedHeaters() {
      return this.allHeaters
        .filter((resource) => {
          const sensor = this.mainStore.sensor(resource)
          return sensor && sensor.site_id === this.site
        })
        .map((resource) => {
          const resourceType = this.mainStore.resourceType(resource)
          return {
            id: resource.id,
            value: formatResource(this.$i18n, resource, resourceType, null),
          }
        })
    },
    defaultChartName() {
      if (!this.isQueryValid) {
        return ''
      }

      if (!this.mainStore.dataById.sites) {
        return ''
      }

      return generateSignatureChartName(
        {
          site: this.site,
          period: reverseSignaturePeriods[this.period],
          offset: this.offset,
        },
        this.mainStore.dataById.sites,
        this.$i18n
      )
    },
    isQueryValid() {
      return this.site !== -1 && this.temperature !== -1 && this.heater !== -1
    },
  },
}
</script>
