import { defineStore } from 'pinia'

import { DateTime } from 'luxon'
import {
  indexOnId,
  fixDashboard,
  defaultDashboard,
  SMALL_SCREEN_BREAKPOINT,
} from '../assets/utils'

export const useMainStore = defineStore('main', {
  state: () => ({
    // TODO: verify next line
    api: `${this.$nuxt.config.API_ROOT}/${this.$nuxt.config.API_VERSION}`,

    isIE: !!document.documentMode,

    locales: ['en', 'fr', 'de'],
    locale: 'en',
    /**
     * @type {string|null}
     */
    apiToken: null,
    rememberMe: false,
    isProbablyClient: false,
    readClientData: false,
    smallScreen: window.innerWidth < SMALL_SCREEN_BREAKPOINT,

    messageBox: {
      show: false,
      isError: false,
      lastMessage: '',
      /**
       * @type {number}
       */
      timeout: null,
    },

    isAppLoading: false,
    /**
     * @type {Promise<void>[]}
     */
    awaitingEvents: [],

    data: {
      user: null,
      // for admin only
      users: null,
      alerts: null,
      objectives: null,
      sites: null,
      sensors: null,
      resources: null,
      resourceTypes: null,
      client: null,
      // for admin only
      clients: null,
      meteoLocations: null,
      // TODO: verify useless and delete
      readings: [],
      sessions: null,
    },
    dataById: {
      // for admin only
      users: null,
      alerts: null,
      objectives: null,
      sites: null,
      sensors: null,
      resources: null,
      resourceTypes: null,
      // for admin only
      clients: null,
      meteoLocations: null,
      sessions: null,
    },

    dashboardEdit: {
      undoList: [],
    },
  }),

  getters: {
    name: (state) => (state.data.user ? state.data.user.name : '...'),
    email: (state) => (state.data.user ? state.data.user.email : '...'),
    sensorSubscriptions: (state) => {
      if (
        !state.data.user ||
        !Array.isArray(state.data.user.sensor_subscriptions)
      ) {
        return []
      }
      return state.data.user.sensor_subscriptions
    },

    userLocale: (state) =>
      state.data.user ? state.data.user.locale : state.locale,
    accountCreatedAt: (state) =>
      state.data.user
        ? DateTime.fromISO(state.data.user.created_at)
        : DateTime.local(),
    dashboard: (state) =>
      state.data.user ? state.data.user.dashboard : defaultDashboard(),
    isAdmin: (state) =>
      state.data.user ? Boolean(state.data.user.is_admin) : false,
    clientName: (state) => (state.data.client ? state.data.client.name : '...'),
    clientNumber: (state) =>
      state.data.client ? state.data.client.number : '...',
    clientEmail: (state) =>
      state.data.client ? state.data.client.email : '...',
    sensors: (state) => (state.data.sensors ? state.data.sensors : []),
    resources: (state) => (state.data.resources ? state.data.resources : []),
    hasResources: (state) => !!state.data.resources,
    hasResourceTypes: (state) => !!state.data.resourceTypes,
    hasMeteoLocations: (state) => !!state.data.meteoLocations,
    hasSites: (state) => !!state.data.sites,
    numResources: (state) =>
      state.data.resources ? state.data.resources.length : 0,
    sites: (state) => (state.data.sites ? state.data.sites : []),
    numSites: (state) => (state.data.sites ? state.data.sites.length : 0),
    objectives: (state) => (state.data.objectives ? state.data.objectives : []),
    alerts: (state) => (state.data.alerts ? state.data.alerts : []),
    // for admin only
    users: (state) => (state.data.users ? state.data.users : []),
    clients: (state) => (state.data.clients ? state.data.clients : []),
    sessions: (state) => (state.data.sessions ? state.data.sessions : []),

    // dashboard edit mode
    dashboardEditCurrent: (state) => {
      if (state.data.user === null) {
        return defaultDashboard()
      }

      const numUndos = state.dashboardEdit.undoList.length

      if (numUndos === 0) {
        return state.data.user.dashboard
      }

      return state.dashboardEdit.undoList[numUndos - 1]
    },

    // Database relations getters

    resource: (state) => (hasResource) => {
      if (!hasResource) {
        return null
      }

      if (state.dataById.resources === null) {
        return null
      }

      return state.dataById.resources[hasResource.resource_id]
    },
    resourceType: (state) => (hasResourceType) => {
      if (!hasResourceType) {
        return null
      }

      if (state.dataById.resourceTypes === null) {
        return null
      }

      return state.dataById.resourceTypes[hasResourceType.resource_type_id]
    },
    sensor: (state) => (hasSensor) => {
      if (!hasSensor) {
        return null
      }

      if (state.dataById.sensors === null) {
        return null
      }

      return state.dataById.sensors[hasSensor.sensor_id]
    },
    site: (state) => (hasSite) => {
      if (!hasSite) {
        return null
      }

      if (state.dataById.sites === null) {
        return null
      }

      return state.dataById.sites[hasSite.site_id]
    },
    alert: (state) => (hasAlert) => {
      if (!hasAlert) {
        return null
      }

      if (state.dataById.alerts === null) {
        return null
      }

      return state.dataById.alerts[hasAlert.alert_id]
    },
    objective: (state) => (hasObjective) => {
      if (!hasObjective) {
        return null
      }

      if (state.dataById.objectives === null) {
        return null
      }

      return state.dataById.objectives[hasObjective.objective_id]
    },
    // for admin only
    user: (state) => (hasUser) => {
      if (!hasUser) {
        return null
      }

      if (state.dataById.users === null) {
        return null
      }

      return state.dataById.users[hasUser.user_id]
    },
    client: (state) => (hasClient) => {
      if (!hasClient) {
        return null
      }

      if (state.dataById.clients === null) {
        return null
      }

      return state.dataById.clients[hasClient.client_id]
    },
    meteoLocation: (state) => (hasMeteoLocation) => {
      if (!hasMeteoLocation) {
        return null
      }

      if (state.dataById.meteoLocations === null) {
        return null
      }

      return state.dataById.meteoLocations[hasMeteoLocation.meteo_location_id]
    },
  },

  actions: {
    /**
     * @param {string} message
     * @param {boolean} isError
     * @param {number|undefined} time defaults to 10000 milliseconds
     */
    showMessage(message, isError, time) {
      this.messageBox.lastMessage = message
      this.messageBox.isError = isError

      this.hideMessage()

      // let the CSS update so that the animation for the message box may trigger again
      requestAnimationFrame(() => {
        this.messageBox.show = true

        this.messageBox.timeout = setTimeout(() => {
          this.messageBox.show = false
        }, time || 10000)
      })
    },
    hideMessage() {
      clearTimeout(this.messageBox.timeout)

      this.messageBox.show = false
    },
    logout() {
      this.rememberMe = false
      this.apiToken = null
      localStorage.removeItem('apiToken')
    },
    /**
     * @param {Promise<void>} awaitingEvent
     */
    addAwaitingEvent(awaitingEvent) {
      if (!this.isAppLoading) {
        this.isAppLoading = true
      }
      this.awaitingEvents.push(awaitingEvent)

      awaitingEvent.finally(() => {
        this.awaitingEvents.splice(
          this.awaitingEvents.indexOf(awaitingEvent),
          1
        )

        // wait a bit before trying to change the state
        // that way we don't remove the loading to readd it immediately after
        setTimeout(() => {
          if (this.awaitingEvents.length === 0 && this.isAppLoading) {
            this.isAppLoading = false
          }
        }, 100)
      })
    },
    validateDashboardChanges() {
      // no user data
      if (!state.data.user) {
        return
      }
      // no changes
      const numUndos = this.dashboardEdit.undoList.length
      if (numUndos === 0) {
        return
      }

      this.data.user.dashboard = this.dashboardEdit.undoList[numUndos - 1]
      this.dashboardEdit.undoList.length = 0
    },
    updateSmallScreen() {
      this.smallScreen = window.innerWidth < SMALL_SCREEN_BREAKPOINT
    },
    /**
     * @param {string} locale
     */
    setLocale(locale) {
      if (this.locales.indexOf(locale) !== -1) {
        this.locale = locale

        // TODO: confirm next line
        this.$nuxt.app.i18n.locale = locale
        localStorage.setItem('locale', locale)

        /*
          // Chart.js uses moment to display dates
          moment.locale(dateLocale[locale])
          */
      }
    },
    /**
     * @param {string} apiToken
     */
    setApiToken(apiToken) {
      this.apiToken = apiToken
      this.isProbablyClient = true

      if (this.rememberMe) {
        localStorage.setItem('apiToken', apiToken)
      }
    },
    convertDashboard() {
      if (this.data.user === null) {
        console.warn('No user data to convert dashboard')
        return
      }
      // convert dashboard if JSON string
      if (typeof this.data.user.dashboard === 'string') {
        try {
          this.data.user.dashboard = JSON.parse(this.data.user.dashboard)
        } catch (e) {
          console.warn('Dashboard parsing error:', e)
          this.data.user.dashboard = defaultDashboard()
        }
      } else if (this.data.user.dashboard === null) {
        this.data.user.dashboard = defaultDashboard()
      }

      // fix the dashboard in any case because it might be invalid
      this.data.user.dashboard = fixDashboard(
        this.data.user.dashboard,
        this.dataById.resources,
        this.dataById.sites
      )
    },
    /**
     * @param {any[]} sensorSubscriptions
     * @returns
     */
    setSensorSubscriptions(sensorSubscriptions) {
      if (this.data.user === null) {
        console.warn('No user data to add sensor subscriptions')
        return
      }
      this.data.user.sensor_subscriptions = sensorSubscriptions
    },
    addDashboardChart(chart) {
      if (this.data.user === null) {
        console.warn('No user data to add dashboard chart')
        return
      }

      this.data.user.dashboard.charts.push(chart)
    },
  },
})

