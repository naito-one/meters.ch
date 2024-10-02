import { DateTime, Duration } from 'luxon'

import VueRouter from 'vue-router'
const { isNavigationFailure, NavigationFailureType } = VueRouter

/**
 * Map from the simple language local to the full locale for number formatting
 */
export const numberLocale = {
  en: 'en-ch',
  fr: 'de-ch',
  de: 'de-ch',
}

/**
 * Map from the simple language local to the full locale for date formatting
 */
export const dateLocale = {
  en: 'en-ch',
  fr: 'fr-ch',
  de: 'de-ch',
}

export const changeState = {
  INCREASE: 0,
  SAME: 1,
  DECREASE: 2,
}

export const alertState = {
  ABOVE: 0,
  NONE: 1,
  BELOW: 2,
}

export const HEATING_RESOURCE_TYPES = ['Electricity', 'Gas', 'Oil']

export const SMALL_SCREEN_BREAKPOINT = 640

/**
 * How old must the dashboard teemp be before it is considered outdated
 */
export const OUTDATED_TEMP_THRESHOLD = Duration.fromObject({ hours: 1 })

/**
 *
 * @param {import('vue-i18n').default} i18n
 * @param {{description: string}} resource
 * @param {{name: string}} resourceType optional
 * @param {{name: string}} site optional
 */
export function formatResource(i18n, resource, resourceType, site) {
  const values = []

  if (resourceType) {
    values.push(i18n.t('features.resource_types.' + resourceType.name))
  }

  values.push(resource.description)

  if (site) {
    values.push(site.name)
  }

  return values.join(', ')
}

/**
 * Index an array of elements with ids on their ids in an object
 * @param {{id:number}[]} arrayWithIds
 */
export function indexOnId(arrayWithIds) {
  const output = {}

  const n = arrayWithIds.length

  for (let i = 0; i < n; ++i) {
    const el = arrayWithIds[i]
    output[el.id] = el
  }

  return output
}
/**
 * @param {{[x: string]: any}} input
 * @returns {string[]}
 */
function swapKeyValues(input) {
  const output = []
  Object.entries(input).forEach(([key, value]) => (output[value] = key))
  return output
}

export const agregations = {
  hour: 0,
  day: 1,
  week: 2,
  month: 3,
}

export const reverseAgregations = swapKeyValues(agregations)

export const periods = {
  day: 0,
  week: 1,
  month: 2,
  year: 3,
}

export const reversePeriods = swapKeyValues(periods)

export const signaturePeriods = {
  week: 1,
  month: 2,
  year: 3,
}

export const reverseSignaturePeriods = swapKeyValues(signaturePeriods)

/**
 * Get a period representing the last 30 days
 * @param {import('luxon').DateTime} reference
 */
export function last30DaysPeriod(reference) {
  // to improve cache, round the times
  return {
    from: reference.minus({ days: 30 }).endOf('hour'),
    to: reference.endOf('hour'),
  }
}

/**
 * Get a period representing the last 7 days
 * @param {import('luxon').DateTime} reference
 */
export function last7DaysPeriod(reference) {
  // to improve cache, round the times
  return {
    from: reference.minus({ days: 7 }).endOf('hour'),
    to: reference.endOf('hour'),
  }
}

/**
 * Scroll an element to it's top
 * @param {HTMLElement} el
 */
export function scrollToTop(el) {
  el.scrollTop = 0
}

/**
 * Scroll an element to it's bottom
 * @param {HTMLElement} el
 */
export function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight
}

/**
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 *
 * @param {{}} element
 * @param {{[x:number]:{}}} ownedResources the ressources owned if available
 */
