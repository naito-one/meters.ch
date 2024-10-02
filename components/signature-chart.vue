<template>
  <basic-chart
    ref="chart"
    :title="title"
    :datasets="datasets"
    :x-axes="xAxes"
    :y-axes="yAxes"
    :tooltip-title-callback="tooltipTitleCallback"
    :tooltip-label-callback="tooltipLabelCallback"
    :tooltip-after-body-callback="tooltipAfterBodyCallback"
    :tooltip-body-align="'center'"
    :tooltips-filter="tooltipsFilter"
    :legend="legend"
    interaction-mode="nearest"
    :waiting="waiting"
    :error="!hasData"
    :error-message="
      $t('global.not_enough_data', { period: periodOffsetString })
    "
  ></basic-chart>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { DateTime } from 'luxon'
import {
  getPeriod,
  readingToXY,
  decimalDefaultFormat,
  agregateData,
  capitalize,
  reversePeriods,
  chartDefaults,
  toClosestSuffixe,
  getTooltipDateFormat,
  waitForMutations,
  agregations,
  signaturePeriods,
  cleanScatterDatasetStyle,
  noisyScatterDatasetStyle,
  idealDatasetStyle,
  getScatterAverageLine,
  noiseFilter,
  symbolToAxis,
  fixMissingData,
  reverseAgregations,
} from '../assets/utils'

import {
  SET_METEO_LOCATIONS,
  SET_RESOURCE_TYPES,
  SET_SITES,
  SET_SMALL_SCREEN,
} from '../assets/mutations'
import BasicChart from './basic-chart.vue'

