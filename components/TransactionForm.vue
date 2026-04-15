<template>
  <div class="bg-white p-4 rounded shadow mb-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium">{{ isEdit ? 'Edit' : 'New' }} Transaction</h4>
      <button class="text-sm text-gray-500" @click="$emit('close')">Close</button>
    </div>

    <form @submit.prevent="save">
      <div class="grid grid-cols-2 gap-2 mb-2">
        <select v-model="form.type" class="p-2 border rounded">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select v-model.number="form.accountId" class="p-2 border rounded">
          <option v-for="a in accounts.accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </div>

      <div class="mb-2">
        <input v-model="form.amount" inputmode="decimal" placeholder="Amount" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-2">
        <select v-model.number="form.categoryId" class="w-full p-2 border rounded">
          <option :value="undefined">Uncategorized</option>
          <option v-for="c in categories.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="mb-2">
        <input v-model="form.note" placeholder="Note" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-2">
        <input v-model="form.dateLocal" type="datetime-local" class="w-full p-2 border rounded" />
      </div>

      <div class="flex gap-2">
        <button class="px-3 py-2 bg-sky-500 text-white rounded" type="submit">Save</button>
        <button class="px-3 py-2 bg-gray-200 rounded" type="button" @click="$emit('close')">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAccounts } from '~/composables/useAccounts'
import { useCategories } from '~/composables/useCategories'
import { useTransactions } from '~/composables/useTransactions'
import { parseCurrencyToCents } from '~/utils/money'
import { format } from 'date-fns'
import type { Transaction } from '~/types'

const props = defineProps<{ transaction?: Transaction | null }>()
// Avoid tuple-generic form which can cause SFC parser issues; use array form and narrow the type
const emit = defineEmits(['saved', 'close']) as {
  (e: 'saved'): void
  (e: 'close'): void
}

const auth = useAuthStore()
const accounts = useAccounts()
const categories = useCategories()
const txs = useTransactions()

const isEdit = ref(false)

const form = ref({
  type: 'expense',
  amount: '0.00',
  accountId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  note: '',
  dateLocal: format(new Date(), "yyyy-MM-dd'T'HH:mm")
})

watch(
  () => props.transaction,
  (t) => {
    if (t) {
      isEdit.value = true
      form.value.type = t.type
      form.value.amount = (t.amountCents / 100).toFixed(2)
      form.value.accountId = t.accountId
      form.value.categoryId = t.categoryId
      form.value.note = t.note || ''
      form.value.dateLocal = format(new Date(t.date), "yyyy-MM-dd'T'HH:mm")
    } else {
      isEdit.value = false
      form.value = {
        type: 'expense',
        amount: '0.00',
        accountId: accounts.accounts[0]?.id,
        categoryId: undefined,
        note: '',
        dateLocal: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      }
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await accounts.loadForCurrentUser()
  await categories.loadForCurrentUser()
  if (!props.transaction && accounts.accounts.length) {
    form.value.accountId = accounts.accounts[0].id
  }
})

async function save() {
  if (!auth.currentUserId) {
    alert('Select a user first')
    return
  }
  const payload: any = {
    userId: auth.currentUserId,
    accountId: Number(form.value.accountId),
    type: form.value.type as 'income' | 'expense',
    amountCents: parseCurrencyToCents(form.value.amount),
    categoryId: form.value.categoryId ? Number(form.value.categoryId) : undefined,
    note: form.value.note,
    date: new Date(form.value.dateLocal).getTime()
  }

  if (isEdit.value && props.transaction && props.transaction.id) {
    await txs.updateTransaction(props.transaction.id, payload)
  } else {
    await txs.addTransaction(payload)
  }

  emit('saved')
}
</script>
