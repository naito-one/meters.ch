<template>
  <nav class="bg-naito-blue-300 text-gray-100 rounded-md shadow-lg">
    <ul>
      <!-- TODO: visible focused element -->
      <li v-for="(element, i) in elements" :key="i">
        <nuxt-link
          class="px-5 py-3 hover:bg-naito-blue-200 flex items-center outline-none"
          :to="element.href"
        >
          <i class="material-icons select-none mr-3" v-text="element.icon"></i>
          <span v-text="$t(element.label)"></span>
        </nuxt-link>
      </li>
    </ul>
  </nav>
</template>
<script>
import { mapStores } from 'pinia'
import { useMainStore } from '../store/index'

export default {
  data() {
    return {
      basicElements: [
        { icon: 'timeline', label: 'pages.explore.title', href: '/explore' },
        {
          icon: 'track_changes',
          label: 'pages.signature.title',
          href: '/signature',
        },
        { icon: 'map', label: 'pages.map.title', href: '/map' },
        {
          icon: 'adjust',
          label: 'pages.objectives.title',
          href: '/objectives',
        },
        { icon: 'warning', label: 'pages.alerts.title', href: '/alerts' },
        { icon: 'settings', label: 'pages.settings.title', href: '/settings' },
      ],
    }
  },
  computed: {
    ...mapStores(useMainStore),
    elements() {
      return this.mainStore.isAdmin
        ? [
            {
              icon: 'security',
              label: 'pages.admin.title',
              href: '/admin',
            },
            ...this.basicElements,
          ]
        : this.basicElements
    },
  },
}
</script>
