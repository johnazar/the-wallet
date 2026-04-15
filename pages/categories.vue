<template>
  <div class="bg-gray-50 p-4 max-w-md mx-auto">
    <main>
      <section>
        <div class="bg-white shadow rounded p-4">
          <h1 class="text-xl font-semibold mb-3">Categories</h1>
          <CategoryManager />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import CategoryManager from '~/components/CategoryManager.vue'
</script>
