<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <HeaderBar />

    <main class="flex-1 max-w-md w-full mx-auto p-4 sm:pb-4">
      <slot />
    </main>

    <FooterNav />
  </div>
</template>

<script setup lang="ts">
import HeaderBar from '~/components/HeaderBar.vue'
import FooterNav from '~/components/FooterNav.vue'
</script>
