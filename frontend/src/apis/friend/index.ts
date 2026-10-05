import apiClient from '@/apis/http';
import type {
  FriendRequestRequestDto,
  FriendRequestResponseDto,
  SimpleUserInfoDto
} from '@/apis/friend/types';

/**
 * 친구 요청 보내기
 */
export const requestSendFriendRequest = async (receiverId: number): Promise<void> => {
  await apiClient.post('/friends/requests', { receiverId } as FriendRequestRequestDto);
};

/**
 * 받은 친구 요청 조회
 */
export const fetchReceivedRequests = async (): Promise<FriendRequestResponseDto[]> => {
  const response = await apiClient.get<FriendRequestResponseDto[]>('/friends/requests/received');
  return response.data;
};

/**
 * 보낸 친구 요청 조회
 */
export const fetchSentRequests = async (): Promise<FriendRequestResponseDto[]> => {
  const response = await apiClient.get<FriendRequestResponseDto[]>('/friends/requests/sent');
  return response.data;
};

/**
 * 친구 요청 수락
 */
export const requestAcceptFriendRequest = async (requestId: number): Promise<void> => {
  await apiClient.post(`/friends/requests/${requestId}/accept`);
};

/**
 * 친구 요청 거절
 */
export const requestDeclineFriendRequest = async (requestId: number): Promise<void> => {
  await apiClient.post(`/friends/requests/${requestId}/decline`);
};

/**
 * 보낸 친구 요청 취소
 */
export const requestCancelSentRequest = async (requestId: number): Promise<void> => {
  await apiClient.delete(`/friends/requests/sent/${requestId}`);
};

/**
 * 친구 목록 조회
 */
export const fetchMyFriendList = async (): Promise<SimpleUserInfoDto[]> => {
  const response = await apiClient.get<SimpleUserInfoDto[]>('/friends');
  return response.data;
};

/**
 * 친구 삭제
 */
export const requestDeleteFriend = async (friendId: number): Promise<void> => {
  await apiClient.delete(`/friends/${friendId}`);
};
