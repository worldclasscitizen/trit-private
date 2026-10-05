import type {
    TripItemResponseDto,
} from '@/apis/trip/types'
import type { TripStatus } from '@/types/common'
import type { TripVisibility } from '@/types/trip/trip.model'

export interface UserSearchResponseDto {
    id: number
    nickname: string
    profileImageUrl: string | null
}

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

export interface BaseUserProfileDto {
    id: number
    nickname: string
    profileImageUrl: string | null
    bio: string | null
    intro: string | null
    homeRegionId: number | null
    travelStyleSummary: string | null
    travelStyleId: number | null
    profileBannerUrl: string | null
    isProfilePublic: boolean
    friendsCount: number

    tripOverviews: UserTripOverviewDto[]
    completedTripDetails: UserCompletedTripDetailDto[]
    logs: UserLogSummaryDto[]
}
export interface UserTripOverviewDto {
    id: number
    title: string
    startDate: string
    endDate: string
    status: TripStatus
    visibility: TripVisibility
    locationSummary: string
    isOwner: boolean
    spots: number
    tags: string[]
    spotPreviews: { name: string }[]
    completedDate?: string
}

export interface UserCompletedTripDetailDto {
    id: number
    title: string
    startDate: string
    endDate: string
    status: TripStatus
    visibility: TripVisibility
    locationSummary: string
    tripItems: TripItemResponseDto[]
}

export interface UserLogSummaryDto {
    tripId: number
    logId: number
    title: string
    thumbnailUrl: string | null
    content?: string
    createdAt?: string // 로그 작성일
    likes?: number
    comments?: number
}

export type UserProfileResponseDto = BaseUserProfileDto

export type UserFriendsResponseDto = BaseUserProfileDto[]

export interface UserMeResponseDto
    extends BaseUserProfileDto {
    email: string
}

export interface UserAIAnalysisResponseDto {
    keywords: string[]
    summary: string
    scores: {
        rest: number
        exploration: number
        activity: number
        gourmet: number
    }
}

