<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <h1 class="text-2xl font-semibold mb-4 text-center">
        Welcome to The Wallet
      </h1>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-sm text-gray-500 mb-2">Select user to continue</h2>

        <ul class="divide-y">
          <li
            v-for="u in users"
            :key="u.id"
            class="py-2 flex items-center justify-between"
          >
            <div>
              <div class="font-medium">{{ u.name }}</div>
              <div class="text-xs text-gray-500">{{ u.currency }}</div>
            </div>
            <div>
              <button
                class="px-3 py-1 bg-sky-500 text-white rounded"
                @click="login(u.id)"
              >
                Login
              </button>
            </div>
          </li>
        </ul>

        <div v-if="users.length === 0" class="text-sm text-gray-500 mt-2">
          No users yet — create one below.
        </div>

        <hr class="my-4" />

        <div>
          <input
            v-model="newUserName"
            placeholder="Name"
            class="w-full p-2 border rounded mb-2"
          />
          <select
            v-model="newUserCurrency"
            class="w-full p-2 border rounded mb-2"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AED">AED</option>
          </select>
          <div class="flex gap-2 justify-center">
            <button
              class="px-3 py-2 bg-green-500 text-white rounded"
              @click="createAndLogin"
            >
              Create & Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "blank" });
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const newUserName = ref("");
const newUserCurrency = ref("USD");

const users = computed(() => auth.users || []);

onMounted(() => {
  auth.loadUsers();
});

function login(id: number) {
  auth.setCurrentUser(id);
  router.push("/dashboard");
}

async function createAndLogin() {
  if (!newUserName.value.trim()) {
    alert("Name required");
    return;
  }
  const id = await auth.createUser(
    newUserName.value.trim(),
    newUserCurrency.value,
  );
  if (id) router.push("/dashboard");
}
</script>
