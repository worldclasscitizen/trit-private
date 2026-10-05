<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TravelNavbar from '@/components/common/TravelNavbar.vue'

const router = useRouter()
const authStore = useAuthStore()

// Use a computed property to reactively get the user from the store
const user = computed(() => authStore.user)

// Separate refs for UI state
const newNickname = ref(user.value?.nickname || '')
const isNicknameEditDisabled = ref(true) // Per requirement, editing is disabled

function handleNavigation(page: 'main' | 'search' | 'trips' | 'log') {
  router.push({ name: page })
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F5] font-sans">
    <TravelNavbar currentPage="main" @navigate="handleNavigation" />

    <main class="pt-[120px] pb-20">
      <div class="mx-auto max-w-2xl">
        <div
          class="rounded-2xl border-2 border-[#2C2C2C] bg-white p-8 shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)]"
        >
          <div class="mb-8 border-b-2 border-gray-100 pb-6">
            <h1 class="text-4xl font-black text-gray-800">설정</h1>
            <p class="mt-2 text-base font-medium text-gray-500">
              회원님의 계정 정보를 관리할 수 있습니다.
            </p>
          </div>

          <div class="space-y-8">
            <div>
              <label for="nickname" class="text-lg font-bold text-gray-700">닉네임</label>
              <div class="mt-2 flex items-center gap-3">
                <input
                  type="text"
                  id="nickname"
                  v-model="newNickname"
                  class="w-full rounded-lg border-2 border-[#2C2C2C] bg-white p-3 text-sm font-medium transition-all placeholder:font-medium focus:border-[#E88555] focus:outline-none focus:ring-0 disabled:bg-gray-100"
                  :disabled="isNicknameEditDisabled"
                />
                <button
                  class="flex-shrink-0 rounded-lg border-2 border-[#2C2C2C] bg-[#E88555] px-6 py-3 font-black text-white transition-all focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                  :disabled="isNicknameEditDisabled"
                  title="닉네임 변경 기능은 현재 준비 중입니다."
                >
                  변경
                </button>
              </div>
            </div>

            <div>
              <label for="email" class="text-lg font-bold text-gray-700">이메일</label>
              <input
                type="email"
                id="email"
                :value="user?.email || ''"
                class="mt-2 w-full rounded-lg border-2 border-gray-200 bg-gray-100 p-3 text-sm font-medium text-gray-500 focus:outline-none"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
