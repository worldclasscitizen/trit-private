// 여행 관련 API 통신용 DTO

import { TripStatus } from '@/types/common';
import type { TripVisibility } from '@/types/trip/trip.model'

// 장소 정보를 나타내는 인터페이스 (API 응답용) - SpotResponseDto에 해당
export interface SpotResponseDto {
  id: number
  kakaoPlaceId: string
  name: string
  address?: string // nullable
  category?: string // nullable
  lat: number
  lng: number
  placeUrl?: string // nullable
  thumbnailUrl?: string // nullable
}

// 장소 정보를 나타내는 인터페이스 (API 요청용) - SpotRequestDto에 해당
export interface SpotRequestDto {
  kakaoPlaceId: string
  name: string
  address?: string // nullable
  category?: string // nullable
  lat: number
  lng: number
  placeUrl?: string // nullable
  thumbnailUrl?: string // nullable
}

// 여행 아이템 응답 DTO 인터페이스
export interface TripItemResponseDto {
  id: number
  dayNumber: number
  orderIndex: number
  memo?: string // nullable
  spot: SpotResponseDto
}

// 여행 상세 응답 DTO 인터페이스 (GET /trips/{id})
export interface TripDetailResponseDto {
  id: number
  title: string
  startDate?: string // nullable
  endDate?: string // nullable
  status: TripStatus
  visibility: TripVisibility
  isOwner: boolean
  locationSummary?: string // nullable
  tripItems: TripItemResponseDto[]
  logId: number
}


// 여행 목록 응답 DTO 인터페이스 (TripCard에서 필요한 필드 포함)
export interface TripResponseDto {
  id: number
  title: string
  startDate?: string // nullable
  endDate?: string // nullable
  status: TripStatus
  visibility?: TripVisibility
  isOwner: boolean
  locationSummary?: string // nullable
  spots: number // 추가됨
  tags?: string[] // 추가됨, nullable
  spotPreviews: { name: string }[] // 추가됨
  completedDate?: string // 추가됨, nullable
  likes?: number
  comments?: number
}

// 여행 정보 수정 요청 DTO
export interface TripUpdateRequestDto {
  title?: string
  startDate?: string // nullable
  endDate?: string // nullable
  status?: TripStatus
  visibility?: TripVisibility
}

// 여행 아이템 목록 전체 교체 요청 DTO (TripItemsReplaceRequestDto)
export interface TripItemsReplaceRequestDto {
  days: TripItemsReplaceRequestDto_Day[]
}

export interface TripItemsReplaceRequestDto_Day {
  dayNumber: number
  items: TripItemsReplaceRequestDto_Item[]
}

export interface TripItemsReplaceRequestDto_Item {
  spotId?: number // 기존에 등록된 여행지 ID
  spot?: SpotRequestDto // 새로운 여행지
  // memo: string  <-- 제거됨 (OpenAPI Spec에 없음)
}
//==========================================================================

/**
 * TripPlan 관련 타입
 */
// TODO: 해당 타입이 사용된 코드를 보고 유츄한 코드이기 때문에 수정 필요
export interface TripPlanResponseDto {
  id: number; // 키 값
  title: string; // 카드 제목
  thumbnailUrl?: string; // 카드 썸네일
  startDate: string; // 카드 날짜
  endDate: string; // 카드 날짜
  visibility: 'PUBLIC' | 'PRIVATE' | 'PROTECTED'; // 필터링에 사용됨
}


/**
 * Diary 관련 타입
 */

export interface TripDiaryResponseDto {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  spotPreviews?: { name: string }[] | null;
  tags: string[];
  startDate: string | null;
  endDate: string | null;
  likes: number;
  comments: number;
  content?: string;
  createdAt?: string;
}

export interface LogDiaryDto extends TripDiaryResponseDto {
  tripId: number
}

/**
 * Scrap 관련 타입
 */
export interface TripScrapResponseDto {
  tripId: number
}
