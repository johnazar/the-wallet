<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold">Categories</h3>
      <button class="px-2 py-1 bg-sky-500 text-white rounded" @click="showNew = !showNew">
        {{ showNew ? 'Close' : 'New' }}
      </button>
    </div>

    <div v-if="showNew" class="mb-4 bg-white p-3 rounded shadow">
      <input v-model="newCategory.name" placeholder="Name" class="w-full p-2 border rounded mb-2" />
      <div class="flex gap-2 mb-2">
        <select v-model="newCategory.type" class="p-2 border rounded">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input v-model="newCategory.color" type="color" class="w-12 h-10 p-0 border rounded" />
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 bg-green-500 text-white rounded" @click="add">Add</button>
        <button class="px-3 py-2 bg-gray-200 rounded" @click="reset">Cancel</button>
      </div>
    </div>

    <ul class="space-y-2">
      <li v-for="c in categories" :key="c.id" class="flex items-center justify-between bg-white p-3 rounded shadow">
        <div class="flex items-center gap-3">
          <span :style="{background: c.color || '#ddd'}" class="w-6 h-6 rounded-full inline-block"></span>
          <div>
            <div class="font-medium">{{ c.name }}</div>
            <div class="text-xs text-gray-500">{{ c.type }}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-2 py-1 text-sm border rounded" @click="edit(c)">Edit</button>
          <button class="px-2 py-1 text-sm bg-red-500 text-white rounded" @click="remove(c)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { useCategories } from '~/composables/useCategories'
import { useAuthStore } from '~/stores/auth'
import type { Category } from '~/types'

const categoriesComposable = useCategories()
const auth = useAuthStore()
const showNew = ref(false)
const newCategory = ref<Omit<Category, 'id' | 'createdAt'>>({ name: '', type: 'expense', color: '#f97316', userId: auth.currentUserId ?? 0 })

onMounted(async () => {
  await categoriesComposable.loadForCurrentUser()
})

watchEffect(() => {
  newCategory.value.userId = auth.currentUserId ?? 0
})

function reset() {
  newCategory.value = { name: '', type: 'expense', color: '#f97316', userId: auth.currentUserId ?? 0 }
  showNew.value = false
}

async function add() {
  if (!auth.currentUserId) {
    alert('Select a user first')
    return
  }
  if (!newCategory.value.name.trim()) {
    alert('Name required')
    return
  }
  await categoriesComposable.createCategory({ ...newCategory.value })
  await categoriesComposable.loadForCurrentUser()
  reset()
}

async function edit(cat: Category) {
  const name = prompt('Category name', cat.name)
  if (name === null) return
  const color = prompt('Color hex', cat.color || '#f97316')
  if (color === null) return
  await categoriesComposable.updateCategory(cat.id!, { name, color })
  await categoriesComposable.loadForCurrentUser()
}

async function remove(cat: Category) {
  if (!confirm('Delete category? This will unassign category from transactions.')) return
  try {
    await categoriesComposable.deleteCategory(cat.id!, { unassignTransactions: true })
    await categoriesComposable.loadForCurrentUser()
  } catch (e: any) {
    alert(e.message || 'Delete failed')
  }
}
</script>
