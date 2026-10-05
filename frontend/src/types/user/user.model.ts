import type {
  UserCompletedTripDetailDto,
} from '@/apis/user/types'
import type { TripDiaryResponseDto } from '@/apis/trip/types'
import type { TripPlanView } from '@/types/trip/trip.model'

export interface User {
    id: number;
    email?: string;
    nickname: string;
    profileImageUrl: string | null;
    bio?: string;
    friendsCount: number;
}

export interface LogViewProfile {
  // ===== 기본 사용자 정보 =====
  id: number
  nickname: string
  profileImageUrl: string | null
  bio: string | null
  intro: string | null
  friendsCount: number
  isMyProfile: boolean
  email?: string
  travelStyleSummary: string | null

  // ===== View에서 쓰는 이름으로 변환 =====
  completedTrips: UserCompletedTripDetailDto[]
  userPlans: TripPlanView[]
  diaries: TripDiaryResponseDto[]
}
