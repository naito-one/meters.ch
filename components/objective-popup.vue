<template>
  <div :class="backClasses" ref="back" @click="cancelOnBack">
    <div :class="parentClasses">
      <section :class="sectionClasses">
        <div ref="scrollZone" class="overflow-y-auto max-h-full px-4 sm:px-6">
          <h2
            class="text-center font-heading text-2xl my-3"
            v-text="$t('pages.objectives.modes.' + mode)"
          ></h2>
          <!-- resource -->
          <div class="mb-8">
            <h3
              class="font-bold text-lg mb-2"
              v-text="$t('pages.objectives.form.resource')"
            ></h3>
            <search-select
              name="resource"
              :placeholder="$t('pages.objectives.form.find_resource')"
              :options="formattedResources"
              v-model="resource_id"
            ></search-select>
          </div>
          <div class="flex flex-col mb-12">
            <h3
              class="font-bold text-lg mb-2"
              v-text="$t('pages.objectives.form.objective')"
            ></h3>
            <!-- type -->
            <div class="flex items-center">
              <label
                class="material-radio text-naito-green-200"
                for="type-weekly-input"
              >
                <input
                  type="radio"
                  id="type-weekly-input"
                  value="weekly"
                  name="type-input"
                  v-model="type"
                />
                <div class="material-radio-fake"></div>
              </label>
              <label
                class="flex-grow select-none"
                for="type-weekly-input"
                v-text="$t('pages.objectives.form.weekly')"
              ></label>
            </div>

            <div class="flex items-center">
              <label
                class="material-radio text-naito-green-200"
                for="type-monthly-input"
              >
                <input
                  type="radio"
                  id="type-monthly-input"
                  value="monthly"
                  name="type-input"
                  v-model="type"
                />
                <div class="material-radio-fake"></div>
              </label>
              <label
                class="flex-grow select-none"
                for="type-monthly-input"
                v-text="$t('pages.objectives.form.monthly')"
              ></label>
            </div>

            <!-- value -->
            <div class="flex items-center text-gray-700">
              <label class="w-1/2" v-text="compareString"></label>
              <span
                class="text-right flex-grow mx-2"
                v-text="
                  compareValue === -1
                    ? $t('pages.objectives.form.not_enough_data')
                    : compareValue.toLocaleString(
                        $numberLocale(),
                        decimalDefaultFormat
                      )
                "
              ></span>
              <span v-if="compareValue !== -1" v-text="symbol"></span>
            </div>
            <div class="flex items-center">
              <label
                class="w-1/2 select-none"
                for="value-input"
                v-text="$t('pages.objectives.form.value')"
              ></label>
              <input
                class="text-right flex-grow mx-2 py-2 transparent-input"
                type="number"
                min="0"
                max="9999999999.9"
                step="0.1"
                name="value-input"
                id="value-input"
                v-model="value"
              />
              <span v-text="symbol"></span>
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

import {
  formatResource,
  last7DaysPeriod,
  last30DaysPeriod,
  scrollToTop,
  decimalDefaultFormat,
} from '../assets/utils'
import { DateTime } from 'luxon'
import SearchSelect from '../components/search-select.vue'

export default {
  name: 'ObjectivePopup',
  components: { SearchSelect },
  props: {
    show: Boolean,
    mode: String,
    current: Object,
  },
  data() {
    return {
      type: 'weekly',
      value: 0,
      resource_id: -1,
      compareValue: 0,
      decimalDefaultFormat,
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
        this.type = this.current.type
        this.value = this.current.value
        this.resource_id = this.current.resource_id
      } else {
        // reset to the default values
        this.type = 'weekly'
        this.value = 0
        this.resource_id = -1
      }
    },
    resource_id() {
      this.updateCompareValue().catch(console.error)
    },
    type() {
      this.updateCompareValue().catch(console.error)
    },
  },
  methods: {
    async updateCompareValue() {
      if (this.resource_id === -1) {
        this.compareValue = 0
        return
      }

      const now = DateTime.local()

      const period =
        this.type === 'weekly' ? last7DaysPeriod(now) : last30DaysPeriod(now)

      const readings = await this.$getReadings(this.resource_id, period)

      // we need at leat 93% of the data we should have for the period to compute the comparison
      // otherwise, the comparison isn't very usefull to the user
      const expectedReadingsLength =
        (this.type === 'weekly' ? 24 * 7 : 24 * 30) * 0.93
      if (readings.length < expectedReadingsLength) {
        this.compareValue = -1
        return
      }

      // to get the comsummption, subtract the absolute last from the absolute first
      this.compareValue =
        readings[readings.length - 1].value - readings[0].value
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
        type: this.type,
        value: parseFloat(this.value),
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
    symbol() {
      const resourceType = this.mainStore.resourceType(this.resource)
      return resourceType ? resourceType.symbol : ''
    },
    editMode() {
      return this.mode === 'edit'
    },
    compareString() {
      return this.$t(`pages.objectives.form.${this.type}_compare`)
    },
    allResources() {
      return this.mainStore.resources.filter((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        return resourceType && resourceType.name !== 'Temperature'
      })
    },
    formattedResources() {
      return this.allResources.map((resource) => {
        const resourceType = this.mainStore.resourceType(resource)
        let site = null
        if (this.mainStore.numSites > 1) {
          const sensor = this.mainStore.sensor(resource)
          site = this.mainStore.site(sensor)
        }
        return {
          id: resource.id,
          value: formatResource(this.$i18n, resource, resourceType, site),
        }
      })
    },
  },
}
</script>
