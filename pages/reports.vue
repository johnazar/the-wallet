<template>
  <div class="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
    <main>
      <section>
        <div class="bg-white shadow rounded p-4">
          <h1 class="text-xl font-semibold mb-3">Reports & Export</h1>
          <div class="space-y-3">
            <button class="px-3 py-2 bg-sky-500 text-white rounded" @click="exportJSON">Export Full JSON</button>
            <button class="px-3 py-2 bg-green-500 text-white rounded" @click="exportCSV">Export Transactions CSV</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { db } from '~/db'
import { useAuthStore } from '~/stores/auth'
import Papa from 'papaparse'

const auth = useAuthStore()

async function exportJSON() {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    users: await db.users.toArray(),
    accounts: await db.accounts.toArray(),
    categories: await db.categories.toArray(),
    transactions: await db.transactions.toArray()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `the-wallet-export-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportCSV() {
  if (!auth.currentUserId) {
    alert('Select a user first')
    return
  }
  const txs = await db.transactions.where('userId').equals(auth.currentUserId).toArray()
  const rows = txs.map((t: any) => ({
    id: t.id,
    date: new Date(t.date).toISOString(),
    accountId: t.accountId,
    type: t.type,
    amountCents: t.amountCents,
    categoryId: t.categoryId,
    note: t.note
  }))
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