function fixExploreChart(element, ownedResources) {
  // check resources is an array
  if (!Array.isArray(element['resources'])) {
    return null
  }

  // convert to numbers and filter resources that are not number or not owned resources
  // if the owned ressources are not available, ignore that check
  const resources = element['resources']
    .map((id) => parseInt(id))
    .filter((id) => {
      return !isNaN(id) && (!ownedResources || ownedResources[id] !== undefined)
    })

  // check we have at least one resource left
  if (resources.length === 0) {
    return null
  }

  // take the period or the default if invalid
  const period =
    reversePeriods.indexOf(element['period']) === -1
      ? reversePeriods[0]
      : element['period']

  // take the agregation or the default if invalid
  const agregation =
    reverseAgregations.indexOf(element['agregation']) === -1
      ? reverseAgregations[0]
      : element['agregation']

  // clamp the offset or reset it to 0
  const offset = clamp(parseInt(element['offset']), 0, 365) || 0

  // get the name or use an empty string
  const name = element.hasOwnProperty('name') ? String(element['name']) : ''

  return {
    type: 'explore',
    name,
    offset,
    period,
    agregation,
    resources,
  }
}

/**
 *
 * @param {{}} element
 * @param {{[x:number]:{}}} ownedResources the ressources owned if available
 * @param {{[x:number]:{}}} ownedSites the sites owned if available
 */
function fixSignatureChart(element, ownedResources, ownedSites) {
  // convert to numbers and filter resources that are not number or not owned resources
  // if the owned ressources are not available, ignore that check
  const site = parseInt(element['site'])

  if (isNaN(site) || (ownedSites && ownedSites[site] === undefined)) {
    return null
  }

  const temperature = parseInt(element['temperature'])

  if (
    isNaN(temperature) ||
    (ownedResources && ownedResources[temperature] === undefined)
  ) {
    return null
  }

  const heater = parseInt(element['heater'])

  if (
    isNaN(heater) ||
    (ownedResources && ownedResources[heater] === undefined)
  ) {
    return null
  }

  // take the period or the default if invalid
  const period =
    reverseSignaturePeriods.indexOf(element['period']) === -1
      ? reverseSignaturePeriods[2]
      : element['period']

  // clamp the offset or reset it to 0
  const parsedOffset = parseInt(element['offset'])
  const offset = isNaN(parsedOffset) ? 1 : clamp(parsedOffset, 0, 53)

  // clamp the filter or reset it to 0
  const parsedFilter = parseFloat(element['filter'])
  const filter = isNaN(parsedFilter) ? 0 : clamp(parsedFilter, 0, 1)

  // clamp the highlight or reset it to 0.2
  const parsedHighlight = parseFloat(element['highlight'])
  const highlight = isNaN(parsedHighlight) ? 0.2 : clamp(parsedHighlight, 0, 1)

  // get the name or use an empty string
  const name = element.hasOwnProperty('name') ? String(element['name']) : ''

  return {
    type: 'signature',
    name,
    site,
    temperature,
    heater,
    period,
    offset,
    filter,
    highlight,
  }
}

/**
 * Convert the given potential dashboard into a valid dashboard object
 * @param {any} dashboard The current dashboard as a parsed JSON string
 * @param {{[x:number]:{}}} ownedResources the ressources owned if available
 * @param {{[x:number]:{}}} ownedSites the sites owned if available
 * @returns {{ exploreCharts: {}[], signatureCharts: {}[], temps: { exclude: [] }}}
 */
export function fixDashboard(dashboard, ownedResources, ownedSites) {
  const out = defaultDashboard()

  let inputCharts = []

  if (Array.isArray(dashboard)) {
    // if the dashboard is an array, it is an old version. update it
    inputCharts = dashboard
  } else if (
    dashboard.hasOwnProperty('charts') &&
    Array.isArray(dashboard.charts)
  ) {
    inputCharts = dashboard.charts
  } else {
    // given dashboard is invalid
    return out
  }

  // handle excluded temps
  if (
    dashboard.hasOwnProperty('temps') &&
    Array.isArray(dashboard.temps.exclude)
  ) {
    const inputExcludedTemps = dashboard.temps.exclude
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id))

    out.temps.exclude = inputExcludedTemps
  }

  // handle charts
  inputCharts.forEach((element) => {
    // check all elements are objects
    if (typeof element !== 'object' || element === null) {
      return
    }

    // check type. old dashboard didn't include a type
    if (!element.hasOwnProperty('type') || element.type === 'explore') {
      // old dashboard, consider chart an "explore chart"
      const chart = fixExploreChart(element, ownedResources)
      if (chart !== null) {
        out.charts.push(chart)
      }
    } else if (element.type === 'signature') {
      const chart = fixSignatureChart(element, ownedResources, ownedSites)
      if (chart !== null) {
        out.charts.push(chart)
      }
    }

    // ignore any unknown type
  })

  return out
}

