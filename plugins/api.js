import factory from '../assets/cache'
import { Duration } from 'luxon'

import {
  ADD_ALERT,
  ADD_OBJECTIVE,
  REMOVE_ALERT,
  REMOVE_OBJECTIVE,
  SET_ALERTS,
  SET_CLIENT,
  SET_CLIENTS,
  SET_METEO_LOCATIONS,
  SET_OBJECTIVES,
  SET_RESOURCES,
  SET_RESOURCE_TYPES,
  SET_SENSORS,
  SET_SESSIONS,
  SET_SITES,
  SET_USER,
  SET_USERS,
  UPDATE_ALERT,
  UPDATE_OBJECTIVE,
} from '../assets/mutations'

const cache = factory(
  Duration.fromObject({ minutes: 5 }),
  Duration.fromObject({ minutes: 5 })
)

export default ({ app, store, redirect }, inject) => {
  function classic(method, route, params) {
    return new Promise(async (resolve, reject) => {
      try {
        const awaitingEvent = app['$' + method](route, params)
        store.dispatch('addAwaitingEvent', { awaitingEvent })

        const res = await awaitingEvent

        // no content
        if (res.status === 204) {
          return resolve(null)
        }

        const parsed = await res.json()

        if (!res.ok) {
          if (parsed.errors) {
            // get and show the first error message
            const firstError = Object.values(parsed.errors)[0][0]
            store.dispatch('showMessage', {
              message: firstError,
              isError: true,
            })
          } else {
            store.dispatch('showMessage', {
              message: parsed.message,
              isError: true,
            })
          }

          if (res.status === 401 || res.status === 403) {
            // token is no longer valid for the backend
            // delete localy, but we can't call /logout on the server
            // since that requires a valid token
            const url = store.getters.rememberMe
              ? '/login?remember-me'
              : '/login'
            store.dispatch('logout')
            redirect(url)
          }

          reject(res.status)
        }

        resolve(parsed)
      } catch (e) {
        store.dispatch('showMessage', {
          message: app.i18n.t('error.unknown'),
          isError: true,
        })

        console.error(e)
        reject(e)
      }
    })
  }

  inject('getUser', async function (force) {
    if (store.state.data.user !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/users')
      // TODO: set user manually
      // TODO: call convertDashboard
      store.commit(SET_USER, { user: parsed[0] })
    } catch (e) {
      throw e
    }
  })

  inject('getUsers', async function (force) {
    if (store.state.data.users !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/users')
      store.commit(SET_USERS, { users: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getResources', async function (force) {
    if (store.state.data.resources !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/resources')
      store.commit(SET_RESOURCES, { resources: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getResourceTypes', async function (force) {
    if (store.state.data.resourceTypes !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/resourceTypes')
      store.commit(SET_RESOURCE_TYPES, { resourceTypes: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getSites', async function (force) {
    if (store.state.data.sites !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/sites')
      store.commit(SET_SITES, { sites: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getMeteoLocations', async function (force) {
    if (store.state.data.meteoLocations !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/meteoLocations')
      store.commit(SET_METEO_LOCATIONS, { meteoLocations: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getSensors', async function (force) {
    if (store.state.data.sensors !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/sensors')
      store.commit(SET_SENSORS, { sensors: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getObjectives', async function (force) {
    if (store.state.data.objectives !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/objectives')
      store.commit(SET_OBJECTIVES, { objectives: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getAlerts', async function (force) {
    if (store.state.data.alerts !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/alerts')
      store.commit(SET_ALERTS, { alerts: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getClient', async function (force) {
    if (store.state.data.client !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/clients')
      store.commit(SET_CLIENT, { client: parsed[0] })
    } catch (e) {
      throw e
    }
  })

  inject('getClients', async function (force) {
    if (store.state.data.clients !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/clients')
      store.commit(SET_CLIENTS, { clients: parsed })
    } catch (e) {
      throw e
    }
  })

  inject('getReadings', async function (resource, payload, ignoreCache) {
    const key = `getReadings-${resource}-` + JSON.stringify(payload)
    const cached = cache.get(key)

    if (cached && !ignoreCache) {
      return cached
    }

    let readings = []

    try {
      readings = await classic(
        'get',
        `/resources/${resource}/readings`,
        payload
      )
    } catch (e) {}

    cache.set(key, readings)

    return readings
  })

  inject('getMeteoReadings', async function (location, payload, ignoreCache) {
    const key = `getMeteoReadings-${location}-` + JSON.stringify(payload)
    const cached = cache.get(key)

    if (cached && !ignoreCache) {
      return cached
    }

    let readings = []

    try {
      readings = await classic(
        'get',
        `/meteoLocations/${location}/meteoReadings`,
        payload
      )
    } catch (e) {}

    cache.set(key, readings)

    return readings
  })

  inject('getSessions', async function (force) {
    if (store.state.data.sessions !== null && !force) {
      return
    }

    try {
      const parsed = await classic('get', '/sessions')
      store.commit(SET_SESSIONS, { sessions: parsed })
    } catch (e) {
      throw e
    }
  })

  // PUT

  inject('putUser', async function (payload, customMessage, customTime) {
    if (store.state.data.user === null) {
      return
    }

    // make sure the logged user id is added if none is provided
    if (!payload.hasOwnProperty('id')) {
      payload.id = store.state.data.user.id
    }

    try {
      const parsed = await classic('put', `/users/${payload.id}`, payload)

      // new user infos are returned on success
      // if updated user is current user, update his data
      if (payload.id === store.state.data.user.id) {
        // TODO: set user manually
        // TODO: call convertDashboard
        store.commit(SET_USER, { user: parsed })
      }

      store.dispatch('showMessage', {
        message: customMessage || app.i18n.t('api.user_updated'),
        isError: false,
        time: customTime || 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('putObjective', async function (payload) {
    if (store.state.data.objectives === null) {
      return
    }

    try {
      const parsed = await classic('put', `/objectives/${payload.id}`, payload)

      // new objective infos are returned on success
      store.commit(UPDATE_OBJECTIVE, { objective: parsed })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.objective_updated'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('putAlert', async function (payload) {
    if (store.state.data.alerts === null) {
      return
    }

    try {
      const parsed = await classic('put', `/alerts/${payload.id}`, payload)

      // new alert infos are returned on success
      store.commit(UPDATE_ALERT, { alert: parsed })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.alert_updated'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  // POST

  inject('postObjective', async function (payload) {
    if (store.state.data.objectives === null) {
      return
    }

    try {
      const parsed = await classic('post', '/objectives', payload)

      // new objective infos are returned on success
      store.commit(ADD_OBJECTIVE, { objective: parsed })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.objective_created'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('postAlert', async function (payload) {
    if (store.state.data.alerts === null) {
      return
    }

    try {
      const parsed = await classic('post', '/alerts', payload)

      // new alert infos are returned on success
      store.commit(ADD_ALERT, { alert: parsed })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.alert_created'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('postUser', async function (payload) {
    if (store.state.data.users === null) {
      return
    }

    try {
      const parsed = await classic('post', '/users', payload)

      store.dispatch('showMessage', {
        message: app.i18n.t('api.user_created'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  // DELETE

  inject('delObjective', async function (payload) {
    if (store.state.data.objectives === null) {
      return
    }

    try {
      await classic('delete', `/objectives/${payload.id}`)

      // new objective infos are returned on success
      store.commit(REMOVE_OBJECTIVE, { objective: payload })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.objective_deleted'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('delAlert', async function (payload) {
    if (store.state.data.alerts === null) {
      return
    }

    try {
      await classic('delete', `/alerts/${payload.id}`)

      store.commit(REMOVE_ALERT, { alert: payload })

      store.dispatch('showMessage', {
        message: app.i18n.t('api.alert_deleted'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('delUser', async function (payload) {
    if (store.state.data.users === null) {
      return
    }

    try {
      await classic('delete', `/users/${payload.id}`)

      store.dispatch('showMessage', {
        message: app.i18n.t('api.user_deleted'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })

  inject('delSession', async function (payload) {
    if (store.state.data.sessions === null) {
      return
    }

    try {
      await classic('delete', `/sessions/${payload.id}`)

      store.dispatch('showMessage', {
        message: app.i18n.t('api.session_deleted'),
        isError: false,
        time: 2000,
      })
    } catch (e) {
      throw e
    }
  })
}
