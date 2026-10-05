export interface SimpleUserInfoDto {
  userId: number
  nickname: string
  profileImageUrl: string
}

export interface FriendRequestResponseDto {
  requestId: number
  user: SimpleUserInfoDto
  createdAt: string
}

export interface FriendRequestRequestDto {
  receiverId: number
}
