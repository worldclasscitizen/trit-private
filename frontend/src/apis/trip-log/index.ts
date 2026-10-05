import apiClient from '@/apis/http'
import type {
  TripLogCommentRequest,
  TripLogCommentResponse,
  TripLogLikeResponse,
  TripLogFeedResponseDto,
  TripLogCreateRequestDto,
  UploadImageResponse,
  TripLogPatchRequestDto,
} from '@/apis/trip-log/types'

import type { TripLogDetail } from '@/types/trip/trip.model'

/**
 * 여행 기록(로그) 상세 정보를 조회합니다.
 * @param logId 조회할 여행 기록의 ID
 * @returns 여행 기록 상세 정보 (TripLogDetail)
 */
export const getTripLogDetail = async (logId: number): Promise<TripLogDetail> => {
  const response = await apiClient.get<TripLogDetail>(`/trip-logs/${logId}`)
  return response.data
}

/**
 * 여행 기록(로그)에 댓글을 작성합니다.
 * @param logId 댓글을 작성할 여행 기록의 ID
 * @param commentData 댓글 내용
 * @returns 생성된 댓글 정보
 */
export const postTripLogComment = async (
  logId: number,
  commentData: TripLogCommentRequest,
): Promise<TripLogCommentResponse> => {
  const response = await apiClient.post<TripLogCommentResponse>(
    `/trip-logs/${logId}/comments`,
    commentData,
  )
  return response.data
}

/**
 * 여행 기록(로그)의 댓글을 수정합니다.
 * @param commentId 수정할 댓글 ID
 * @param commentData 수정할 댓글 내용
 * @returns 수정된 댓글 정보
 */
export const updateTripLogComment = async (
  commentId: number,
  commentData: TripLogCommentRequest,
): Promise<TripLogCommentResponse> => {
  const response = await apiClient.patch<TripLogCommentResponse>(
    `/trip-logs/comments/${commentId}`,
    commentData,
  )
  return response.data
}

/**
 * 여행 기록(로그)의 댓글을 삭제합니다.
 * @param commentId 삭제할 댓글 ID
 */
export const deleteTripLogComment = async (
  commentId: number,
): Promise<void> => {
  await apiClient.delete(`/trip-logs/comments/${commentId}`)
}

/**
 * 특정 여행 기록에 좋아요를 추가합니다.
 * @param logId 좋아요를 누를 여행 기록의 ID
 * @returns 업데이트된 좋아요 수 및 좋아요 상태 (TripLogLikeResponse)
 */
export const likeTripLog = async (logId: number): Promise<TripLogLikeResponse> => {
  const response = await apiClient.post<TripLogLikeResponse>(`/trip-logs/${logId}/likes`)
  return response.data
}

/**
 * 특정 여행 기록의 좋아요를 취소합니다.
 * @param logId 좋아요를 취소할 여행 기록의 ID
 * @returns 업데이트된 좋아요 수 및 좋아요 상태 (TripLogLikeResponse)
 */
export const unlikeTripLog = async (logId: number): Promise<TripLogLikeResponse> => {
  const response = await apiClient.delete<TripLogLikeResponse>(`/trip-logs/${logId}/likes`)
  return response.data
}

/**
 * 현재 사용자가 특정 여행 기록에 좋아요를 눌렀는지 여부와 총 좋아요 수를 조회합니다.
 * @param logId 좋아요 상태를 조회할 여행 기록의 ID
 * @returns 좋아요 상태 정보 (TripLogLikeResponse)
 */
export const getTripLogLikeStatus = async (logId: number): Promise<TripLogLikeResponse> => {
  const response = await apiClient.get<TripLogLikeResponse>(`/trip-logs/${logId}/likes/status`)
  return response.data
}


interface GetTripLogFeedParams {
  cursor?: number | null; // optional, 첫 요청 시 null
  limit?: number;
}

/**
 * 여행 로그 피드를 조회하는 API 함수 (무한 스크롤)
 * @param params.cursor 다음 페이지를 위한 커서 값
 * @param params.limit 페이지 당 항목 수 (기본 10)
 * @returns {Promise<GetTripLogFeedResponseDto>}
 */
