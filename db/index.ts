import Dexie, { Table } from 'dexie'
import type { User, Account, Category, Transaction } from '../types'

export class WalletDB extends Dexie {
  users!: Table<User, number>
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>

  constructor() {
    super('the_wallet')

    this.version(1).stores({
      users: '++id, name, currency, createdAt',
      accounts: '++id, userId, name, type, createdAt',
      categories: '++id, userId, name, type, color, createdAt',
      transactions: '++id, userId, accountId, date, type, categoryId, createdAt'
    })
  }
}

export const db = new WalletDB()
