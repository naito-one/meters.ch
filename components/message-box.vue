<template>
  <div :class="parenClasses">
    <div :class="classes">
      <span class="text-center w-full" v-text="messageBox.lastMessage"></span>
    </div>
  </div>
</template>
<script>
import { mapState } from 'pinia'
import { useMainStore } from '../store/index'

export default {
  name: 'MessageBox',
  computed: {
    classes() {
      return [
        'w-5/6',
        'md:w-auto',
        this.messageBox.isError ? 'bg-red-600' : 'bg-green-600',
        'text-gray-100',
        'p-4',
        'rounded-md',
        'shadow',
        'flex',
        'transition-opacity-200',
      ].concat(
        this.messageBox.show
          ? ['opacity-1', 'pointer-events-auto', 'notice-me-senpai']
          : ['opacity-0']
      )
    },
    parenClasses() {
      return [
        'z-50',
        'fixed',
        'top-0',
        'left-0',
        'mt-16',
        'flex',
        'justify-center',
        'w-full',
        'pointer-events-none',
      ]
    },
    ...mapState(useMainStore, ['messageBox']),
  },
}
</script>
