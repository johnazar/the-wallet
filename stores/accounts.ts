import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account } from '~/types'
import { db } from '~/db'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])

  async function loadAccountsForUser(userId: number) {
    accounts.value = await db.accounts.where('userId').equals(userId).toArray()
  }

  async function createAccount(payload: Omit<Account, 'id' | 'createdAt'>) {
    const id = await db.accounts.add({ ...payload, createdAt: Date.now() })
    await loadAccountsForUser(payload.userId)
    return id
  }

  async function updateAccount(id: number, changes: Partial<Account>) {
    await db.accounts.update(id, changes)
    const acc = await db.accounts.get(id)
    if (acc) await loadAccountsForUser(acc.userId)
  }

  async function deleteAccount(
    id: number,
    opts?: { reassignToAccountId?: number; deleteTransactions?: boolean }
  ) {
    const acc = await db.accounts.get(id)
    if (!acc) return
    const userId = acc.userId

    if (opts?.reassignToAccountId) {
      await db.transaction('rw', db.transactions, db.accounts, async () => {
        await db.transactions.where('accountId').equals(id).modify((t: any) => {
          t.accountId = opts.reassignToAccountId!
        })
        await db.accounts.delete(id)
      })
    } else if (opts?.deleteTransactions) {
      await db.transaction('rw', db.transactions, db.accounts, async () => {
        await db.transactions.where('accountId').equals(id).delete()
        await db.accounts.delete(id)
      })
    } else {
      const count = await db.transactions.where('accountId').equals(id).count()
      if (count > 0) throw new Error('Account has transactions. Pass opts to delete or reassign.')
      await db.accounts.delete(id)
    }

    await loadAccountsForUser(userId)
  }

  return { accounts, loadAccountsForUser, createAccount, updateAccount, deleteAccount }
})
