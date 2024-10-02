import { useMainStore } from '../store/index'

function getNavigatorLanguage() {
  if (navigator.languages && navigator.languages.length) {
    return navigator.languages[0]
  } else {
    return (
      navigator.userLanguage ||
      navigator.language ||
      navigator.browserLanguage ||
      'en'
    )
  }
}

export default function () {
  const store = useMainStore()
  if (store.readClientData) {
    return
  }

  const locale = localStorage.getItem('locale')
  // TODO: use action setLocale
  store.commit('SET_LOCALE', { locale: locale || getNavigatorLanguage() })

  const apiToken = localStorage.getItem('apiToken')
  if (apiToken) {
    // TODO: use action setApiToken
    store.commit('SET_API_TOKEN', { apiToken })
    // if we found a token, that means the user wanted to be remembered
    // TODO: directly set value
    store.commit('SET_REMEMBER_ME', { rememberMe: true })
  }

  const hasConnected = localStorage.getItem('hasConnected')
  if (hasConnected) {
    // TODO: set value directly
    store.commit('SET_IS_PROBABLY_CLIENT', {
      isProbablyClient: hasConnected === 'true',
    })
  }

  store.commit('SET_READ_CLIENT_DATA', { readClientData: true })
}
