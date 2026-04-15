import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '~/types'
import { db } from '~/db'

const STORAGE_KEY = 'the_wallet_currentUserId'

function readSavedUserId(): number | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (!v) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export const useAuthStore = defineStore('auth', () => {
  const currentUserId = ref<number | null>(readSavedUserId())
  const users = ref<User[]>([])

  async function loadUsers() {
    users.value = await db.users.toArray()
    // validate saved user exists
    if (currentUserId.value != null) {
      const exists = users.value.some((u) => u.id === currentUserId.value)
      if (!exists) {
        setCurrentUser(null)
      }
    }
  }

  async function createUser(name: string, currency = 'USD') {
    const id = await db.users.add({ name, currency, createdAt: Date.now() })
    await loadUsers()
    setCurrentUser(id)
    return id
  }

  function setCurrentUser(id: number | null) {
    currentUserId.value = id
    if (typeof window !== 'undefined') {
      if (id == null) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, String(id))
    }
  }

  return { currentUserId, users, loadUsers, createUser, setCurrentUser }
})
