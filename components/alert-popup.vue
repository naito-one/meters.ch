<template>
  <div :class="backClasses" ref="back" @click="cancelOnBack">
    <div :class="parentClasses">
      <section :class="sectionClasses">
        <div ref="scrollZone" class="overflow-y-auto max-h-full px-4 sm:px-6">
          <h2
            class="text-center font-heading text-2xl my-3"
            v-text="$t('pages.alerts.modes.' + mode)"
          ></h2>

          <!-- resource -->
          <div class="mb-8">
            <h3
              class="font-bold text-lg mb-2"
              v-text="$t('pages.alerts.form.resource')"
            ></h3>
            <search-select
              name="resource"
              :placeholder="$t('pages.objectives.form.find_resource')"
              :options="formattedResources"
              v-model="resource_id"
            ></search-select>
          </div>

          <div class="flex flex-col mb-8">
            <h3
              class="font-bold text-lg"
              v-text="$t('pages.alerts.form.range')"
            ></h3>
            <p
              class="mb-2 text-gray-800"
              v-text="$t('pages.alerts.form.range_note')"
            ></p>

            <!-- min -->
            <div class="flex items-center">
              <label
                class="w-1/2 select-none"
                for="min-input"
                v-text="$t('pages.alerts.form.min')"
              ></label>
              <input
                class="w-0 text-right flex-grow mx-2 py-2 transparent-input"
                type="number"
                min="-99"
                max="99"
                step="0.5"
                name="min-input"
                id="min-input"
                v-model="min"
              />
              <span>°C</span>
            </div>

            <!-- max -->
            <div class="flex items-center">
              <label
                class="w-1/2 select-none"
                for="max-input"
                v-text="$t('pages.alerts.form.max')"
              ></label>
              <input
                class="w-0 text-right flex-grow mx-2 py-2 transparent-input"
                type="number"
                min="-99"
                max="99"
                step="0.5"
                name="max-input"
                id="max-input"
                v-model="max"
              />
              <span>°C</span>
            </div>
          </div>

          <!-- tolerance -->
          <div class="flex flex-col mb-12">
            <h3
              class="font-bold text-lg"
              v-text="$t('pages.alerts.form.tolerance')"
            ></h3>
            <p
              class="mb-2 text-gray-800"
              v-text="$t('pages.alerts.form.tolerance_note')"
            ></p>

            <div class="flex items-center">
              <label
                class="material-radio text-naito-green-200"
                for="tolerance-none-input-radio"
              >
                <input
                  type="radio"
                  id="tolerance-none-input-radio"
                  value="none"
                  name="tolerance-input-radio"
                  v-model="toleranceRadio"
                />
                <div class="material-radio-fake"></div>
              </label>
              <label
                class="flex-grow select-none"
                for="tolerance-none-input-radio"
                v-text="$t('pages.alerts.form.tolerance_none')"
              ></label>
            </div>

            <div class="flex items-center">
              <label
                class="material-radio text-naito-green-200"
                for="tolerance-custom-input-radio"
              >
                <input
                  type="radio"
                  id="tolerance-custom-input-radio"
                  value="custom"
                  name="tolerance-input-radio"
                  v-model="toleranceRadio"
                />
                <div class="material-radio-fake"></div>
              </label>
              <label
                class="flex-grow flex items-center select-none"
                for="tolerance-custom-input-radio"
              >
                <span v-text="$t('pages.alerts.form.tolerance_custom')"></span>
                <input
                  class="w-0 text-right flex-grow mx-2 py-2 transparent-input"
                  type="number"
                  :disabled="!isCustomTolerance"
                  min="1"
                  max="12"
                  name="tolerance-input"
                  id="tolerance-input"
                  v-model="tolerance"
                />
                <span
                  :class="grayedIfNotCustomClasses"
                  v-text="$tc('pages.alerts.form.hours', tolerance)"
                ></span>
              </label>
            </div>
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
            :disabled="resource_id === -1"
            :title="
              resource_id === -1
                ? $t('pages.objectives.form.missing_resource')
                : ''
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

import { formatResource, scrollToTop } from '../assets/utils'
import SearchSelect from '../components/search-select.vue'

export default {
  name: 'AlertPopup',
  components: { SearchSelect },
  props: {
    show: Boolean,
    mode: String,
    current: Object,
  },
  data() {
    return {
      min: 0,
      max: 30,
      toleranceRadio: 'none',
      tolerance: 1,
      resource_id: -1,
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
        this.min = this.current.min
        this.max = this.current.max
        this.resource_id = this.current.resource_id

        if (this.current.tolerance === 0) {
          this.toleranceRadio = 'none'
          this.tolerance = 1
        } else {
          this.toleranceRadio = 'custom'
          this.tolerance = this.current.tolerance
        }
      } else {
        // reset to the default values
        this.min = 0
        this.max = 30
        this.toleranceRadio = 'none'
        this.tolerance = 1
        this.resource_id = -1
      }
    },
  },
  methods: {
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
        min: parseFloat(this.min),
        max: parseFloat(this.max),
        tolerance: this.isCustomTolerance ? parseInt(this.tolerance) : 0,
        resource_id: this.resource_id,
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
    isCustomTolerance() {
      return this.toleranceRadio === 'custom'
    },
    grayedIfNotCustomClasses() {
      return this.isCustomTolerance ? ['text-gray-900'] : ['text-gray-500']
    },
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
    resource() {
      return this.mainStore.resource({ resource_id: this.resource_id })
    },
    editMode() {
      return this.mode === 'edit'
    },
    allResources() {
      return this.mainStore.resources.filter((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        return resourceType && resourceType.name === 'Temperature'
      })
    },
    formattedResources() {
      return this.allResources.map((resource) => {
        let site = null
        if (this.mainStore.numSites > 1) {
          const sensor = this.mainStore.sensor(resource)
          site = this.mainStore.site(sensor)
        }
        return {
          id: resource.id,
          value: formatResource(this.$i18n, resource, null, site),
        }
      })
    },
  },
}
</script>
