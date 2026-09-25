/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';

export interface Profile {
  id?: number;
  name: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: number;
}

export interface Account {
  id?: number;
  profileId: number;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'credit' | 'other';
  currency: string;
  initialBalance: number;
  createdAt: number;
}

export interface Transaction {
  id?: number;
  accountId: number;
  type: 'income' | 'expense';
  amount: number;
  date: number; // timestamp
  category: string;
  notes?: string;
  createdAt: number;
}

export class AppDatabase extends Dexie {
  profiles!: Table<Profile>;
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;

  constructor() {
    super('TheWalletDB');
    this.version(2).stores({
      profiles: '++id, name',
      accounts: '++id, profileId, name, type',
      transactions: '++id, accountId, type, date, category'
    });
  }
}

export const db = new AppDatabase();
