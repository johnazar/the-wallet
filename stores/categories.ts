import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category } from '~/types'
import { db } from '~/db'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])

  async function loadCategoriesForUser(userId: number) {
    categories.value = await db.categories.where('userId').equals(userId).toArray()
  }

  async function createCategory(payload: Omit<Category, 'id' | 'createdAt'>) {
    const id = await db.categories.add({ ...payload, createdAt: Date.now() })
    await loadCategoriesForUser(payload.userId)
    return id
  }

  async function updateCategory(id: number, changes: Partial<Category>) {
    await db.categories.update(id, changes)
    const cat = await db.categories.get(id)
    if (cat) await loadCategoriesForUser(cat.userId)
  }

  async function deleteCategory(
    id: number,
    opts?: { reassignToCategoryId?: number; unassignTransactions?: boolean }
  ) {
    const cat = await db.categories.get(id)
    if (!cat) return
    const userId = cat.userId

    if (opts?.reassignToCategoryId) {
      await db.transaction('rw', db.transactions, db.categories, async () => {
        await db.transactions.where('categoryId').equals(id).modify((t: any) => {
          t.categoryId = opts.reassignToCategoryId!
        })
        await db.categories.delete(id)
      })
    } else if (opts?.unassignTransactions) {
      await db.transaction('rw', db.transactions, db.categories, async () => {
        await db.transactions.where('categoryId').equals(id).modify((t: any) => {
          // remove the categoryId field
          // using delete to keep transaction object shape consistent
          // (Dexie will persist the modified object)
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete t.categoryId
        })
        await db.categories.delete(id)
      })
    } else {
      const count = await db.transactions.where('categoryId').equals(id).count()
      if (count > 0) throw new Error('Category has transactions. Pass opts to reassign or unassign.')
      await db.categories.delete(id)
    }

    await loadCategoriesForUser(userId)
  }

  return { categories, loadCategoriesForUser, createCategory, updateCategory, deleteCategory }
})
