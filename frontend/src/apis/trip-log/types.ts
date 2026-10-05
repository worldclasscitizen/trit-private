import type { TripVisibility } from '@/types/trip/trip.model'
/**
 * Feed 관련 타입
 */

// 이미지 정보 DTO
export interface TripLogImageDto {
  imageRefKey: string;
  imageUrl: string;
  orderIndex: number;
}

// 피드 항목 DTO
export interface TripLogFeedItemDto {
  logId: number;
  authorId: number;
  authorNickname: string;
  authorImageUrl?: string;
  authorImageUrl?: string;
  title: string;
  content: string;
  locationSummary: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  images: TripLogImageDto[];
  createdAt: string; // ISO 8601 string
}

// 피드 조회 응답 DTO (Cursor 기반 Pagination)
export interface TripLogFeedResponseDto {
  content: TripLogFeedItemDto[];
  nextCursor: number | null; // 다음 페이지를 요청할 때 사용할 커서 값
  hasNext: boolean; // 다음 페이지가 있는지 여부
}

/**
 * TripLog 관련 타입
 */

export interface TripLogLikeResponse {
  likeCount: number;
  liked: boolean;
}

export interface TripLogCommentResponse {
  commentId: number
  authorNickname: string
  authorImageUrl: string
  authorId: number
  content: string
  createdAt: string
}

export interface TripLogCommentRequest {
  content: string
}

export interface TripLogCreateRequestDto {
  tripId: number;
  title: string;
  content: string;
  visibility: TripVisibility;
}

export interface UploadImageResponse {
  presignedUrl: string
}

export interface TripLogPatchRequestDto {
  logId: number,
  payload: {
    title: string
    content: string
    visibility: TripVisibility
  }
}
