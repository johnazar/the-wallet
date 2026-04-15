import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction } from '~/types'
import { db } from '~/db'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])

  async function loadForUser(userId: number, limit = 100, sortBy: 'date' | 'amount' = 'date', desc = true) {
    let arr = await db.transactions.where('userId').equals(userId).toArray()
    arr.sort((a, b) => {
      if (sortBy === 'date') return desc ? b.date - a.date : a.date - b.date
      return desc ? b.amountCents - a.amountCents : a.amountCents - b.amountCents
    })
    transactions.value = limit ? arr.slice(0, limit) : arr
  }

  async function queryForUser(
    userId: number,
    filters?: {
      accountId?: number
      categoryId?: number
      type?: 'income' | 'expense'
      startDate?: number
      endDate?: number
      sortBy?: 'date' | 'amount'
      desc?: boolean
    }
  ) {
    let coll: any = db.transactions.where('userId').equals(userId)
    if (filters?.accountId) coll = coll.and((t: Transaction) => t.accountId === filters.accountId)
    if (filters?.categoryId) coll = coll.and((t: Transaction) => t.categoryId === filters.categoryId)
    if (filters?.type) coll = coll.and((t: Transaction) => t.type === filters.type)
    if (filters?.startDate || filters?.endDate) {
      const s = filters.startDate ?? -Infinity
      const e = filters.endDate ?? Infinity
      coll = coll.and((t: Transaction) => t.date >= s && t.date <= e)
    }
    const arr: Transaction[] = await coll.toArray()
    if (filters?.sortBy) {
      arr.sort((a, b) =>
        filters.sortBy === 'date'
          ? filters.desc
            ? b.date - a.date
            : a.date - b.date
          : filters.desc
          ? b.amountCents - a.amountCents
          : a.amountCents - b.amountCents
      )
    }
    return arr
  }

  async function createTransaction(payload: Omit<Transaction, 'id' | 'createdAt'>) {
    const id = await db.transactions.add({ ...payload, createdAt: Date.now() })
    return id
  }

  async function updateTransaction(id: number, changes: Partial<Transaction>) {
    await db.transactions.update(id, changes)
  }

  async function deleteTransaction(id: number) {
    await db.transactions.delete(id)
  }

  return { transactions, loadForUser, queryForUser, createTransaction, updateTransaction, deleteTransaction }
})
