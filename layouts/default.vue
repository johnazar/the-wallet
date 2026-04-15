<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-md mx-auto p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UserSwitcher />
          <div>
            <div v-if="userName" class="text-sm font-semibold">{{ userName }}</div>
            <div v-else class="text-sm text-gray-500">Not signed in</div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-sm font-medium">{{ formatMoney(totalCents) }}</div>
          <div v-if="user" class="text-xs text-sky-500 mt-1">
            <button class="text-sm" @click="logout">Logout</button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-md w-full mx-auto p-4 pb-24 sm:pb-4">
      <slot />
    </main>

    <footer class="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t sm:static sm:bg-white sm:backdrop-blur-none">
      <nav class="max-w-md mx-auto flex">
        <NuxtLink to="/dashboard" class="flex-1 text-center py-3 text-xs">Dashboard</NuxtLink>
        <NuxtLink to="/transactions" class="flex-1 text-center py-3 text-xs">Transactions</NuxtLink>
        <NuxtLink to="/reports" class="flex-1 text-center py-3 text-xs">Reports</NuxtLink>
        <NuxtLink to="/accounts" class="flex-1 text-center py-3 text-xs">Accounts</NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useAccounts } from '~/composables/useAccounts'
import { db } from '~/db'
import { centsToCurrency } from '~/utils/money'

const auth = useAuthStore()
const accounts = useAccounts()
const router = useRouter()

const user = computed(() => auth.users.find((u) => u.id === auth.currentUserId) ?? null)
const userName = computed(() => user.value ? user.value.name : '')
const userCurrency = computed(() => user.value?.currency ?? 'USD')

const totalCents = ref(0)

async function updateTotal() {
  if (!auth.currentUserId) {
    totalCents.value = 0
    return
  }
  await accounts.loadForCurrentUser()
  let sum = 0
  for (const a of accounts.accounts) {
    if (!a.id) continue
    sum += await accounts.getBalanceCents(a.id)
  }
  totalCents.value = sum
}

function formatMoney(cents: number) {
  return centsToCurrency(cents, userCurrency.value)
}

function logout() {
  auth.setCurrentUser(null)
  router.push('/')
}

onMounted(() => {
  auth.loadUsers()
  updateTotal()
  // subscribe to DB changes to refresh totals
  try {
    db.on('changes', changesHandler)
  } catch (e) {}
})

function changesHandler(changes: any) {
  if (!Array.isArray(changes)) return
  if (changes.some((c: any) => c.table === 'transactions' || c.table === 'accounts')) updateTotal()
}

onBeforeUnmount(() => {
  try {
    db.on('changes').unsubscribe(changesHandler)
  } catch (e) {}
})

watch(() => auth.currentUserId, () => updateTotal())
</script>
