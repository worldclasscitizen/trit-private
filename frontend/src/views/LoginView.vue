<template>
  <AuthLayout>
    <div class="text-left h-full px-10 flex flex-col justify-center">
      <h2 class="text-5xl font-black mb-3">로그인</h2>
      <p class="text-lg font-base text-gray-500 mb-8">오늘은 어떤 여행을 남겨볼까요?</p>

      <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label for="email" class="sr-only">이메일</label>
            <input
              type="email"
              id="email"
              v-model="email"
              placeholder="이메일"
              required
              class="w-full rounded-full border-2 border-gray-700 bg-white py-3 px-5 text-sm font-medium transition-all placeholder:font-medium focus:border-b-4 focus:border-r-4 focus: focus:outline-none focus:ring-0"
            />
          </div>

          <div>
            <label for="password" class="sr-only">비밀번호</label>
            <div class="relative">
              <input
                :type="isPasswordVisible ? 'text' : 'password'"
                id="password"
                v-model="password"
                placeholder="비밀번호"
                required
                class="w-full rounded-full border-2 border-gray-700 bg-white py-3 px-5 text-sm font-medium transition-all placeholder:font-medium focus:border-b-4 focus:border-r-4 focus: focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-500 hover:text-[#E88555]"
              >
                <EyeIcon v-if="isPasswordVisible" class="h-5 w-5" />
                <EyeSlashIcon v-else class="h-5 w-5" />
              </button>
            </div>
            <div class="justify-self-end mt-3">
              <router-link to="/find-account" class="text-[#6750DF] hover:text-[#1b1d0d] hover:underline">
                아이디/비밀번호를 잊으셨나요?
              </router-link>
            </div>
          </div>
          <button
            type="submit"
            :disabled="isLoading"
            class="mt-5 flex w-full text-xl items-center justify-center border-2 rounded-full bg-[#1b1d0d] p-3 font-black text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_#2C2C2C] focus:outline-none disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:shadow-none hover:border-2 hover:border-[#1b1d0d]"
          >
            <div
              v-if="isLoading"
              class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
            <span>{{ isLoading ? '로그인 중...' : '로그인' }}</span>
          </button>
        </form>
      <div class="mt-6 text-base text-center ">
        계정이 없으신가요?
        <router-link to="/signup" class="text-[#6750DF] hover:text-[#1b1d0d] hover:underline">
            회원가입하러 가기
        </router-link>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router';
import AuthLayout from '@/components/auth/AuthLayout.vue';

const router = useRouter();
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const isPasswordVisible = ref(false)

function togglePasswordVisibility() {
isPasswordVisible.value = !isPasswordVisible.value
}

async function handleLogin() {
  isLoading.value = true
  try {
    const success = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (success) {
      router.push('/home') // Redirect to home on successful login
    } else {
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')
      password.value = '' // Clear password field
    }
  } finally {
    isLoading.value = false
  }
}
</script>
