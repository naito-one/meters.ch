<template>
  <div>
    <div
      :class="[
        'z-10',
        'fixed',
        'top-0',
        'left-0',
        'w-screen',
        'h-screen',
        isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none',
      ]"
      @click="isMenuOpen = false"
    ></div>
    <app-header
      :title="$t('pages.index.title')"
      :description="$t('pages.index.description')"
      :back="false"
    ></app-header>

    <section
      class="bg-gray-100 rounded-md p-4 mb-3 md:mb-6 mx-auto w-full lg:w-2/3 xl:w-3/5 flex items-center"
    >
      <div class="relative z-10">
        <button
          :disabled="editMode"
          @click="toggleMenu"
          class="round-action material-icons bg-naito-blue-300 text-gray-100 mr-4 p-3"
        >
          menu
        </button>
        <app-menu
          v-if="isMenuOpen"
          class="absolute top-full whitespace-no-wrap mt-1"
        ></app-menu>
      </div>
      <div>
        <p v-html="$t('pages.index.hello', { name: mainStore.name })"></p>
        <p
          class="sm:hidden"
          v-html="$t('pages.index.summary_small', sensorAndSitParams)"
        ></p>
        <p
          class="hidden sm:block"
          v-html="$t('pages.index.summary', sensorAndSitParams)"
        ></p>
      </div>
    </section>

    <!-- dash manual update button -->
    <button
      :title="$t('pages.index.manual_update')"
      @click="manualDashUpdate"
      :disabled="editMode"
      class="round-action material-icons shadow-lg bg-naito-blue-300 text-gray-100 absolute bottom-0 right-0 mb-20 sm:mb-32 mr-4 sm:mr-8 p-5 z-10"
    >
      cached
    </button>

    <!-- temperature instant values -->
    <div v-if="!mainStore.isAdmin" class="flex flex-wrap justify-center">
      <section
        v-for="(resource, i) in prepedTemperatureResources"
        :key="i"
        :class="temperatureParentClasses"
      >
        <h2
          class="text-lg font-bold mb-2 text-center"
          v-text="resource.title"
        ></h2>

        <!-- checkbox -->
        <label
          v-if="editMode"
          class="material-checkbox text-naito-blue-300"
          :for="i + '-enable-input'"
        >
          <input
            type="checkbox"
            :name="i + '-enable-input'"
            :id="i + '-enable-input'"
            :checked="isTempIncluded(resource.id)"
            @change="tempToggleEdit(resource.id, $event.target.checked)"
          />
          <div
            class="material-checkbox-fake material-checkbox-fake__large"
          ></div>
        </label>

        <div v-else class="flex w-full justify-center items-center">
          <span
            v-if="
              currentTemperatures[resource.id] &&
              currentTemperatures[resource.id].state === changeState.INCREASE
            "
            class="mr-4 text-3xl text-red-600 twitching-arrow select-none"
            >↗</span
          >
          <span
            v-if="
              currentTemperatures[resource.id] &&
              currentTemperatures[resource.id].state === changeState.DECREASE
            "
            class="mr-4 text-3xl text-blue-600 twitching-arrow select-none"
            >↙</span
          >
          <span
            :class="['text-4xl', tempValueColorClass(resource.id)]"
            v-text="
              currentTemperatures[resource.id]
                ? currentTemperatures[resource.id].value
                : resource.value
            "
          ></span>
          <!-- warning if value is old -->
          <button
            v-if="
              currentTemperatures[resource.id] &&
              currentTemperatures[resource.id].isOld
            "
            class="flex items-center p-4 text-3xl popup select-none"
            data-popup-show="false"
            :data-popup-text="
              $t('pages.index.temp_outdated', {
                time: currentTemperatures[resource.id].read_at,
              })
            "
            :title="
              $t('pages.index.temp_outdated', {
                time: currentTemperatures[resource.id].read_at,
              })
            "
            @click="$event.currentTarget.dataset.popupShow = 'true'"
            @blur="$event.currentTarget.dataset.popupShow = 'false'"
          >
            <i class="material-icons text-orange-600"> warning</i>
          </button>
        </div>
        <button
          class="mt-2 action bg-naito-green-200 text-gray-100 text-center"
          :disabled="editMode"
          @click="push({ name: 'explore', query: { resources: resource.id } })"
          v-text="$t('pages.index.open_chart')"
        ></button>
      </section>
    </div>

    <!-- dashboard elements -->
    <div :class="dashboardRootClasses">
      <section
        v-for="(chart, i) in dashboard.charts"
        :key="chartKey(chart)"
        :class="chartParentClasses"
      >
        <h2
          v-if="!editMode"
          class="text-lg font-bold mb-2 text-center"
          v-text="chart.name || generateName(chart)"
        ></h2>
        <div v-else class="w-full flex mb-2">
          <!-- TODO: translate aria label -->
          <input
            aria-label="Name"
            :value="chart.name || generateName(chart)"
            @change="nameEdit(i, chart.name, $event.target.value)"
            class="min-w-0 flex-grow px-4 py-2 transparent-input mr-8"
            type="text"
            :name="i + '-name-input'"
            :id="i + '-name-input'"
          />
          <!-- edit actions -->
          <button
            :disabled="i === 0"
            @click="toFrontEdit(i)"
            class="w-12 h-12 bg-naito-blue-300 text-gray-100 simple-action rounded-l-md"
          >
            <i class="material-icons text-2xl rotate-quarter xl:rotate-none"
              >arrow_left</i
            >
          </button>
          <button
            :disabled="i === dashboard.charts.length - 1"
            @click="toBackEdit(i)"
            class="w-12 h-12 bg-naito-blue-300 text-gray-100 simple-action"
          >
            <i class="material-icons text-2xl rotate-quarter xl:rotate-none"
              >arrow_right</i
            >
          </button>
          <button
            @click="deleteEdit(i)"
            class="w-12 h-12 bg-naito-blue-300 text-gray-100 simple-action rounded-r-md"
          >
            <i class="material-icons text-lg">delete</i>
          </button>
        </div>
        <explore-chart
          v-if="chart.type === 'explore'"
          ref="charts"
          :class="chartClasses"
          :period="periods[chart.period]"
          :agregation="agregations[chart.agregation]"
          :offset="chart.offset"
          :resources="chart.resources"
          :legend="false"
        ></explore-chart>

        <signature-chart
          v-else-if="chart.type === 'signature'"
          ref="charts"
          :class="chartClasses"
          :site="chart.site"
          :temperature="chart.temperature"
          :heater="chart.heater"
          :period="signaturePeriods[chart.period]"
          :offset="chart.offset"
          :filter="chart.filter"
          :highlight="chart.highlight"
          :legend="false"
        ></signature-chart>
        <button
          class="mt-2 w-full sm:w-120 action bg-naito-green-200 text-gray-100 text-center"
          :disabled="editMode"
          @click="push({ name: chart.type, query: chart })"
          v-text="$t('pages.index.open_chart')"
        ></button>
      </section>
    </div>

    <!-- edit mode -->

    <section
      v-if="!editMode"
      class="fixed bottom-0 w-full sm:w-auto right-0 sm:mb-12 text-gray-100 rounded-l-md flex flex-col"
    >
      <button
        :disabled="
          dashboard.charts.length === 0 && temperatureResources.length === 0
        "
        @click="editMode = true"
        class="sm:rounded-l-md p-4 sm:pl-6 bg-naito-blue-300 simple-action shadow-lg-top sm:shadow-lg sm:flex-row-reverse"
      >
        <i class="material-icons text-lg mr-4 sm:mr-0 sm:ml-4">build</i>
        <span class="font-medium" v-text="$t('pages.index.edit.title')"></span>
      </button>
    </section>

    <!-- blocker -->
    <div :class="backClasses"></div>
    <!-- actions -->
    <div :class="actionsClasses">
      <button
        @click="undoEdit"
        :disabled="!editHasPrevious"
        :class="cancelClasses"
      >
        <i class="material-icons text-lg mr-4">undo</i>
        <span v-text="$t('pages.index.edit.cancel_last')"></span>
      </button>
      <button @click="confirmEdit" :class="confirmClasses">
        <i
          class="material-icons text-lg mr-4"
          v-text="editHasPrevious ? 'done_all' : 'close'"
        ></i>
        <span
          v-text="
            $t(
              editHasPrevious
                ? 'pages.index.edit.confirm_all'
                : 'pages.index.edit.quit'
            )
          "
        ></span>
      </button>
    </div>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import AppHeader from '../components/app-header.vue'
