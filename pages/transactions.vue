<template>
  <div class="bg-gray-50 p-4 max-w-md mx-auto">
    <main>
      <section>
        <div class="bg-white shadow rounded p-4">
          <h1 class="text-xl font-semibold mb-3">Transactions</h1>
          <TransactionList />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import TransactionList from '~/components/TransactionList.vue'
</script>
