<template>
  <div>
    <main>
      <section class="mb-4">
        <div class="bg-white shadow rounded p-4">
          <h2 class="text-sm text-gray-500">Total Balance</h2>
          <div class="text-2xl font-bold mt-1" aria-live="polite">{{ formatMoney(totalBalanceCents) }}</div>
          <div class="flex justify-between mt-3 text-sm text-gray-600">
            <div>
              <div class="text-xs">Income</div>
              <div class="font-medium text-green-600">{{ formatMoney(summary.income) }}</div>
            </div>
            <div>
              <div class="text-xs">Expense</div>
              <div class="font-medium text-red-600">{{ formatMoney(summary.expense) }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-4">
        <div class="bg-white shadow rounded p-4">
          <h2 class="text-sm text-gray-500">Income vs Expense</h2>
          <div class="mt-2">
            <DashboardCharts />
          </div>
        </div>
      </section>

      <section>
        <div class="bg-white shadow rounded p-4">
          <h2 class="text-sm text-gray-500">Recent Transactions</h2>
          <TransactionList />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import DashboardCharts from '~/components/DashboardCharts.vue'
import TransactionList from '~/components/TransactionList.vue'
import { useAccounts } from '~/composables/useAccounts'
import { useTransactions } from '~/composables/useTransactions'
import { useAuthStore } from '~/stores/auth'
import { centsToCurrency } from '~/utils/money'

const accounts = useAccounts()
const txs = useTransactions()
const auth = useAuthStore()

const totalBalanceCents = ref(0)
const summary = ref({ income: 0, expense: 0, net: 0 })

const currency = computed(() => auth.users.find((u) => u.id === auth.currentUserId)?.currency ?? 'USD')

async function loadDashboard() {
  if (!auth.currentUserId) {
    totalBalanceCents.value = 0
    summary.value = { income: 0, expense: 0, net: 0 }
    accounts.accounts = []
    return
  }

  await accounts.loadForCurrentUser()

  // compute total balance by summing balances for each account
  let total = 0
  for (const a of accounts.accounts) {
    if (!a.id) continue
    total += await accounts.getBalanceCents(a.id)
  }
  totalBalanceCents.value = total

  const s = await txs.getSummary()
  summary.value = s
}

onMounted(loadDashboard)

watch(() => auth.currentUserId, loadDashboard)

function formatMoney(cents: number) {
  return centsToCurrency(cents, currency.value)
}
</script>
