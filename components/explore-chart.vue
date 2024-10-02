<template>
  <basic-chart
    :datasets="datasets"
    :x-axes="xAxes"
    :y-axes="yAxes"
    :tooltip-title-callback="tooltipTitleCallback"
    :tooltip-label-callback="tooltipLabelCallback"
    :legend="legend"
    :waiting="waiting"
    :error="!hasData"
    :error-message="$t('global.no_data', { period: periodOffsetString })"
  ></basic-chart>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { DateTime } from 'luxon'
import {
  getPeriod,
  readingToXY,
  datasetStyle,
  decimalDefaultFormat,
  agregateData,
  reverseAgregations,
  formatResource,
  capitalize,
  reversePeriods,
  chartDefaults,
  fixMissingData,
  toClosestSuffixe,
  getTooltipDateFormat,
  waitForMutations,
  symbolToAxis,
} from '../assets/utils'

import {
  SET_RESOURCES,
  SET_RESOURCE_TYPES,
  SET_SMALL_SCREEN,
} from '../assets/mutations'
import BasicChart from './basic-chart.vue'

export default {
  name: 'ExploreChart',
  components: { BasicChart },
  props: {
    period: {
      type: Number,
      required: true,
    },
    agregation: {
      type: Number,
      required: true,
    },
    offset: {
      type: Number,
      required: true,
    },
    resources: {
      type: Array,
      default: () => [],
    },
    legend: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      previousResources: null,
      rawData: null,
      hasData: true,
      waiting: true,
      datasets: [],
      xAxes: [
        {
          type: 'time',
          time: {
            unit: reverseAgregations[this.agregation],
            round: reverseAgregations[this.agregation],

            displayFormats: {
              // custom formats to compat default non-swiss & try to make them compatible with luxon
              hour: 'HH:mm',
              week: 'dd LLL yyyy',
              day: 'dd LLL',
              month: 'LLL yyyy',
            },
          },
          adapters: {
            date: {
              locale: this.$dateLocale(),
            },
          },
          gridLines: false,
          ticks: {
            fontColor: chartDefaults.fontColor,
            fontSize: chartDefaults.fontSize,
            padding: 18,
          },
        },
      ],
      yAxes: [
        {
          display: 'auto',
          gridLines: false,
          offset: true,
          ticks: {
            // beginAtZero: true,
            precision: 0,
            maxTicksLimit: 7,
            fontColor: chartDefaults.fontColor,
            fontSize: chartDefaults.fontSize,
            padding: 18,
          },
        },
      ],

      tooltipTitleCallback: (tooltipItems, data) => {
        const format = getTooltipDateFormat(this.agregation, this.period)
        return capitalize(
          DateTime.fromISO(tooltipItems[0].label)
            .setLocale(this.$dateLocale())
            .toFormat(format)
        )
      },

      tooltipLabelCallback: (tooltipItem, data) => {
        const label =
          data.datasets[tooltipItem.datasetIndex].resource.description
        const symbol =
          data.datasets[tooltipItem.datasetIndex].resourceType.symbol

        const rawValue = parseFloat(tooltipItem.value)

        if (symbol !== '°C') {
          const result = toClosestSuffixe(rawValue)
          // add spaces before to make room between the color box and the text
          return `  ${label}: ${result.number.toLocaleString(
            this.$numberLocale(),
            decimalDefaultFormat
          )} ${result.unit + symbol}`
        }

        const value = rawValue.toLocaleString(
          this.$numberLocale(),
          decimalDefaultFormat
        )

        // add spaces before to make room between the color box and the text
        return `  ${label}: ${value} ${symbol}`
      },
    }
  },
  methods: {
    async updateRawData(ignoreCache) {
      const now = DateTime.local()
      const fromTo = getPeriod(now, this.period, this.offset)
      const fromToSumResource = {
        from: fromTo.from,
        // adding a millisecond includes the value for the next round hour
        to: fromTo.to.plus({ millisecond: 1 }),
      }

      // set to null to prevent an agregation update while we download new data
      this.rawData = null
      const newRawData = []

      for (const i in this.resources) {
        const resource = this.mainStore.resource({
          resource_id: this.resources[i],
        })

        const resourceType = this.mainStore.resourceType(resource)

        // get next hour for sum resources to compute diff
        const isSumResource =
          resourceType && resourceType.aggregation_function === 'sum'

        const data = await this.$getReadings(
          this.resources[i],
          isSumResource ? fromToSumResource : fromTo,
          ignoreCache
        )

        let site = null

        if (this.mainStore.numSites > 1) {
          const sensor = this.mainStore.sensor(resource)
          site = this.mainStore.site(sensor)
        }

        newRawData.push({
          label: formatResource(this.$i18n, resource, resourceType, site),
          data: data.map(readingToXY),
          // use default axis if the axes are not yet created
          yAxisID: this.yAxes.length === 1 ? 0 : resourceType.symbol,
          resource,
          resourceType,
          site,
          ...datasetStyle[i % datasetStyle.length],
        })
      }
      this.rawData = newRawData
      await this.updateAgregation()
    },
    async updateAgregation() {
      if (this.rawData === null || this.rawData.length === 0) {
        return
      }

      /**
       * @type {{data: []}[]}
       */
      const newDatasets = this.rawData.map((dataset) => {
        if (!dataset.resourceType) {
          return dataset
        }

        const data = agregateData(
          dataset.data,
          this.agregation,
          dataset.resourceType.aggregation_function
        )

        return {
          ...dataset,
          data,
          pointRadius: data.length === 1 ? 4 : 0,
        }
      })

      // fix any potential missing data points
      // because Chart.js can't handle it and it messes the order
      const completeDataset = newDatasets.reduce((carry, dataset) =>
        dataset.data.length > carry.data.length ? dataset : carry
      )

      const fixedDatasets = newDatasets.map((dataset) => {
        // ignore the complete dataset
        if (dataset === completeDataset) {
          return dataset
        }

        // return a new dataset
        return {
          ...dataset,
          data: fixMissingData(completeDataset.data, dataset.data),
        }
      })

      this.xAxes[0].time.unit = reverseAgregations[this.agregation]
      this.xAxes[0].time.round = reverseAgregations[this.agregation]

      // updates the underlying chart
      this.datasets = fixedDatasets

      this.hasData =
        this.datasets.length > 0 &&
        this.datasets.some((dataset) => dataset.data.length > 0)

      this.$emit('currentData', {
        datasets: fixedDatasets,
        hasData: this.hasData,
      })
    },
    reTranslate() {
      // updates the underlying chart
      this.datasets.forEach((dataset) => {
        this.$set(
          dataset,
          'label',
          formatResource(
            this.$i18n,
            dataset.resource,
            dataset.resourceType,
            dataset.site
          )
        )
      })

      // update locale for luxon adapter
      // updates the underlying chart
      this.$set(this.xAxes[0].adapters.date, 'locale', this.$dateLocale())
    },
    hideYTicks() {
      this.yAxes.forEach((axes) => {
        // updates the underlying chart
        this.$set(axes.ticks, 'display', false)
      })
    },
    showYTicks() {
      this.yAxes.forEach((axes) => {
        // updates the underlying chart
        this.$set(axes.ticks, 'display', true)
      })
    },
    updateAxes() {
      if (!this.resourceTypes) {
        return
      }

      // updates the underlying chart
      // find unique symbols and convert them to an axis each
      this.yAxes = this.resourceTypes
        .map((resourceType) => resourceType.symbol)
        .filter((symbol, i, array) => array.indexOf(symbol) === i)
        .map((symbol, i) =>
          symbolToAxis(
            symbol,
            i === 0 ? 'right' : 'left',
            symbol !== '°C',
            symbol !== '°C',
            symbol,
            i
          )
        )

      // update the axis used by each dataset
      this.datasets.forEach((dataset) => {
        // updates the underlying chart
        this.$set(dataset, 'yAxisID', dataset.resourceType.symbol)
      })

      // by default ticks are shown
      if (this.mainStore.smallScreen) {
        this.hideYTicks()
      }
    },
    waitForData() {
      const mutationsToWaitFor = []

      if (!this.mainStore.hasResources) {
        mutationsToWaitFor.push(SET_RESOURCES)
      }

      if (!this.mainStore.hasResourceTypes) {
        mutationsToWaitFor.push(SET_RESOURCE_TYPES)
      }

      if (mutationsToWaitFor.length === 0) {
        this.waiting = false
        return Promise.resolve()
      }

      this.waiting = true

      // TODO: I'm in trouble
      return waitForMutations(this.$store, mutationsToWaitFor).then(() => {
        this.waiting = false
      })
    },
    forceUpdate() {
      return this.waitForData().then(() => {
        this.waiting = true
        this.updateAxes()
        this.updateRawData(true).then(
          () => (this.waiting = false),
          console.error
        )
      })
    },
  },
  watch: {
    period(to, from) {
      if (to === from) {
        return
      }
      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    offset(to, from) {
      if (to === from) {
        return
      }
      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    resources(to) {
      // from & to array are the same object, so trick to be able to compare to the true old value
      if (this.previousResources) {
        if (JSON.stringify(to) === this.previousResources) {
          return
        }
      }

      this.previousResources = JSON.stringify(to)
      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    agregation(to, from) {
      if (to === from) {
        return
      }
      this.waiting = true
      this.updateAgregation().then(() => (this.waiting = false))
    },
    locale(to, from) {
      if (to === from) {
        return
      }
      this.reTranslate()
    },
    resourceTypes() {
      this.updateAxes()
    },
    smallScreen() {
      // show Y ticks only when the screen is large enough
      if (this.mainStore.smallScreen) {
        this.hideYTicks()
      } else {
        this.showYTicks()
      }
    },
  },
  mounted() {
    this.waitForData().then(() => {
      this.waiting = true
      this.updateAxes()
      this.updateRawData().then(() => (this.waiting = false), console.error)
    })

    if (this.mainStore.smallScreen) {
      this.hideYTicks()
    } else {
      this.showYTicks()
    }
  },
  computed: {
    ...mapStores(useMainStore),
    smallScreen() {
      return this.mainStore.smallScreen
    },
    periodOffsetString() {
      return this.$tc(
        'period_offsets.' + reversePeriods[this.period],
        this.offset,
        { count: this.offset }
      )
    },
    locale() {
      return this.mainStore.locale
    },
    resourceTypes() {
      return this.mainStore.data.resourceTypes
    },
  },
}
</script>
