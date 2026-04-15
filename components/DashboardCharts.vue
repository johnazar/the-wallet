<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="bg-white rounded shadow p-3">
      <h3 class="text-sm font-medium mb-2">Expenses by Category</h3>
      <canvas ref="pieCanvas" style="width:100%;height:180px"></canvas>
      <div v-if="!hasData" class="text-xs text-gray-400 mt-2">No expense data yet.</div>
    </div>

    <div class="bg-white rounded shadow p-3">
      <h3 class="text-sm font-medium mb-2">Income / Expense (30 days)</h3>
      <canvas ref="lineCanvas" style="width:100%;height:180px"></canvas>
      <div v-if="!hasData" class="text-xs text-gray-400 mt-2">No transaction data yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import Chart from 'chart.js/auto'
import type { Chart as ChartJS } from 'chart.js'
import { liveQuery } from 'dexie'
import { db } from '~/db'
import { useAuthStore } from '~/stores/auth'
import { useTransactions } from '~/composables/useTransactions'
import { useCategories } from '~/composables/useCategories'
import { startOfDay, subDays, format } from 'date-fns'
import { centsToCurrency } from '~/utils/money'

const pieCanvas = ref<HTMLCanvasElement | null>(null)
const lineCanvas = ref<HTMLCanvasElement | null>(null)

let pieChart: ChartJS | null = null
let lineChart: ChartJS | null = null
let subscription: { unsubscribe: () => void } | null = null

const auth = useAuthStore()
const txs = useTransactions()
const cats = useCategories()

const RANGE_DAYS = 30

const hasData = ref(false)

function destroyCharts() {
  try {
    pieChart?.destroy()
  } catch (e) {}
  try {
    lineChart?.destroy()
  } catch (e) {}
  pieChart = null
  lineChart = null
}

function initOrUpdatePie(labels: string[], data: number[], colors: string[]) {
  if (!pieCanvas.value) return
  if (pieChart) {
    pieChart.data.labels = labels
    // @ts-ignore
    pieChart.data.datasets[0].data = data
    // @ts-ignore
    pieChart.data.datasets[0].backgroundColor = colors
    pieChart.update()
    return
  }

  pieChart = new Chart(pieCanvas.value.getContext('2d')!, {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0
        }
      ]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label(ctx: any) {
              const value = ctx.raw as number
              const currency = auth.users.find((u) => u.id === auth.currentUserId)?.currency ?? 'USD'
              return `${ctx.label}: ${centsToCurrency(Math.round(value * 100), currency)}`
            }
          }
        },
        legend: { display: true }
      }
    }
  })
}

function initOrUpdateLine(labels: string[], incomeData: number[], expenseData: number[]) {
  if (!lineCanvas.value) return
  if (lineChart) {
    lineChart.data.labels = labels
    // @ts-ignore
    lineChart.data.datasets[0].data = incomeData
    // @ts-ignore
    lineChart.data.datasets[1].data = expenseData
    lineChart.update()
    return
  }

  const currency = auth.users.find((u) => u.id === auth.currentUserId)?.currency ?? 'USD'

  lineChart = new Chart(lineCanvas.value.getContext('2d')!, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          tension: 0.25,
          fill: true,
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          tension: 0.25,
          fill: true,
        }
      ]
    },
    options: {
      scales: {
        x: { display: true },
        y: {
          ticks: {
            callback(value: any) {
              // value is in dollars (we store chart data as dollars)
              return centsToCurrency(Math.round(value * 100), currency)
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(ctx: any) {
              const v = ctx.raw as number
              return `${ctx.dataset.label}: ${centsToCurrency(Math.round(v * 100), currency)}`
            }
          }
        }
      }
    }
  })
}

function renderFromRows(rows: any[]) {
  const transactions = rows || []
  if (!transactions.length) {
    hasData.value = false
    initOrUpdatePie([], [], [])
    initOrUpdateLine([], [], [])
    return
  }

  hasData.value = true

  // Pie: expenses by category
  const expenseTxs = transactions.filter((t) => t.type === 'expense')
  const byCategory = new Map<string, number>()
  for (const t of expenseTxs) {
    const key = t.categoryId != null ? String(t.categoryId) : 'uncategorized'
    byCategory.set(key, (byCategory.get(key) || 0) + t.amountCents)
  }

  const pieEntries = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])
  const categoriesList = cats.categories || []
  const pieLabels = pieEntries.map(([key]) => {
    if (key === 'uncategorized') return 'Uncategorized'
    const c = categoriesList.find((x: any) => String(x.id) === key)
    return c ? c.name : 'Unknown'
  })
  const pieData = pieEntries.map(([, amountCents]) => amountCents / 100)
  const pieColors = pieEntries.map(([key]) => {
    if (key === 'uncategorized') return '#9CA3AF'
    const c = categoriesList.find((x: any) => String(x.id) === key)
    return c?.color ?? '#60A5FA'
  })

  initOrUpdatePie(pieLabels, pieData, pieColors)

  // Line: last RANGE_DAYS days income vs expense
  const labels: string[] = []
  const incomeData: number[] = []
  const expenseData: number[] = []
  const today = new Date()
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const day = startOfDay(subDays(today, i))
    const dayStart = day.getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1
    labels.push(format(day, 'MM/dd'))
    const dayTxs = transactions.filter((t) => t.date >= dayStart && t.date <= dayEnd)
    incomeData.push(dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0) / 100)
    expenseData.push(dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0) / 100)
  }

  initOrUpdateLine(labels, incomeData, expenseData)
}

function subscribeToUser(userId: number | null) {
  if (subscription) {
    try {
      subscription.unsubscribe()
    } catch (e) {}
    subscription = null
  }

  if (!userId) {
    renderFromRows([])
    return
  }

  const live = liveQuery(() => db.transactions.where('userId').equals(userId).toArray())
  subscription = live.subscribe({
    next: async (rows: any[]) => {
      // ensure categories are loaded so names/colors are available
      await cats.loadForCurrentUser()
      renderFromRows(rows)
    }
  })
}

onMounted(() => {
  // initial subscribe
  subscribeToUser(auth.currentUserId)
})

watch(() => auth.currentUserId, (v) => {
  subscribeToUser(v)
})

onBeforeUnmount(() => {
  if (subscription) subscription.unsubscribe()
  destroyCharts()
})
</script>

