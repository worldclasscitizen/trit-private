// src/apis/auth/index.ts
import apiClient, { refreshClient } from '@/apis/http';
import type { LoginRequestDto, SignupRequestDto, TokenResponseDto } from './types'; 

/**
 * 로그인 API 요청: 토큰 및 만료 시간을 반환
 */
export const requestLogin = async (loginRequest: LoginRequestDto): Promise<TokenResponseDto> => {
    const response = await apiClient.post<TokenResponseDto>('/auth/login', loginRequest);
    return response.data;
};

/**
 * 로그아웃 API 요청
 */
export const requestLogout = async (): Promise<void> => {
    // 인터셉터에서 '/auth/logout' 요청은 토큰 갱신을 건너뜁니다.
    await apiClient.post('/auth/logout');
};

/**
 * 토큰 갱신 API 요청
 */
export const requestRefreshAccessToken = async (): Promise<TokenResponseDto> => {
    const { data } = await refreshClient.post('/auth/refresh')
    return data
};

/**
 * 회원가입 API 요청
 */
export const requestSignup = async (signupRequest: SignupRequestDto): Promise<void> => {
    await apiClient.post('/auth/signup', signupRequest);
};

/**
 * 닉네임으로 이메일 찾기 API 요청
 */
export const requestFindEmailByNickname = async (nickname: string): Promise<{ email: string }> => {
    const response = await apiClient.get<{ email: string }>(`/auth/find-email/${nickname}`);
    return response.data;
};

/**
 * 비밀번호 재설정 API 요청
 */
export const requestResetPassword = async (email: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { email });
};