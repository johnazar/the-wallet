<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold">Recent Transactions</h3>
      <div>
        <button class="px-2 py-1 bg-sky-500 text-white rounded" @click="openNew">New</button>
      </div>
    </div>

    <TransactionForm v-if="showForm" :transaction="editing" @saved="onSaved" @close="closeForm" />

    <div v-if="transactions && transactions.length === 0" class="text-sm text-gray-500 p-4 bg-white rounded shadow">No transactions yet.</div>

    <ul v-else class="space-y-2">
      <li v-for="t in transactions" :key="t.id" class="flex items-center justify-between bg-white p-3 rounded shadow">
        <div>
          <div class="text-sm font-medium">{{ formatDate(t.date) }} — {{ t.note || '-' }}</div>
          <div class="text-xs text-gray-500">{{ accountName(t.accountId) }} · {{ categoryName(t.categoryId) }}</div>
        </div>
        <div class="flex items-center gap-2">
          <div :class="t.type === 'income' ? 'text-green-600' : 'text-red-600'" class="font-medium">
            {{ formatMoney(t.amountCents) }}
          </div>
          <button class="px-2 py-1 text-sm border rounded" @click="edit(t)">Edit</button>
          <button class="px-2 py-1 text-sm bg-red-500 text-white rounded" @click="remove(t)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTransactions } from '~/composables/useTransactions'
import { useAccounts } from '~/composables/useAccounts'
import { useCategories } from '~/composables/useCategories'
import { useAuthStore } from '~/stores/auth'
import TransactionForm from '~/components/TransactionForm.vue'
import { centsToCurrency } from '~/utils/money'
import { format } from 'date-fns'

const txs = useTransactions()
const accounts = useAccounts()
const categories = useCategories()
const auth = useAuthStore()
const transactions = txs.transactions

const showForm = ref(false)
const editing = ref(null)

function openNew() {
  editing.value = null
  showForm.value = true
}

function edit(t: any) {
  editing.value = t
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function onSaved() {
  await load()
  closeForm()
}

async function load() {
  if (!auth.currentUserId) return
  await accounts.loadForCurrentUser()
  await categories.loadForCurrentUser()
  await txs.loadRecent(50)
}

onMounted(load)

watch(() => auth.currentUserId, load)

function formatMoney(cents: number) {
  return centsToCurrency(cents, auth.users.find((u) => u.id === auth.currentUserId)?.currency ?? 'USD')
}

function formatDate(ts: number) {
  return format(new Date(ts), 'MMM d')
}

function accountName(accountId: number) {
  const a = accounts.accounts.find((x: any) => x.id === accountId)
  return a ? a.name : 'Unknown'
}

function categoryName(categoryId?: number) {
  if (!categoryId) return 'Uncategorized'
  const c = categories.categories.find((x: any) => x.id === categoryId)
  return c ? c.name : 'Unknown'
}

async function remove(t: any) {
  if (!confirm('Delete transaction?')) return
  await txs.deleteTransaction(t.id)
  await load()
}

</script>

