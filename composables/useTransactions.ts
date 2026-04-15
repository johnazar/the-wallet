import { useTransactionsStore } from '~/stores/transactions'
import { useAuthStore } from '~/stores/auth'
import type { Transaction } from '~/types'
import { db } from '~/db'

export const useTransactions = () => {
  const store = useTransactionsStore()
  const auth = useAuthStore()

  async function loadRecent(limit = 10) {
    if (!auth.currentUserId) {
      store.transactions = []
      return
    }
    await store.loadForUser(auth.currentUserId, limit)
  }

  async function addTransaction(payload: Omit<Transaction, 'id' | 'createdAt'>) {
    const id = await store.createTransaction(payload)
    if (auth.currentUserId) await store.loadForUser(auth.currentUserId, 100)
    return id
  }

  async function getSummary(startDate?: number, endDate?: number) {
    if (!auth.currentUserId) return { income: 0, expense: 0, net: 0 }
    const txs = await db.transactions.where('userId').equals(auth.currentUserId).toArray()
    const filtered = txs.filter(
      (t) => (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true)
    )
    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
    const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)
    return { income, expense, net: income - expense }
  }

  return { ...store, loadRecent, addTransaction, getSummary }
}
