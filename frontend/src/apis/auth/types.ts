// 로그인 요청 DTO
export interface LoginRequestDto {
    email: string;
    password: string;
}
  
// 회원가입 요청 DTO
export interface SignupRequestDto {
    email: string;
    password: string;
    nickname: string;
}

//임시 type 
export interface TokenResponseDto {
    accessToken: string;
    expiresIn: number;
    email: string;
    nickname: string;
}