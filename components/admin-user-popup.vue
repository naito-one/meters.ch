<template>
  <div :class="backClasses" ref="back" @click="cancelOnBack">
    <div :class="parentClasses">
      <section :class="sectionClasses">
        <div ref="scrollZone" class="overflow-y-auto max-h-full px-4 sm:px-6">
          <h2
            class="text-center font-heading text-2xl my-3"
            v-text="$t('pages.admin.modes.' + mode)"
          ></h2>

          <!-- client -->
          <label
            class="block font-bold text-lg mb-2"
            v-text="$t('pages.admin.form.client')"
          ></label>
          <search-select
            name="resource"
            :placeholder="$t('pages.admin.form.find_client')"
            :options="formattedClients"
            v-model="clientId"
          ></search-select>

          <!-- name -->
          <label
            class="block font-bold text-lg mt-4"
            for="name-input"
            v-text="$t('pages.admin.form.name')"
          ></label>
          <input
            v-model="name"
            class="w-full px-4 py-2 transparent-input"
            type="string"
            name="name-input"
            id="name-input"
          />

          <!-- email -->
          <label
            class="block font-bold text-lg mt-4"
            for="email-input"
            v-text="$t('pages.admin.form.email')"
          ></label>
          <input
            v-model="email"
            class="w-full px-4 py-2 transparent-input"
            type="email"
            name="email-input"
            id="email-input"
          />

          <!-- only in create mode -->
          <div v-if="!editMode">
            <!-- password -->
            <label
              class="block font-bold text-lg mt-4"
              for="password-input"
              v-text="$t('pages.admin.form.password')"
            ></label>
            <input
              v-model="password"
              class="w-full px-4 py-2 transparent-input"
              type="password"
              name="password-input"
              id="password-input"
            />

            <!-- confirm password -->
            <label
              class="block font-bold text-lg mt-4"
              for="password-confirmation-input"
              v-text="$t('pages.admin.form.password_confirmation')"
            ></label>
            <input
              v-model="passwordConfirmation"
              class="w-full px-4 py-2 transparent-input"
              type="password"
              name="password-confirmation-input"
              id="password-confirmation-input"
            />
          </div>

          <!-- disabled -->
          <div class="w-full py-2 flex items-center">
            <label
              class="material-checkbox text-naito-green-200"
              for="is-disabled-input"
            >
              <input
                type="checkbox"
                name="is-disabled-input"
                id="is-disabled-input"
                v-model="isDisabled"
              />
              <div
                class="material-checkbox-fake material-checkbox-fake__large"
              ></div>
            </label>
            <label
              class="block select-none"
              for="is-disabled-input"
              v-text="$t('pages.admin.form.is_disabled')"
            ></label>
          </div>

          <!-- locale -->
          <label
            class="block font-bold text-lg mt-4"
            for="locale-input"
            v-text="$t('pages.admin.form.locale')"
          ></label>
          <div class="flex mb-4">
            <language-selector
              :locale="locale"
              :locales="locales"
              :label="'global.set_locale'"
              name="locale-input"
              @change="setLocale"
            ></language-selector>
          </div>
        </div>

        <!-- actions -->
        <div class="flex mb-3">
          <button
            class="flex-grow mr-3 action bg-gray-600 text-gray-100 text-center"
            @click="cancel"
            v-text="$t('global.cancel')"
          ></button>
          <button
            :disabled="!isDataComplete"
            :title="
              isDataComplete ? '' : $t('pages.admin.form.incomplete_data')
            "
            class="flex-grow ml-3 action bg-naito-green-200 text-gray-100 text-center"
            @click="confirm"
            v-text="$t('global.confirm')"
          ></button>
        </div>
      </section>
    </div>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { scrollToTop } from '../assets/utils'
import SearchSelect from '../components/search-select.vue'
import LanguageSelector from '../components/language-selector.vue'

export default {
  name: 'ObjectivePopup',
  components: { SearchSelect, LanguageSelector },
  props: {
    show: Boolean,
    mode: String,
    current: Object,
  },
  data() {
    return {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      isDisabled: false,
      locale: 'en',
      clientId: -1,
    }
  },
  watch: {
    show(show) {
      if (!show) {
        return
      }

      scrollToTop(this.$refs.scrollZone)

      if (this.editMode) {
        // reset to the given current values
        this.name = this.current.name
        this.email = this.current.email
        this.isDisabled = this.current.is_disabled
        this.locale = this.current.locale
        this.clientId = this.current.client_id
      } else {
        // reset to the default values
        this.name = ''
        this.email = ''
        this.password = ''
        this.passwordConfirmation = ''
        this.isDisabled = false
        this.locale = this.mainStore.userLocale
        // if there is a single client (on-premise), pre-select it
        this.clientId =
          this.formattedClients.length === 1 ? this.formattedClients[0].id : -1
      }
    },
  },
  methods: {
    setLocale(payload) {
      this.locale = payload.locale
    },
    cancelOnBack(event) {
      if (event.target === this.$refs.back) {
        this.$emit('cancel')
      }
    },
    cancel() {
      this.$emit('cancel')
    },
    confirm() {
      const payload = {
        name: this.name,
        email: this.email,
        password: this.password,
        password_confirmation: this.passwordConfirmation,
        is_disabled: this.isDisabled,
        locale: this.locale,
        client_id: this.clientId,
      }

      if (this.editMode || this.password === '') {
        // no password when editing, and don't include it if empty
        delete payload.password
        delete payload.password_confirmation
      }

      if (this.editMode) {
        payload.id = this.current.id
      }

      this.$emit('confirm', payload)
    },
  },
  mounted() {
    this.escHandler = (event) => {
      if (event.keyCode === 27) {
        if (this.show) {
          this.$emit('cancel')
        }
      }
    }

    document.addEventListener('keyup', this.escHandler, { passive: true })
  },
  beforeDestroy() {
    document.removeEventListener('keyup', this.escHandler)
  },
  computed: {
    ...mapStores(useMainStore),
    backClasses() {
      return [
        'fixed',
        'top-0',
        'left-0',
        'right-0',
        'w-screen',
        'h-screen',
        'bg-gray-darken',
        'transition-opacity-100',
        'z-20',
      ].concat(
        this.show
          ? ['pointer-events-auto', 'opacity-1']
          : ['pointer-events-none', 'opacity-0']
      )
    },
    parentClasses() {
      return [
        'fixed',
        'top-0',
        'left-0',
        'right-0',
        'flex',
        'justify-center',
        'p-4',
        'md:pt-16',
        'h-auto',
        'max-h-screen',
        'pointer-events-none',
      ]
    },
    sectionClasses() {
      return [
        'w-full',
        'sm:w-120',
        'bg-gray-100',
        'rounded-md',
        'p-4',
        'shadow-lg',
        'flex',
        'flex-col',
        'justify-between',
      ].concat(this.show ? ['pointer-events-auto'] : [])
    },
    editMode() {
      return this.mode === 'edit'
    },
    locales() {
      return this.mainStore.locales
    },
    formattedClients() {
      return this.mainStore.clients.map((client) => ({
        id: client.id,
        value: `${client.number} - ${client.name}`,
      }))
    },
    isDataComplete() {
      return (
        this.name !== '' &&
        this.email !== '' &&
        this.clientId !== -1 &&
        this.password === this.passwordConfirmation
      )
    },
  },
}
</script>
