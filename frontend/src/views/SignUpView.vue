<template>
    <AuthLayout>
      <div class="text-left h-full px-10 flex flex-col justify-center">
        <h2 class="text-5xl font-black mb-3">환영합니다!</h2>
        <p class="text-lg font-base text-gray-500 mb-8">여행을 기록하고, 새로운 영감을 발견하세요.</p>

        <form @submit.prevent="handleSignUp" class="space-y-6">
          <div>
            <label for="nickname" class="sr-only">닉네임</label>
            <input
              type="text"
              id="nickname"
              v-model="nickname"
              placeholder="닉네임"
              required
              class="w-full rounded-full border-2 border-gray-700 bg-white py-3 px-5 text-sm font-medium transition-all placeholder:font-medium focus:border-b-4 focus:border-r-4 focus: focus:outline-none focus:ring-0"
            />
          </div>

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
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-[#E88555]"
              >
                <EyeIcon v-if="isPasswordVisible" class="h-5 w-5" />
                <EyeSlashIcon v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div class="">
            <label for="passwordConfirm" class="sr-only">비밀번호 확인</label>
            <input
              type="password"
              id="passwordConfirm"
              v-model="passwordConfirm"
              placeholder="비밀번호 확인"
              required
              class="w-full rounded-full border-2 border-gray-700 bg-white py-3 px-5 text-sm font-medium transition-all placeholder:font-medium focus:border-b-4 focus:border-r-4 focus: focus:outline-none focus:ring-0"
              :class="{ 'border-red-500': isPasswordMismatch }"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-red-500 text-center">{{ errorMessage }}</p>

          <button
            type="submit"
            :disabled="!!(isLoading || isPasswordMismatch)"
            class="mt-5 flex w-full border-2 text-xl items-center justify-center rounded-full bg-[#1b1d0d] p-3 font-black text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_#2C2C2C] focus:outline-none disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:shadow-none hover:border-2 hover:border-[#1b1d0d]"
          >
            <div
              v-if="isLoading"
              class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
            <span>{{ isLoading ? '가입하는 중...' : '회원가입' }}</span>
          </button>
        </form>

        <div class="mt-8 text-center">
          이미 계정이 있으신가요?
          <router-link :to="{ name: 'login' }" class="text-[#6750DF] hover:text-[#1b1d0d] hover:underline">
            로그인하러 가기
          </router-link>
        </div>
      </div>
    </AuthLayout>
  </template>

  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import AuthLayout from '@/components/auth/AuthLayout.vue';
  import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

  const router = useRouter()
  const authStore = useAuthStore()

  const email = ref('')
  const password = ref('')
  const passwordConfirm = ref('')
  const nickname = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const isPasswordVisible = ref(false)

  function togglePasswordVisibility() {
    isPasswordVisible.value = !isPasswordVisible.value
  }

  const isPasswordMismatch = computed(() => {
    return password.value && passwordConfirm.value && password.value !== passwordConfirm.value
  })

  async function handleSignUp() {
    if (isPasswordMismatch.value) {
      errorMessage.value = '비밀번호가 일치하지 않습니다.'
      return
    }
    if (!password.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
      errorMessage.value = '비밀번호는 8자 이상이며, 대/소문자, 숫자, 특수문자를 포함해야 합니다.'
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    try {
      const success = await authStore.signup({
        email: email.value,
        password: password.value,
        nickname: nickname.value
      })
      if (success) {
        alert('회원가입에 성공했습니다! 로그인 페이지로 이동합니다.');
        router.push('/')
      }
    } finally {
      isLoading.value = false
    }
  }

  function handleNavigation(page: 'main' | 'search' | 'trips' | 'log') {
    switch (page) {
      case 'main':
        router.push({ name: 'home' })
        break
      case 'search':
        router.push({ name: 'search' })
        break
      case 'trips':
        router.push({ name: 'trips' })
        break
      case 'log':
        router.push({ name: 'log' })
        break
    }
  }

  function goToLogin() {
    router.push('/login')
  }

  function goToFindAccount() {
    router.push('/find-account')
  }
  </script>
