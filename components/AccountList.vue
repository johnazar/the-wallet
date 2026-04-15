<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold">Accounts</h3>
      <button class="px-2 py-1 bg-sky-500 text-white rounded" @click="showNew = !showNew">{{ showNew ? 'Close' : 'New' }}</button>
    </div>

    <div v-if="showNew" class="mb-4 bg-white p-3 rounded shadow">
      <input v-model="newAccount.name" placeholder="Name" class="w-full p-2 border rounded mb-2" />
      <div class="flex gap-2 mb-2">
        <select v-model="newAccount.type" class="p-2 border rounded">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="savings">Savings</option>
        </select>
        <input v-model="newAccount.initialBalance" placeholder="Initial balance" class="p-2 border rounded flex-1" />
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 bg-green-500 text-white rounded" @click="add">Add</button>
        <button class="px-3 py-2 bg-gray-200 rounded" @click="cancel">Cancel</button>
      </div>
    </div>

    <ul class="space-y-2">
      <li v-for="a in accounts.accounts" :key="a.id" class="flex items-center justify-between bg-white p-3 rounded shadow">
        <div>
          <div class="font-medium">{{ a.name }}</div>
          <div class="text-xs text-gray-500">{{ a.type }}</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-sm font-medium">{{ balances[a.id] ? formatMoney(balances[a.id]) : '-' }}</div>
          <button class="px-2 py-1 text-sm border rounded" @click="edit(a)">Edit</button>
          <button class="px-2 py-1 text-sm bg-red-500 text-white rounded" @click="remove(a)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAccounts } from '~/composables/useAccounts'
import { useAuthStore } from '~/stores/auth'
import { parseCurrencyToCents, centsToCurrency } from '~/utils/money'
import { db } from '~/db'

const accounts = useAccounts()
const auth = useAuthStore()

const showNew = ref(false)
const newAccount = ref({ name: '', type: 'cash', initialBalance: '0.00', userId: auth.currentUserId ?? 0 })
const balances = ref<Record<number, number>>({})

async function loadBalances() {
  const map: Record<number, number> = {}
  for (const a of accounts.accounts) {
    // safe: fallback 0
    map[a.id as number] = await accounts.getBalanceCents(a.id as number)
  }
  balances.value = map
}

async function load() {
  if (!auth.currentUserId) return
  await accounts.loadForCurrentUser()
  await loadBalances()
}

onMounted(load)

watch(() => auth.currentUserId, async () => {
  newAccount.value.userId = auth.currentUserId ?? 0
  await load()
})

async function add() {
  if (!auth.currentUserId) {
    alert('Select a user first')
    return
  }
  if (!newAccount.value.name.trim()) {
    alert('Name required')
    return
  }
  await accounts.createAccount({
    userId: auth.currentUserId,
    name: newAccount.value.name,
    type: newAccount.value.type,
    initialBalanceCents: parseCurrencyToCents(newAccount.value.initialBalance)
  })
  newAccount.value = { name: '', type: 'cash', initialBalance: '0.00', userId: auth.currentUserId ?? 0 }
  showNew.value = false
  await load()
}

function cancel() {
  showNew.value = false
}

async function edit(a: any) {
  const name = prompt('Account name', a.name)
  if (name === null) return
  const type = prompt('Type (cash|bank|savings)', a.type)
  if (type === null) return
  await accounts.updateAccount(a.id, { name, type })
  await load()
}

async function remove(a: any) {
  const count = await db.transactions.where('accountId').equals(a.id).count()
  if (count > 0) {
    if (!confirm(`Account has ${count} transactions. Delete account and its transactions?`)) return
    await accounts.deleteAccount(a.id, { deleteTransactions: true })
  } else {
    if (!confirm('Delete account?')) return
    await accounts.deleteAccount(a.id)
  }
  await load()
}

function formatMoney(cents: number) {
  return centsToCurrency(cents, auth.users.find((u) => u.id === auth.currentUserId)?.currency ?? 'USD')
}

</script>