export default {
  name: 'SignatureChart',
  components: { BasicChart },
  props: {
    site: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    heater: {
      type: Number,
      required: true,
    },
    period: {
      type: Number,
      required: true,
    },
    offset: {
      type: Number,
      required: true,
    },
    filter: {
      type: Number,
      required: true,
    },
    highlight: {
      type: Number,
      required: true,
    },
    legend: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      // auto calculated agregation based on period
      agregation: 0,
      hasData: true,
      waiting: true,
      datasets: [],
      consumptionByAverageTemp: null,
      symbol: '',
      title: {
        display: true,
        text: '...',
        position: 'left',
        font: {
          family: chartDefaults.fontFamily,
          size: chartDefaults.fontSize,
          weight: 'normal',
        },
        padding: 10,
      },

      xAxes: [
        {
          type: 'linear',
          gridLines: false,
          ticks: {
            precision: 2,
            maxTicksLimit: 24,
            fontColor: chartDefaults.fontColor,
            fontSize: chartDefaults.fontSize,
            padding: 18,

            callback: (tick) => {
              return `${tick} °C`
            },
          },
        },
      ],
      yAxes: [
        {
          display: 'auto',
          gridLines: false,
          offset: true,
          ticks: {
            precision: 0,
            maxTicksLimit: 7,
            fontColor: chartDefaults.fontColor,
            fontSize: chartDefaults.fontSize,
            padding: 18,
          },
        },
      ],

      tooltipTitleCallback: (tooltipItems, data) => {
        /*
        if (tooltipItems.length === 0) {
          return
        }

        const tooltipItem = tooltipItems[0]

        const temperature = tooltipItem.xLabel.toLocaleString(
          this.$numberLocale(),
          decimalDefaultFormat
        )

        const result = toClosestSuffixe(tooltipItem.yLabel)
        const heater = result.number.toLocaleString(
          this.$numberLocale(),
          decimalDefaultFormat
        )

        return `${this.$t(
          `consumption_agregations.${reverseAgregations[this.agregation]}`
        )}: ${heater} ${result.unit + this.symbol}\n${this.$t(
          'pages.signature.download.avg_temp'
        )}: ${temperature} °C`
        */
        if (tooltipItems.length === 0) {
          return
        }

        const tooltipItem = tooltipItems[0]

        const format = getTooltipDateFormat(this.agregation, this.period)
        const date =
          data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].z
        // add spaces before to make room between the color box and the text
        return `${capitalize(
          DateTime.fromISO(date).setLocale(this.$dateLocale()).toFormat(format)
        )}`
      },

      tooltipLabelCallback: (tooltipItem, data) => {
        /*
        const format = getTooltipDateFormat(this.agregation, this.period)
        const date =
          data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].z
        // add spaces before to make room between the color box and the text
        return `  ${capitalize(
          DateTime.fromISO(date).setLocale(this.$dateLocale()).toFormat(format)
        )}`
        */
        return null
      },

      tooltipAfterBodyCallback: (tooltipItems, data) => {
        if (tooltipItems.length === 0) {
          return ''
        }

        const tooltipItem = tooltipItems[0]

        const temperature = tooltipItem.xLabel.toLocaleString(
          this.$numberLocale(),
          decimalDefaultFormat
        )

        const result = toClosestSuffixe(tooltipItem.yLabel)
        const heater = result.number.toLocaleString(
          this.$numberLocale(),
          decimalDefaultFormat
        )

        return [
          this.$t(
            `consumption_agregations.${reverseAgregations[this.agregation]}`
          ),
          `${heater} ${result.unit + this.symbol}`,
          this.$t('pages.signature.download.avg_temp'),
          `${temperature} °C`,
        ]
      },

      tooltipsFilter: (tooltipItem) => {
        return tooltipItem.datasetIndex !== 2
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

      // get site meteo readings
      const site = this.mainStore.site({ site_id: this.site })
      const meteoLocation = this.mainStore.meteoLocation(site)

      const meteoReadings = await this.$getMeteoReadings(
        meteoLocation.id,
        fromTo,
        ignoreCache
      )

      // get temperature readings
      const temperatureReadings = await this.$getReadings(
        this.temperature,
        fromTo,
        ignoreCache
      )
      // get heater readings
      const heaterReadings = await this.$getReadings(
        this.heater,
        fromToSumResource,
        ignoreCache
      )

      if (
        meteoReadings.length === 0 ||
        temperatureReadings.length === 0 ||
        heaterReadings.length === 0
      ) {
        this.datasets = []
        this.hasData = false

        this.$emit('currentData', {
          datasets: [],
          hasData: this.hasData,
        })

        return
      }

      // agregate temperatures based on signature period
      // weekly signature: daily averages
      // monthly signature: daily averages
      // yearly signature: weekly averages
      const agregation =
        this.period === signaturePeriods['week']
          ? agregations['hour']
          : this.period === signaturePeriods['month']
          ? agregations['day']
          : agregations['week']

      // store agregation to compute dataset labels
      this.agregation = agregation
      // update the title
      this.title.text = this.$t(
        `consumption_agregations.${reverseAgregations[this.agregation]}`
      )

      const agregatedMeteoReadings = agregateData(
        meteoReadings.map(readingToXY),
        agregation,
        'avg'
      )

      const agregatedTemperatureReadings = agregateData(
        temperatureReadings.map(readingToXY),
        agregation,
        'avg'
      )

      const agregatedHeaterReadings = agregateData(
        heaterReadings.map(readingToXY),
        agregation,
        'sum'
      )

      const meteoReadingsLength = agregatedMeteoReadings.length
      const temperatureReadingsLength = agregatedTemperatureReadings.length
      const heaterReadingsLength = agregatedHeaterReadings.length

      // we need at least two values of each in agregated form to make the line
      if (
        meteoReadingsLength <= 2 ||
        temperatureReadingsLength <= 2 ||
        heaterReadingsLength <= 2
      ) {
        this.datasets = []
        this.hasData = false

        this.$emit('currentData', {
          datasets: [],
          hasData: this.hasData,
        })

        return
      }

      const allData = [
        agregatedMeteoReadings,
        agregatedTemperatureReadings,
        agregatedHeaterReadings,
      ]

      // if they are not all of equal length
      // fix missing data points
      if (
        meteoReadingsLength !== temperatureReadingsLength ||
        temperatureReadingsLength !== heaterReadingsLength
      ) {
        const biggestData = allData.reduce((biggest, data) =>
          data.length > biggest.length ? data : biggest
        )

        allData.forEach((data, i) => {
          // ignore complete data
          if (data.length === biggestData.length) {
            return
          }

          allData[i] = fixMissingData(biggestData, data)
        })
      }

      // compute difference. round at two decimals
      const temperatureDiff = Array.from(
        new Array(allData[0].length),
        (_, i) => ({
          x: allData[1][i].x,
          y: +(allData[1][i].y - allData[0][i].y).toFixed(2),
        })
      )

      // first dataset: isolated points based on averages of smaller portions than "period"
      // sorted by average temp diff smallest to biggest
      this.consumptionByAverageTemp = Array.from(
        new Array(allData[2].length),
        (_, i) => ({
          x: temperatureDiff[i].y,
          y: allData[2][i].y,
          // keep the timestamp to include it in the tooltip
          z: allData[2][i].x,
        })
      )
        // if we were missing any data along the way, x will be NaN
        // remove it here because it is useless on the chart
        .filter((point) => !isNaN(point.x))
        .sort((a, b) => a.x - b.x)

      await this.updateUserFilter()
    },
    async updateUserFilter() {
      if (this.consumptionByAverageTemp === null) {
        return
      }

      const newDatasets = []

      // the user has a control to hide noise and get "closer" to the chart
      const noiseFiltered = noiseFilter(
        this.consumptionByAverageTemp,
        this.filter
      )

      // separete noisy data from clean one to show the user where problems occure
      // the user also has control to how much data is highlighted
      const highlighted = noiseFilter(noiseFiltered.cleanData, this.highlight)

      // use clean data to draw the line
      const { slope, intercept } = getScatterAverageLine(highlighted.cleanData)

      // get currently hidden datasets
      let previousHiddenStatus = [false, false, false]
      if (this.datasets.length === 3 && this.$refs.chart.chart !== null) {
        try {
          previousHiddenStatus = previousHiddenStatus.map(
            (_, i) => !this.$refs.chart.chart.isDatasetVisible(i)
          )
        } catch (e) {
          // if we can't call isDatasetVisible, ignore it
        }
      }

      newDatasets.push({
        label: this.$t('pages.signature.chart.avg_clean'),
        type: 'scatter',
        data: highlighted.cleanData,
        yAxisID: 0,
        hidden: previousHiddenStatus[0],
        ...cleanScatterDatasetStyle,
      })

      newDatasets.push({
        label: this.$t('pages.signature.chart.avg_noisy'),
        type: 'scatter',
        data: highlighted.noisyData,
        yAxisID: 0,
        hidden: previousHiddenStatus[1],
        ...noisyScatterDatasetStyle,
      })

      // second dataset: average consumption line with 2 points
      const firstX = this.consumptionByAverageTemp[0].x
      const lastX = this.consumptionByAverageTemp[
        this.consumptionByAverageTemp.length - 1
      ].x

      newDatasets.push({
        label: this.$t('pages.signature.chart.ideal_line'),
        data: [
          {
            x: firstX,
            y: slope * firstX + intercept,
          },
          {
            x: lastX,
            y: slope * lastX + intercept,
          },
        ],
        yAxisID: 0,
        hidden: previousHiddenStatus[2],
        ...idealDatasetStyle,
      })

      // updates the underlying chart
      this.datasets = newDatasets
      this.hasData = true

      this.$emit('currentData', {
        datasets: newDatasets,
        hasData: this.hasData,
      })
    },
    reTranslate() {
      this.title.text = this.$t(
        `consumption_agregations.${reverseAgregations[this.agregation]}`
      )
      if (this.datasets.length !== 3) {
        return
      }

      // updates the underlying chart
      this.$set(
        this.datasets[0],
        'label',
        this.$t('pages.signature.chart.avg_clean')
      )
      this.$set(
        this.datasets[1],
        'label',
        this.$t('pages.signature.chart.avg_noisy')
      )
      this.$set(
        this.datasets[2],
        'label',
        this.$t('pages.signature.chart.ideal_line')
      )
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
      if (!this.mainStore.hasResourceTypes) {
        return
      }

      const resourceType = this.mainStore.resourceType(
        this.mainStore.dataById.resources[this.heater]
      )

      // keep symbol for tooltip
      this.symbol = resourceType.symbol
      // updates the underlying chart
      this.yAxes = [symbolToAxis(resourceType.symbol, 'left', false, true)]

      // by default ticks are shown
      if (this.mainStore.smallScreen) {
        this.hideYTicks()
      }
    },
    waitForData() {
      const mutationsToWaitFor = []

      if (!this.mainStore.hasMeteoLocations) {
        mutationsToWaitFor.push(SET_METEO_LOCATIONS)
      }

      if (!this.mainStore.hasSites) {
        mutationsToWaitFor.push(SET_SITES)
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
    site(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
        return
      }

      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    temperature(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
        return
      }

      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    heater(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
        return
      }

      this.waitForData().then(() => {
        this.waiting = true
        this.updateAxes()
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    period(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
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

      if (!this.isQueryValid) {
        return
      }

      this.waitForData().then(() => {
        this.waiting = true
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    },
    filter(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
        return
      }

      this.waiting = true
      this.updateUserFilter().then(() => (this.waiting = false))
    },
    highlight(to, from) {
      if (to === from) {
        return
      }

      if (!this.isQueryValid) {
        return
      }

      this.waiting = true
      this.updateUserFilter().then(() => (this.waiting = false))
    },
    locale(to, from) {
      if (to === from) {
        return
      }
      this.reTranslate()
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
    if (this.isQueryValid) {
      this.waitForData().then(() => {
        this.waiting = true
        this.updateAxes()
        this.updateRawData().then(() => (this.waiting = false), console.error)
      })
    }

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
    isQueryValid() {
      return this.site !== -1 && this.temperature !== -1 && this.heater !== -1
    },
  },
}
</script>