/**
 * Get a from-to period based on a reference time, period name and offset
 * @param {import('luxon').DateTime} reference
 * @param {number} period
 * @param {number} offset
 */
export function getPeriod(reference, period, offset) {
  const periodName = reversePeriods[period]

  // round times to improve cache
  if (offset === 0) {
    return {
      from: reference.startOf(periodName).toUTC(),
      to: reference.endOf('hour').toUTC(),
    }
  }

  const offseted = reference.minus({ [periodName]: offset })

  return {
    from: offseted.startOf(periodName).toUTC(),
    to: offseted.endOf(periodName).toUTC(),
  }
}

/**
 * Transform a reading object from the API into an XY object for Chart.js
 * @param {{read_at: string, value: number}} reading
 */
export function readingToXY(reading) {
  return {
    x: reading['read_at'],
    y: reading['value'],
  }
}

export const datasetColors = [
  '#459090',
  '#194242',
  '#9C5A8A',
  '#5C5323',
  '#DBC75E',
  '#173242',
  '#9C5658',
  '#41728F',
  '#5C5B20',
  '#74DBD5',
  '#86A2A0',
  '#4C8F8B',
  '#B6DBD9',
  '#315C59',
]

export const datasetStyle = datasetColors.map((color) => ({
  backgroundColor: 'transparent',
  borderColor: color,
  borderWidth: 3,
  pointRadius: 0,
  pointHoverRadius: 6,
  pointBorderColor: 'transparent',
  pointBackgroundColor: color,
}))

export const cleanScatterDatasetStyle = {
  backgroundColor: 'transparent',
  borderColor: datasetColors[0],
  borderWidth: 0,
  pointRadius: 3,
  pointHoverRadius: 6,
  pointBorderColor: 'transparent',
  pointBackgroundColor: datasetColors[0],
}

// orange-600
export const noisyScatterDatasetStyle = {
  backgroundColor: 'transparent',
  borderColor: '#DD6B20',
  borderWidth: 0,
  pointRadius: 3,
  pointHoverRadius: 6,
  pointBorderColor: 'transparent',
  pointBackgroundColor: '#DD6B20',
}

export const idealDatasetStyle = {
  backgroundColor: 'transparent',
  borderColor: datasetColors[1],
  borderWidth: 3,
  pointRadius: 0,
  pointHoverRadius: 0,
  pointBorderColor: 'transparent',
  pointBackgroundColor: datasetColors[1],
}

export const decimalDefaultFormat = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}

export const decimalTwoFormat = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}

const agregationFactors = {
  [agregations['hour']]: ['hour', 'day', 'year'],
  [agregations['day']]: ['day', 'year'],
  // see https://momentjs.com/docs/#/get-set/week-year/
  [agregations['week']]: ['weekNumber', 'weekYear'],
  [agregations['month']]: ['month', 'year'],
  // [agregations['quarter']]: [ 'quarter', 'year' ],
  // [agregations['year']]: [ 'year' ],
}

/**
 * Verifies if all values in `a` are the same as their corresponding indices in `b`
 * @param {number[]} a an array of numbers
 * @param {number[]} b an array of numbers of the same length as `a`
 * @returns {boolean} true if all values in `a` are strictly equal to the values in `b`
 */
