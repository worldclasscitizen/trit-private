import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import apiClient from '@/apis/http'
import type { LoginRequestDto, SignupRequestDto, UserMeResponseDto } from '@/apis/user/types'

import {
  requestFetchUser,
  requestUpdateUserProfile,
  requestUploadProfileImage,
  requestDeleteProfileImage
} from '@/apis/user'

import {
  requestLogin,
  requestLogout,
  requestRefreshAccessToken,
  requestSignup,
  requestFindEmailByNickname,
  requestResetPassword
} from '@/apis/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserMeResponseDto | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const accessToken = ref<string | null>(null)
  const accessTokenExpiresAt = ref<number | null>(null)

  const isInitialized = ref(false)

  const isLoggedIn = computed(() => {
    if (!isInitialized.value) return false
    return !!accessToken.value && !!user.value
  })

  function setAuthorizationHeader(token: string | null) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete apiClient.defaults.headers.common['Authorization']
    }
  }

  function setAuthenticated(token: string, expiresInMs: number, userData: UserMeResponseDto) {
    accessToken.value = token
    user.value = userData
    accessTokenExpiresAt.value = Date.now() + expiresInMs;

    localStorage.setItem('user', JSON.stringify(userData))
    setAuthorizationHeader(token)
  }

  function clearAuthentication() {
    accessToken.value = null
    user.value = null
    accessTokenExpiresAt.value = null;

    localStorage.removeItem('user')
    setAuthorizationHeader(null)
  }

  async function fetchUser(): Promise<UserMeResponseDto | null> {
    try {
      return await requestFetchUser();
    } catch(error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  }

  async function login(loginRequest: LoginRequestDto): Promise<boolean> {
    try {
      // 1. Login to get the access token
      const { accessToken: token, expiresIn } = await requestLogin(loginRequest)

      // 2. Set token immediately for subsequent requests
      setAuthorizationHeader(token);

      // 3. Fetch the complete user profile
      const fetchedUser = await fetchUser();

      if (fetchedUser) {
        // 4. Set the full authenticated state
        setAuthenticated(token, expiresIn, fetchedUser);
        return true;
      } else {
        throw new Error("Failed to fetch user profile after login.");
      }
    } catch (error) {
      console.error('Login process failed:', error)
      clearAuthentication()
      return false
    }
  }

  async function logout() {
    try {
      if (accessToken.value) {
        await requestLogout()
      }
    } catch (error) {
        console.error('An unexpected error occurred during logout:', error)
    } finally {
      clearAuthentication()
    }
  }

  async function signup(signupRequest: SignupRequestDto): Promise<boolean> {
    try {
      await requestSignup(signupRequest);
      return true;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data?.message || '회원가입 중 오류가 발생했습니다.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
      return false;
    }
  }

  async function findEmailByNickname(nickname: string): Promise<string> {
    try {
      const response = await requestFindEmailByNickname(nickname);
      return response.email;
    } catch (error: unknown) {
      console.error('이메일 찾기 실패:', error);
      let message = '이메일 찾기 중 알 수 없는 오류가 발생했습니다.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      await requestResetPassword(email);
    } catch (error: unknown) {
      console.error('비밀번호 재설정 요청 실패:', error);
      let message = '비밀번호 재설정 중 알 수 없는 오류가 발생했습니다.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  }

  async function updateUserProfile(data: { nickname?: string; bio?: string }): Promise<boolean> {
    try {
      await requestUpdateUserProfile(data);
      await fetchUserAndUpdateStore(); // Custom helper to just update the store
      return true;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다.');
      return false;
    }
  }

  async function fetchUserAndUpdateStore() {
      const updatedUser = await fetchUser();
      if(updatedUser) {
          user.value = updatedUser;
          localStorage.setItem('user', JSON.stringify(updatedUser));
      }
  }

  async function uploadProfileImage(imageFile: File): Promise<boolean> {
    if (!user.value) return false;
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      await requestUploadProfileImage(imageFile);
      await fetchUserAndUpdateStore();
      return true;
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      alert('프로필 이미지 업로드에 실패했습니다.');
      return false;
    }
  }

  async function deleteProfileImage(): Promise<boolean> {
    if (!user.value) return false;
    try {
      await requestDeleteProfileImage();
      await fetchUserAndUpdateStore();
      return true;
    } catch (error) {
      console.error('프로필 이미지 삭제 실패:', error);
      alert('프로필 이미지 삭제에 실패했습니다.');
      return false;
    }
  }

  async function refreshAccessToken() {
    try {
      const { accessToken: token, expiresIn } = await requestRefreshAccessToken()

      setAuthorizationHeader(token);

      const fetchedUser = await fetchUser();
      if (fetchedUser) {
        setAuthenticated(token, expiresIn, fetchedUser);
      } else {
        throw new Error('Failed to fetch user data during token refresh.');
      }
    } catch (error) {
      // 기존: console.error('Token refresh failed, logging out.', error);
      // 변경: 401 에러는 예상된 상황일 수 있으므로 로그를 Warning 정도로 낮춤
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.warn('Refresh Token missing or invalid, proceeding as unauthenticated.');
      } else {
        console.error('Token refresh failed with unexpected error, logging out.', error);
      }
      clearAuthentication();
      throw error // initializeAuth에서 catch하도록 에러는 던져줌
    }
  }

  // 자동 로그인 초기화 함수
  async function initializeAuth() {
    try {
      await refreshAccessToken()
    } catch {
      // refresh 실패 = 비로그인 상태
    } finally {
      isInitialized.value = true
    }
  }

  return {
    user,
    accessToken,
    accessTokenExpiresAt,
    isLoggedIn,
    isInitialized,
    login,
    logout,
    signup,
    findEmailByNickname,
    resetPassword,
    updateUserProfile,
    uploadProfileImage,
    deleteProfileImage,
    refreshAccessToken,
    initializeAuth
  }
})