export async function getTripLogFeed(
  params: GetTripLogFeedParams,
): Promise<TripLogFeedResponseDto> {
  // cursor가 null이면 쿼리 파라미터에서 제외 (첫 페이지 요청)
  const cursorParam = params.cursor !== null && params.cursor !== undefined
    ? { cursor: params.cursor }
    : {};

  const response = await apiClient.get<TripLogFeedResponseDto>('/trip-logs/feed', {
    params: {
      ...cursorParam,
      limit: params.limit ?? 10,
    },
  });

  return response.data;
}

/**
 * 친구들의 여행 로그 피드를 조회하는 API 함수 (최근 3일)
 * @returns {Promise<TripLogFeedResponseDto>}
 */
export async function getFriendTripLogFeed(): Promise<TripLogFeedResponseDto> {
  const response = await apiClient.get<TripLogFeedResponseDto>('/trip-logs/feed/friends');
  return response.data;
}

/**
 * 특정 장소(spotId)와 관련된 여행 로그 목록을 조회합니다.
 * @param spotId 장소 ID
 * @param params 페이징 파라미터 (cursor, limit)
 * @returns 여행 로그 목록 (TripLogFeedResponseDto)
 */
export const getTripLogsBySpot = async (
  spotId: number,
  params: { cursor?: number | null; limit?: number }
): Promise<TripLogFeedResponseDto> => {
  const cursorParam = params.cursor ? { cursor: params.cursor } : {}
  const response = await apiClient.get<TripLogFeedResponseDto>('/trip-logs', {
    params: {
      spotId,
      ...cursorParam,
      limit: params.limit ?? 10
    }
  })
  return response.data
}

/**
 * 특정 유저(userId)의 여행 로그 목록을 조회합니다.
 * @param userId 유저 ID
 * @param params 페이징 파라미터 (page, limit)
 * @returns 여행 로그 목록 (PageTripLogFeedResponseDto)
 */
export const getTripLogsByUser = async (
  userId: number,
  params: { page?: number; limit?: number }
): Promise<any> => {
  const response = await apiClient.get('/trip-logs', {
    params: {
      userId,
      page: params.page ?? 1,
      limit: params.limit ?? 10
    }
  })
  return response.data
}

/**
 * 여행 로그 생성 API 함수
 * @param payload 여행 로그 생성 요청 데이터
 * @returns 생성된 로그 ID
 * 여행 로그 생성 API 함수
 * @param payload 여행 로그 생성 요청 데이터
 * @returns 생성된 로그 ID
 */
export const postTripLogCreate = async (
  payload: TripLogCreateRequestDto,
): Promise<{ logId: number }> => {
  const response = await apiClient.post<{ logId: number }>(
    '/trip-logs',
    payload,
  )

  return response.data
}

/**
 * 여행 로그 이미지 처리 API 함수
 * @returns 영구 이미지 url
 */

export async function getPresignedUrl(
  file: File
): Promise<UploadImageResponse> {
  const response = await apiClient.post<UploadImageResponse>(
    '/trip-logs/images/presigned-url',
    {
      fileName: file.name,
    }
  )
  return response.data
}

/**
 * 여행 로그 삭제 API 함수
 * @param logId 삭제할 여행 로그의 ID
 * @returns 성공 시 void (HTTP 204)
 */
export const deleteTripLog = async (logId: number): Promise<void> => {
  await apiClient.delete(`/trip-logs/${logId}`)
}

/**
 * 여행 로그 수정 API 함수
 * @param logId 수정할 여행 로그의 ID
 * @param payload 수정할 로그 데이터 (title, content, visibility)
 * @returns 성공 시 void (HTTP 200)
 */
export const patchTripLog = async (params: TripLogPatchRequestDto): Promise<void> => {
  const { logId, payload } = params
  await apiClient.patch(`/trip-logs/${logId}`, payload)
}