import AppMenu from '../components/app-menu.vue'

import ExploreChart from '../components/explore-chart.vue'
import SignatureChart from '../components/signature-chart.vue'
import {
  periods,
  agregations,
  generateExploreChartName,
  formatResource,
  decimalTwoFormat,
  changeState,
  alertState,
  OUTDATED_TEMP_THRESHOLD,
  generateSignatureChartName,
  signaturePeriods,
  handleNavigationError,
} from '../assets/utils'
import { Duration, DateTime } from 'luxon'

export default {
  middleware: 'needs-auth',
  head() {
    return {
      title: `${this.$t('pages.index.title')} - Meters`,
      htmlAttrs: {
        lang: this.mainStore.locale,
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.index.description'),
        },
      ],
    }
  },
  components: { AppHeader, AppMenu, ExploreChart, SignatureChart },
  async mounted() {
    await Promise.all([
      this.$getResources(),
      this.$getResourceTypes(),
      this.$getUser(),
      this.$getSensors(),
      this.$getSites(),
      this.$getAlerts(),
      this.$getMeteoLocations(),
    ])

    // don't setup temp update if user is admin
    if (this.mainStore.isAdmin) {
      return
    }

    this.updateCurrentTemperatures()

    // wait for the next 05 or 35 minute to update, then update every 30 minutes
    // as the new readings arrive
    const now = DateTime.local()
    const updateAt5 = now.minute >= 35 || now.minute < 5
    // use a random amount of seconds and milliseconds to spread requests
    // in case there are many dashboards open at once
    const second = Math.floor(Math.random() * 59)
    const millisecond = Math.floor(Math.random() * 999)
    let nextUpdateTime = now.set({
      minute: updateAt5 ? 5 : 35,
      second,
      millisecond,
    })

    if (nextUpdateTime <= now) {
      nextUpdateTime = nextUpdateTime.plus({ hour: 1 })
    }

    const waitTime = nextUpdateTime.diff(now)

    this.timeout = setTimeout(() => {
      this.updateCurrentTemperatures()
      if (this.prepedTemperatureResources.length > 0) {
        this.mainStore.showMessage(
          this.$t('pages.index.temps_updated'),
          false,
          2000
        )
      }

      this.interval = setInterval(() => {
        this.updateCurrentTemperatures()
        if (this.prepedTemperatureResources.length > 0) {
          this.mainStore.showMessage(
            this.$t('pages.index.temps_updated'),
            false,
            2000
          )
        }
      }, Duration.fromObject({ minutes: 30 }).as('milliseconds'))
    }, waitTime.as('milliseconds'))

    /*
    // code to hide tooltip only on touch & drag
    // not used because choosen to hide tooltip when not pressing
    const scrollElement = document.querySelector('#__layout > div')
    let offset = 0
    document.ontouchstart = e => {
      offset = scrollElement.scrollTop
    }

    document.ontouchend = e => {
      const hasScrolled = offset !== scrollElement.scrollTop
      if (hasScrolled) {
        EventBus.$emit('touchAndDrag')
      }
    }
    */
  },
  beforeDestroy() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  data() {
    return {
      timeout: null,
      interval: null,
      changeState,
      isMenuOpen: false,
      editMode: false,
      /**
       * @type {{[x: string]: {value: number, read_at: string, isOld: boolean, state: number, alert: number}}}
       */
      currentTemperatures: {},
    }
  },
  methods: {
    manualDashUpdate() {
      this.updateCurrentTemperatures()

      if (!Array.isArray(this.$refs.charts)) {
        return
      }

      // call member method forceUpdate of explore-chart and signature-chart
      Promise.all(this.$refs.charts.map((chart) => chart.forceUpdate())).then(
        () => {
          this.mainStore.showMessage(
            this.$t('pages.index.updated_manually'),
            false,
            2000
          )
        }
      )
    },
    updateCurrentTemperatures() {
      // don't show current temperature to admins to avoid overhead
      if (this.mainStore.isAdmin) {
        return
      }

      const now = DateTime.local()

      this.prepedTemperatureResources.forEach(async ({ id }) => {
        /**
         * @type {{id: number, value: number, read_at: string}[]}
         */
        const readings = await this.$getReadings(id, { last: 3 }, true)
        const last = readings[readings.length - 1]
        if (!this.currentTemperatures.hasOwnProperty(id)) {
          this.$set(this.currentTemperatures, id, {
            value: 0,
            read_at: '',
            isOld: false,
            state: 0,
            alert: 0,
          })
        }

        if (this.currentTemperatures[id] === undefined) {
          // prevent error happening sometimes when logging out
          return
        }

        this.currentTemperatures[id].value = `${last.value.toLocaleString(
          this.$numberLocale(),
          decimalTwoFormat
        )} °C`

        const read_at = DateTime.fromISO(last.read_at)

        this.currentTemperatures[id].read_at = read_at
          .setLocale(this.$dateLocale())
          .toFormat('dd.LL.yy HH:mm')

        this.currentTemperatures[id].isOld =
          now.minus(OUTDATED_TEMP_THRESHOLD) > read_at

        const lastValue = last.value
        const previous1 = readings[readings.length - 2].value
        const previous2 = readings[readings.length - 3].value

        if (lastValue > previous1 && lastValue > previous2) {
          this.currentTemperatures[id].state = changeState.INCREASE
        } else if (lastValue < previous1 && lastValue < previous2) {
          this.currentTemperatures[id].state = changeState.DECREASE
        } else {
          this.currentTemperatures[id].state = changeState.SAME
        }

        // check if there is an alert for the resource and if the value is outside the range
        this.currentTemperatures[id].alert = alertState.NONE
        const alerts = this.mainStore.alerts
        for (const alert of alerts) {
          if (alert.resource_id !== id) {
            continue
          }

          if (lastValue > alert.max) {
            this.currentTemperatures[id].alert = alertState.ABOVE
          } else if (lastValue < alert.min) {
            this.currentTemperatures[id].alert = alertState.BELOW
          }

          // only consider the first corresponding alert
          break
        }
      })
    },
    tempValueColorClass(id) {
      if (!this.currentTemperatures.hasOwnProperty(id)) {
        return ''
      }

      if (this.currentTemperatures[id].alert === alertState.ABOVE) {
        return 'text-red-600'
      }

      if (this.currentTemperatures[id].alert === alertState.BELOW) {
        return 'text-blue-600'
      }

      return ''
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },
    chartKey(chart) {
      return JSON.stringify(chart)
    },
    generateName(chart) {
      if (chart.type === 'explore') {
        if (!this.mainStore.dataById.resources) {
          return '...'
        }

        return generateExploreChartName(
          chart,
          this.mainStore.dataById.resources,
          this.$i18n
        )
      } else if (chart.type === 'signature') {
        if (!this.mainStore.dataById.sites) {
          return '...'
        }

        return generateSignatureChartName(
          chart,
          this.mainStore.dataById.sites,
          this.$i18n
        )
      }
    },
    nameEdit(index, oldName, newName) {
      if (oldName === newName) {
        return
      }

      const newDashboard = JSON.parse(JSON.stringify(this.dashboard))
      newDashboard.charts[index].name = newName

      this.mainStore.dashboardEdit.undoList.push(newDashboard)
    },
    toFrontEdit(index) {
      const newDashboard = JSON.parse(JSON.stringify(this.dashboard))

      const element = newDashboard.charts.splice(index, 1)
      newDashboard.charts.splice(index - 1, 0, element[0])

      this.mainStore.dashboardEdit.undoList.push(newDashboard)
    },
    toBackEdit(index) {
      const newDashboard = JSON.parse(JSON.stringify(this.dashboard))

      const element = newDashboard.charts.splice(index, 1)
      newDashboard.charts.splice(index + 1, 0, element[0])

      this.mainStore.dashboardEdit.undoList.push(newDashboard)
    },
    deleteEdit(index) {
      const newDashboard = JSON.parse(JSON.stringify(this.dashboard))

      newDashboard.charts.splice(index, 1)

      this.mainStore.dashboardEdit.undoList.push(newDashboard)
    },
    undoEdit() {
      this.mainStore.dashboardEdit.undoList.pop()
    },
    tempToggleEdit(id, checked) {
      // the resource is currently checked if not in the excluded list
      const oldChecked = this.isTempIncluded(id)

      if (checked === oldChecked) {
        return
      }

      const newDashboard = JSON.parse(JSON.stringify(this.dashboard))

      if (checked) {
        // remove from exclude list
        newDashboard.temps.exclude.splice(
          newDashboard.temps.exclude.indexOf(id),
          1
        )
      } else {
        // add to exclude list
        newDashboard.temps.exclude.push(id)
      }

      this.mainStore.dashboardEdit.undoList.push(newDashboard)
    },
    async confirmEdit() {
      // check if any changes have been made or not
      if (
        JSON.stringify(this.dashboard) ===
        JSON.stringify(this.mainStore.data.user.dashboard)
      ) {
        this.mainStore.validateDashboardChanges()
        this.editMode = false
        return
      }

      try {
        await this.$putUser(
          { dashboard: JSON.stringify(this.dashboard) },
          this.$t('api.dashboard_updated'),
          3000
        )
        // don't quit edit mode if there was an error (to not loose the changes)
        this.mainStore.validateDashboardChanges()
        this.editMode = false
        // update data in case we selecteed a new temperature resource
        this.updateCurrentTemperatures()
      } catch (e) {}
    },

    isTempIncluded(id) {
      return this.dashboard.temps.exclude.indexOf(id) === -1
    },
    /**
     * Push a new route and handle potential errors
     * @param {{route: string, query: {}}} payload the route to push
     */
    push(route) {
      this.$router.push(route).catch(handleNavigationError)
    },
  },
  computed: {
    ...mapStores(useMainStore),
    periods() {
      return periods
    },
    agregations() {
      return agregations
    },
    signaturePeriods() {
      return signaturePeriods
    },
    sensorAndSitParams() {
      const locale = this.$numberLocale()
      return {
        sensor: `${this.mainStore.numResources.toLocaleString(
          locale
        )} ${this.$tc('pages.index.sensor', this.mainStore.numResources)}`,
        site: `${this.mainStore.numSites.toLocaleString(locale)} ${this.$tc(
          'pages.index.site',
          this.mainStore.numSites
        )}`,
      }
    },
    dashboard() {
      return this.editMode
        ? this.mainStore.dashboardEditCurrent
        : this.mainStore.dashboard
    },
    temperatureResources() {
      return this.mainStore.resources.filter((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        return resourceType && resourceType.name === 'Temperature'
      })
    },
    prepedTemperatureResources() {
      return (
        this.temperatureResources
          .map((resource) => {
            let site = null

            if (this.mainStore.numSites > 1) {
              const sensor = this.mainStore.sensor(resource)
              site = this.mainStore.site(sensor)
            }

            return {
              title: formatResource(this.$i18n, resource, null, site),
              value: `... °C`,
              id: resource.id,
            }
          })
          // only show them all in edit mode, otherwise hide the exluded ones
          .filter(
            (resource) => this.editMode || this.isTempIncluded(resource.id)
          )
      )
    },

    // edit mode stuff
    backClasses() {
      return [
        'fixed',
        'z-30',
        'top-0',
        'left-0',
        'right-0',
        'w-screen',
        'h-screen',
        'bg-gray-darken',
        'transition-opacity-100',
        'pointer-events-none',
      ].concat(this.editMode ? ['opacity-1'] : ['opacity-0'])
    },
    actionsClasses() {
      return [
        'fixed',
        'bottom-0',
        'left-0',
        'right-0',
        'z-40',
        'text-gray-100',
        'flex',
        'flex-col',
        'sm:flex-row',
        'w-full',
        'transition-opacity-100',
        'pointer-events-none',
      ].concat(this.editMode ? ['opacity-1'] : ['opacity-0'])
    },
    chartParentClasses() {
      return [
        'bg-gray-100',
        'rounded-md',
        'p-4',
        'md:p-6',
        'mb-3',
        'mx-auto',
        'w-full',
        'lg:w-2/3',
        'xl:m-3',
        'xl:w-fake1/2',
        'flex',
        'flex-col',
        'items-center',
      ].concat(this.editMode ? ['z-40'] : [])
    },
    temperatureParentClasses() {
      return [
        'bg-gray-100',
        'rounded-md',
        'p-4',
        'md:p-6',
        'mb-3',
        'mx-3',
        'flex',
        'flex-col',
        'items-center',
        'min-w-2/3',
        'sm:min-w-64',
      ].concat(this.editMode ? ['z-40'] : [])
    },
    chartClasses() {
      return ['chart-height'].concat(
        this.editMode
          ? ['pointer-events-none', 'opacity-50']
          : ['pointer-events-auto', 'opacity-1']
      )
    },
    cancelClasses() {
      return [
        'bg-gray-600',
        'simple-action',
        'p-4',
        'sm:ml-auto',
        'sm:px-8',
        'sm:rounded-tl-md',
        'shadow-lg-top',
      ].concat(
        this.editMode ? ['pointer-events-auto'] : ['pointer-events-none']
      )
    },
    confirmClasses() {
      return [
        'bg-naito-green-200',
        'simple-action',
        'p-4',
        'sm:mr-auto',
        'sm:px-8',
        'sm:rounded-tr-md',
        'shadow-lg-top',
      ].concat(
        this.editMode ? ['pointer-events-auto'] : ['pointer-events-none']
      )
    },
    dashboardRootClasses() {
      return [
        'flex',
        'flex-col',
        'xl:flex-row',
        'xl:flex-wrap',
        'justify-center',
        'mb-48',
      ]
    },
    editHasPrevious() {
      return this.mainStore.dashboardEdit.undoList.length > 0
    },
  },
}
</script>