function allEqual(a, b) {
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 *
 * @param {{x: string, y: number}[]} array
 * @param {number} agregation
 */
function chunkForAgregation(array, agregation) {
  const chunks = []
  const length = array.length

  const factors = agregationFactors[agregation]

  const retrievedFactors = array.map((value) => {
    const date = DateTime.fromISO(value.x)
    return factors.map((factor) => date.get(factor))
  })

  for (let i = 1, lastChunkEnd = 0; i <= length; ++i) {
    // if we reached the end, just chunk what remains
    // when the time period changes, cut from the last cut to the data point before this one
    if (
      i === length ||
      !allEqual(retrievedFactors[i - 1], retrievedFactors[i])
    ) {
      // add a chunk. end is non-inclusive, so the current item is not in the chunk
      chunks.push(array.slice(lastChunkEnd, i))
      lastChunkEnd = i
    }
  }

  return chunks
}

/**
 *
 * @param {{x: string, y: number}[]} data
 * @param {number} agregation
 * @param {'sum' | 'avg'} agregationFunction
 */
export function agregateData(data, agregation, agregationFunction) {
  if (data.length === 0) {
    return []
  }

  // nothing to do with zero or one data point
  if (data.length === 1) {
    // if it is a sum type and there is a single data point, we cannot determine the actual value
    // in that case, return nothing
    if (agregationFunction === 'sum') {
      return []
    }

    return [
      {
        x: DateTime.fromISO(data[0].x)
          .startOf(reverseAgregations[agregation])
          .toISO(),
        y: data[0].y,
      },
    ]
  }

  let out = []
  if (agregationFunction === 'sum') {
    // turn the absolute data to relative data
    for (let i = 0; i < data.length - 1; ++i) {
      out.push({ x: data[i].x, y: data[i + 1].y - data[i].y })
    }
  } else {
    out = data
  }

  const chunks = chunkForAgregation(out, agregation)

  const summedUp = chunks.map((chunk) => {
    return {
      x: DateTime.fromISO(chunk[0].x)
        .startOf(reverseAgregations[agregation])
        .toISO(),
      y: +chunk.reduce((carry, chunk) => carry + chunk.y, 0).toFixed(4),
    }
  })

  if (agregationFunction === 'avg') {
    return summedUp.map((value, i) => {
      return {
        x: value.x,
        y: +(value.y !== 0 ? value.y / chunks[i].length : 0).toFixed(4),
      }
    })
  } else {
    return summedUp
  }
}

/**
 * Insert missing datapoints as NaN and return a new array
 * @param {{x: string, y: number}[]} completeData
 * @param {{x: string, y: number}[]} dataToFix
 */
export function fixMissingData(completeData, dataToFix) {
  const out = [...dataToFix]

  for (let i = 0; i < completeData.length; ++i) {
    const expectedX = completeData[i].x
    const data = out[i]

    // if we reached the end, data will be undefined
    // if there is a date mismatch, we know the data to fix is missing at least one value
    if (data && data.x === expectedX) {
      continue
    }

    out.splice(i, 0, { x: expectedX, y: NaN })
  }

  return out
}

/**
 *
 * @param {string} string
 */
export function capitalize(string) {
  return string[0].toUpperCase() + string.substr(1)
}

export const chartDefaults = {
  fontColor: '#212121',
  fontSize: 16,
  fontFamily: 'Raleway, sans-serif',
}

/**
 * Pluck only certain keys from the object
 * @param {{[x:string] : any}} object
 * @param  {...string} keys
 */
export function pluck(object, ...keys) {
  const out = {}

  for (const key of keys) {
    out[key] = object[key]
  }

  return out
}

/**
 * Keep only the relevent data for JSON-downloadable explore chart data
 * @param {{label: string, data: {x: string, y: number}[], resource: {}, resourceType: {}}[]} datasets
 */
export function exploreDatasetsToJson(datasets) {
  return datasets.map((dataset) => ({
    label: dataset.label,
    // remove inserted NaN values to fix the chart
    data: dataset.data.filter((data) => !isNaN(data.y)),
    resource: pluck(
      dataset.resource,
      'id',
      'description',
      'location',
      'meter',
      'lat',
      'lon'
    ),
    resourceType: pluck(dataset.resourceType, 'id', 'name', 'symbol'),
  }))
}

/**
 * Keep only the relevent data for JSON-downloadable signature chart data
 * @param {{label: string, data: {x: number, y: number, z: string}[]}[]} datasets
 */
export function signatureDatasetsToJson(datasets) {
  return datasets.map((dataset) => ({
    label: dataset.label,
    data: dataset.data.map(({ x, y, z }) => ({ x, y: +y.toFixed(2), z })),
  }))
}

/**
 *
 * @param {{label: string, data: {x: string, y: string}[], resource: {}, resourceType: {symbol: string}}[]} json
 * @param {import('vue-i18n').default} i18n
 */
export function exploreJsonToCsv(json, i18n) {
  const data = [
    [`"${i18n.t('global.date')}"`].concat(
      json.map(
        (dataset) =>
          `"${dataset.label.replace(
            '"',
            '""'
          )} (${dataset.resourceType.symbol.replace('"', '""')})"`
      )
    ),
  ]

  // some datasets might be missing values
  // take the biggest dataset as reference for length and dates
  const biggestDataset = json.reduce((carry, dataset) =>
    dataset.data.length > carry.data.length ? dataset : carry
  )
  const numValues = biggestDataset.data.length

  for (let i = 0; i < numValues; ++i) {
    const date = biggestDataset.data[i].x
    // remove the offset from the date string so it parses correctly once in a CSV software
    const finalDate = `"${date.replace(/\+.*/g, '')}"`

    const values = json.map((dataset) => {
      // take the value at the same date as the biggest dataset
      // to account for potential missing values in the middle of the dataset
      const value = dataset.data.find((value) => value.x === date)

      // missing value
      if (value === undefined) {
        return '""'
      }

      // replace dots with comas in the numbers so it is recognized as number in a CSV software
      return `"${value.y.toString().replace('.', ',')}"`
    })

    data.push([finalDate].concat(values))
  }

  return data.map((line) => line.join(',')).join('\n')
}

/**
 *
 * @param {{label: string, data: {x: number, y: number, z: string}[]}[]} json
 * @param {import('vue-i18n').default} i18n
 */
export function signatureJsonToCsv(json, i18n) {
  // the csv contains 3 parts, one per dataset

  const labels = [
    `"${i18n.t('pages.signature.download.avg_temp')}"`,
    `"${i18n.t('pages.signature.download.consumption')}"`,
    `"${i18n.t('global.date')}"`,
  ]

  const data = [
    [`"${json[0].label}"`],
    labels,

    ...json[0].data.map((point) => {
      // remove UTC offset from date
      return [
        `"${point.x.toString().replace('.', ',')}"`,
        `"${point.y.toString().replace('.', ',')}"`,
        `"${point.z.replace(/\+.*/g, '')}"`,
      ]
    }),
    ['""'],
    [`"${json[1].label}"`],
    labels,

    ...json[1].data.map((point) => {
      // remove UTC offset from date
      return [
        `"${point.x.toString().replace('.', ',')}"`,
        `"${point.y.toString().replace('.', ',')}"`,
        `"${point.z.replace(/\+.*/g, '')}"`,
      ]
    }),
    ['""'],
    [`"${json[2].label}"`],
    [labels[0], labels[1]],

    ...json[2].data.map((point) => {
      return [
        `"${point.x.toString().replace('.', ',')}"`,
        `"${point.y.toString().replace('.', ',')}"`,
      ]
    }),
  ]

  return data.map((line) => line.join(',')).join('\n')
}

/**
 * Get the scaled value and it's suffixe (centi/milli)
 * @param {number} number
 */
export function toClosestSuffixe(number) {
  if (number === 0) {
    // no unit
    return {
      number,
      unit: '',
    }
  }

  if (number < 0.01) {
    // mili
    return {
      number: number * 1000,
      unit: 'm',
    }
  }

  if (number < 0.1) {
    // centi
    return {
      number: number * 100,
      unit: 'c',
    }
  }

  if (number < 1000) {
    // no unit
    return {
      number,
      unit: '',
    }
  }

  if (number < 1000000) {
    // kilo unit
    return {
      number: number / 1000,
      unit: 'k',
    }
  }

  if (number < 1000000000) {
    // mega
    return {
      number: number / 1000000,
      unit: 'M',
    }
  }

  // giga
  return {
    number: number / 1000000000,
    unit: 'G',
  }
}

/**
 * Turn a list of resource types to a list of axes
 * @param {string} symbol
 * @param {'left' | 'right'} position on which side of the chart is the axis
 * @param {boolean} beginAtZero wether the axis begins with the value 0
 * @param {boolean} useSuffix wether to shorten the values and include a SI suffix
 * @param {number} weight optional weight that determines how far away the axis is
 */
export function symbolToAxis(
  symbol,
  position,
  beginAtZero,
  useSuffix,
  id = 0,
  weight = 0
) {
  return {
    display: 'auto',
    offset: true,
    // order (higher = further)
    weight,
    position,
    gridLines: {
      color: 'rgba(230, 230, 230, 1)',
      lineWidth: 2,
      drawBorder: false,
      zeroLineWidth: 0,
    },
    ticks: {
      beginAtZero,
      precision: 4,
      maxTicksLimit: 7,
      fontColor: chartDefaults.fontColor,
      fontSize: chartDefaults.fontSize,
      padding: 18,

      callback: (tick) => {
        if (useSuffix) {
          const result = toClosestSuffixe(tick)
          return `${result.number} ${result.unit + symbol}`
        }

        return `${tick} ${symbol}`
      },
    },
    id,
  }
}

/**
 * Get an auto generated name for the explore chart
 * @param {{resources: number[], period: string, offset: number}} chart
 * @param {{[x: number]: {description: string}}} resourcesById
 * @param {import('vue-i18n').default} i18n
 */
export function generateExploreChartName(chart, resourcesById, i18n) {
  let resources = resourcesById[chart.resources[0]].description

  if (chart.resources.length > 1) {
    resources += ` ${i18n.t('global.and_others')}`
  }

  const period = i18n.tc('period_offsets.' + chart.period, chart.offset, {
    count: chart.offset,
  })

  return `${resources}, ${period}`
}

/**
 * Get an auto generated name for the signature chart
 * @param {{site: number, period: string, offset: number}} chart
 * @param {{[x: number]: {name: string}}} sitedById
 * @param {import('vue-i18n').default} i18n
 */
export function generateSignatureChartName(chart, sitedById, i18n) {
  let siteName = sitedById[chart.site].name

  const signaturePeriod = i18n.tc(
    'signature_periods.' + chart.period,
    chart.offset,
    {
      count: chart.offset,
    }
  )

  return `${siteName}, ${signaturePeriod}`
}

/**
 * Get the format to use in the tooltip based on the agregation and period of the chart
 * @param {number} agregation
 * @param {number} period
 */
export function getTooltipDateFormat(agregation, period) {
  switch (agregation) {
    case agregations['hour']: {
      switch (period) {
        case periods['day']: {
          return 'd LLL HH:mm'
        }
        case periods['week']: {
          return 'ccc d LLL HH:mm'
        }
        // month or year
        default: {
          return 'dd.LL.yy HH:mm'
        }
      }
    }
    case agregations['day']: {
      switch (period) {
        case periods['day']: {
          return 'd LLL'
        }
        case periods['week']: {
          return 'cccc d LLL'
        }
        // month or year
        default: {
          return 'dd.LL.yy'
        }
      }
    }
    case agregations['week']: {
      switch (period) {
        case periods['day']: {
          return 'd LLL'
        }
        case periods['week']: {
          return 'd LLL'
        }
        // month or year
        default: {
          return 'd LLL y'
        }
      }
    }
    case agregations['month']: {
      return 'LLLL y'
    }
  }
}

export function defaultDashboard() {
  return { charts: [], temps: { exclude: [] } }
}

/**
 * Get a promise that reoslves only when all mutations occured at least once
 * @param {import('vuex').Store} store
 * @param {string[]} mutations
 * @returns {Promise<void>} nothing
 */
export function waitForMutations(store, mutations) {
  return new Promise((resolve) => {
    const mutationsLeft = mutations
    store.subscribe(({ type }) => {
      const index = mutationsLeft.indexOf(type)
      if (index === -1) {
        return
      }

      mutationsLeft.splice(index, 1)
      if (mutationsLeft.length === 0) {
        resolve()
      }
    })
  })
}

/**
 * Separete noisy data from clean data
 * @param {{x: number, y: number}[]} data the data to filter for noise on Y
 * @param {number} noiseRatio value between 0 and 1. 0 doesn't filter any noise. 1 filters all values that are not average
 * @returns {{cleanData: {x: number, y: number}[], noisyData: {x: number, y: number}[]}} the clean data and the noisy data
 */
export function noiseFilter(data, noiseRatio) {
  const numValues = data.length

  // can't filter noise if there are 2 values or less
  if (numValues <= 2) {
    return {
      cleanData: data,
      noisyData: [],
    }
  }

  const { slope, intercept } = getScatterAverageLine(data)

  // calculte squared error for every point
  // find the biggest and scale the noiseRatio according to it
  // remove data that falls in the noiseRatio

  const withError = data.map((point) => {
    return {
      point,
      squaredError: Math.pow(slope * point.x + intercept - point.y, 2),
    }
  })

  const maxError = withError.reduce(
    (max, current) => (current.squaredError > max ? current.squaredError : max),
    0
  )
  const weightedMaxError = maxError * (1 - noiseRatio)

  const cleanData = []
  const noisyData = []

  for (const { point, squaredError } of withError) {
    if (squaredError > weightedMaxError) {
      noisyData.push(point)
    } else {
      cleanData.push(point)
    }
  }

  return {
    cleanData,
    noisyData,
  }
}

/**
 * Get an average line of two points that goes through a set of scatter data
 * @param {{x: number, y: number}[]} scatterData the scattered data
 * @returns {{slope: number, intercept: number}} the slope and intercept of the line
 */
export function getScatterAverageLine(scatterData) {
  const numValues = scatterData.length

  if (numValues === 0) {
    return {
      slope: 0,
      intercept: 0,
    }
  }

  // https://www.npmjs.com/package/lobf
  let sumX = 0
  let sumY = 0
  let sumXSquared = 0
  let sumXY = 0

  scatterData.forEach(({ x, y }) => {
    sumX += x
    sumY += y
    sumXSquared += Math.pow(x, 2)
    sumXY += x * y
  })

  const slope =
    (numValues * sumXY - sumX * sumY) /
    (numValues * sumXSquared - Math.pow(sumX, 2))
  const intercept = (sumY - slope * sumX) / numValues

  return {
    slope,
    intercept,
  }
}

/**
 * Handle a potential navigation error from VueRouter push & replace methods
 * @param {Error} e the rejected error
 * @returns {void} nothing
 */
export function handleNavigationError(e) {
  if (e === undefined) {
    return
  }

  if (isNavigationFailure(e, NavigationFailureType.cancelled)) {
    // ingore canceled navigation
    return
  }

  if (isNavigationFailure(e, NavigationFailureType.duplicated)) {
    // ignore this error. we cannot easily check if the query is the same as the current
    // which would avoid calling replace when not needed
    return
  }

  console.error(e)
}

/**
 * Remove the trailing slash from a path
 * @param {string} path the path to trim
 * @returns {string} the trimmed path
 */
export function removeTrailingSlash(path) {
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, path.length - 1)
  }

  return path
}
