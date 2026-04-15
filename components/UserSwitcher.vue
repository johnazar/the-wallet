<template>
  <div class="flex items-center space-x-2">
    <select v-model="selected" class="p-2 border rounded">
      <option value="" disabled>Select user</option>
      <option v-for="u in store.users" :key="u.id" :value="u.id">{{ u.name }}</option>
    </select>
    <button class="px-3 py-2 bg-sky-500 text-white rounded" @click="newUser">New</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const store = useAuthStore()

onMounted(() => {
  store.loadUsers()
})

const selected = computed<number | string | null>({
  get: () => (store.currentUserId ?? ''),
  set: (v) => {
    if (v === '' || v === null || v === undefined) {
      store.setCurrentUser(null)
    } else {
      store.setCurrentUser(Number(v))
    }
  }
})

async function newUser() {
  const name = prompt('New user name') || `User ${Date.now()}`
  await store.createUser(name)
}
</script>
