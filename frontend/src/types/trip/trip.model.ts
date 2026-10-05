import type { Place } from '@/types/trip/place.model'
import type { TripLogCommentResponse } from '@/apis/trip-log/types'
import type { TripResponseDto, TripDiaryResponseDto } from '@/apis/trip/types'


/**
 * 여행 가시성 상태
 */
export type TripVisibility = 'PUBLIC' | 'PRIVATE'

/**
 * 여행 계획 패널에서 사용하는 아이템 모델 (UI/Composable에서 사용)
 */
export interface TripPlanItem {
  id: number // tripItemId (서버와 매핑됨)
  day: number
  order: number
  place: Place
  memo?: string
}

/**
 * TripLog 관련
 */

export interface TripLogImage {
  imageRefKey: string
  imageUrl: string
  orderIndex: number
}


export interface TripLogDetail {
  logId: number
  title: string
  content: string
  locationSummary: string
  likeCount: number
  commentCount: number
  createdAt: string
  authorNickname: string
  authorImageUrl: string
  tripId: number
  tripTitle: string
  images: TripLogImage[]
  comments: TripLogCommentResponse[]
  visibility: TripVisibility
  authorId: number
}

export interface TripDiaryView {
  id: number
  title: string
  thumbnailUrl?: string
  visibility: TripVisibility
  spotPreviews: { name: string }[]
  tags: string[]
  startDate: string | null
  endDate: string | null
  likes: number
  comments: number
}

export interface TripPlanView extends TripResponseDto {
  likes: number
  comments: number
}