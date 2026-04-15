export interface User {
  id?: number
  name: string
  currency: string
  createdAt: number
}

export interface Account {
  id?: number
  userId: number
  name: string
  type: 'cash' | 'bank' | 'savings' | string
  initialBalanceCents: number
  createdAt: number
}

export interface Category {
  id?: number
  userId: number
  name: string
  type: 'income' | 'expense'
  color?: string
  createdAt: number
}

export interface Transaction {
  id?: number
  userId: number
  accountId: number
  type: 'income' | 'expense'
  amountCents: number
  categoryId?: number
  note?: string
  date: number
  createdAt: number
}