export const mutations = {
  [SET_USERS](state, { users }) {
    state.data.users = users
    state.dataById.users = indexOnId(users)
  },
  [SET_CLIENT](state, { client }) {
    state.data.client = client
  },
  [SET_CLIENTS](state, { clients }) {
    state.data.clients = clients
    state.dataById.clients = indexOnId(clients)
  },
  [SET_RESOURCES](state, { resources }) {
    state.data.resources = resources
    state.dataById.resources = indexOnId(resources)

    // fix dashboard if we have user data
    if (state.data.user !== null) {
      state.data.user.dashboard = fixDashboard(
        state.data.user.dashboard,
        state.dataById.resources,
        state.dataById.sites
      )
    }
  },
  [SET_RESOURCE_TYPES](state, { resourceTypes }) {
    state.data.resourceTypes = resourceTypes
    state.dataById.resourceTypes = indexOnId(resourceTypes)
  },
  [SET_SENSORS](state, { sensors }) {
    state.data.sensors = sensors
    state.dataById.sensors = indexOnId(sensors)
  },
  [SET_SITES](state, { sites }) {
    state.data.sites = sites
    state.dataById.sites = indexOnId(sites)

    // fix dashboard if we have user data
    if (state.data.user !== null) {
      state.data.user.dashboard = fixDashboard(
        state.data.user.dashboard,
        state.dataById.resources,
        state.dataById.sites
      )
    }
  },
  [SET_OBJECTIVES](state, { objectives }) {
    state.data.objectives = objectives
    state.dataById.objectives = indexOnId(objectives)
  },
  [SET_ALERTS](state, { alerts }) {
    state.data.alerts = alerts
    state.dataById.alerts = indexOnId(alerts)
  },
  [SET_METEO_LOCATIONS](state, { meteoLocations }) {
    state.data.meteoLocations = meteoLocations
    state.dataById.meteoLocations = indexOnId(meteoLocations)
  },
  [SET_IS_APP_LOADING](state, { isAppLoading }) {
    state.isAppLoading = isAppLoading
  },
  [SET_READ_CLIENT_DATA](state, { readClientData }) {
    state.readClientData = readClientData
  },
  [SET_SMALL_SCREEN](state, { smallScreen }) {
    state.smallScreen = smallScreen
  },
  [SET_SESSIONS](state, { sessions }) {
    state.data.sessions = sessions
    state.dataById.sessions = indexOnId(sessions)
  },

  // UPDATE
  [UPDATE_OBJECTIVE](state, { objective }) {
    const current = state.dataById.objectives[objective.id]
    Object.assign(current, objective)
  },
  [UPDATE_ALERT](state, { alert }) {
    const current = state.dataById.alerts[alert.id]
    Object.assign(current, alert)
  },
  [UPDATE_DASHBOARD](state, { dashboard }) {
    if (!state.data.user) {
      return
    }

    state.data.user.dashboard = dashboard
  },
  [UPDATE_SENSOR_SUBSCRIPTIONS](state, { sensor_subscriptions }) {
    if (!state.data.user) {
      return
    }

    state.data.user.sensor_subscriptions = sensor_subscriptions
  },

  // ADD
  [ADD_OBJECTIVE](state, { objective }) {
    state.data.objectives.push(objective)
    state.dataById.objectives[objective.id] = objective
  },
  [ADD_ALERT](state, { alert }) {
    state.data.alerts.push(alert)
    state.dataById.alerts[alert.id] = alert
  },
  [ADD_AWAITING_EVENT](state, { awaitingEvent }) {
    state.awaitingEvents.push(awaitingEvent)
  },
  [ADD_DASHBOARD_CHART](state, { element }) {
    if (state.data.user === null) {
      console.warn('No user data to add dashboard element')
      return
    }

    state.data.user.dashboard.charts.push(element)
  },
  [ADD_DASHBOARD_EDIT](state, { dashboard }) {
    state.dashboardEdit.undoList.push(dashboard)
  },

  // REMOVE
  [REMOVE_OBJECTIVE](state, { objective }) {
    const current = state.dataById.objectives[objective.id]

    if (!current) {
      return
    }

    delete state.dataById.objectives[objective.id]

    const index = state.data.objectives.indexOf(current)

    if (index === -1) {
      return
    }

    state.data.objectives.splice(index, 1)
  },
  [REMOVE_ALERT](state, { alert }) {
    const current = state.dataById.alerts[alert.id]

    if (!current) {
      return
    }

    delete state.dataById.alerts[alert.id]

    const index = state.data.alerts.indexOf(current)

    if (index === -1) {
      return
    }

    state.data.alerts.splice(index, 1)
  },
  [REMOVE_AWAITING_EVENT](state, { awaitingEvent }) {
    state.awaitingEvents.splice(state.awaitingEvents.indexOf(awaitingEvent), 1)
  },
  [REMOVE_LAST_DASHBOARD_EDIT](state) {
    state.dashboardEdit.undoList.pop()
  },
  [REMOVE_ALL_DASHBOARD_EDITS](state) {
    state.dashboardEdit.undoList = []
  },
}
