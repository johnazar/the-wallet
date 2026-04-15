import { useAccountsStore } from '~/stores/accounts'
import { useAuthStore } from '~/stores/auth'
import { db } from '~/db'
import type { Account } from '~/types'

export const useAccounts = () => {
  const store = useAccountsStore()
  const auth = useAuthStore()

  async function loadForCurrentUser() {
    if (!auth.currentUserId) {
      store.accounts = []
      return
    }
    await store.loadAccountsForUser(auth.currentUserId)
  }

  async function getBalanceCents(accountId: number) {
    const account = await db.accounts.get(accountId)
    if (!account) return 0
    const txs = await db.transactions.where('accountId').equals(accountId).toArray()
    const txSum = txs.reduce((s, t) => s + (t.type === 'income' ? t.amountCents : -t.amountCents), 0)
    return account.initialBalanceCents + txSum
  }

  return { ...store, loadForCurrentUser, getBalanceCents }
}
