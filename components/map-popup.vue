<template>
  <div class="hidden">
    <div class="flex flex-col items-center text-base p-2">
      <h2
        class="text-lg font-bold mb-2 text-center"
        v-text="formattedResource"
      ></h2>
      <span v-text="location"></span>
      <span
        v-if="resource && resource.meter"
        v-text="`${$t('pages.map.meter')}: ${resource.meter}`"
      ></span>
      <button
        class="open-chart mt-2 action bg-naito-green-200 text-gray-100 text-center"
        v-text="$t('pages.index.open_chart')"
      ></button>
    </div>
  </div>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

import { formatResource } from '../assets/utils'
export default {
  props: {
    resource: {
      type: Object,
      default: null,
    },
  },
  computed: {
    ...mapStores(useMainStore),
    site() {
      return this.mainStore.site(this.mainStore.sensor(this.resource))
    },
    resourceType() {
      return this.mainStore.resourceType(this.resource)
    },
    formattedResource() {
      if (this.resource === null) {
        return ''
      }
      return formatResource(
        this.$i18n,
        this.resource,
        this.resourceType,
        this.site
      )
    },
    location() {
      if (this.resource === null) {
        return ''
      }
      if (!this.resource.lat || !this.resource.lon) {
        return this.resource.location
      }

      return `${this.resource.location} (${this.resource.lat}, ${this.resource.lon})`
    },
  },
}
</script>
