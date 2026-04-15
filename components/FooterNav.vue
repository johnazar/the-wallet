<template>
  <footer class="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t sm:static sm:bg-white sm:backdrop-blur-none">
    <nav class="max-w-md mx-auto flex">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to" :class="linkClass(link.to)">
        {{ link.label }}
      </NuxtLink>
    </nav>
  </footer>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports', label: 'Reports' },
  { to: '/accounts', label: 'Accounts' }
]

function linkClass(to: string) {
  const base = 'flex-1 text-center py-3 text-xs'
  return route.path === to ? `${base} text-sky-600 font-semibold` : base
}
</script>
