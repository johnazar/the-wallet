import { useCategoriesStore } from '~/stores/categories'
import { useAuthStore } from '~/stores/auth'

export const useCategories = () => {
  const store = useCategoriesStore()
  const auth = useAuthStore()

  async function loadForCurrentUser() {
    if (!auth.currentUserId) {
      store.categories = []
      return
    }
    await store.loadCategoriesForUser(auth.currentUserId)
  }

  function getByType(type: 'income' | 'expense') {
    return store.categories.filter((c) => c.type === type)
  }

  return { ...store, loadForCurrentUser, getByType }
}
