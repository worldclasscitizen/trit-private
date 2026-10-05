/**
 * 장소 엔티티 모델 (클라이언트 비즈니스 로직에서 사용)
 */
export interface Place {
    id?: number // 동기화 전에는 id가 없을 수 있음 (tripItemId)
    kakaoPlaceId: string // 장소의 고유 카카오 ID
    name: string
    address: string
    category: string
    lat: number
    lng: number
    phone?: string
    placeUrl?: string
    memo?: string // 아이템 메모
    url?: string
    thumbnailUrl?: string // 썸네일 이미지 URL
}

/**
 * 일별 계획 모델 (클라이언트 비즈니스 로직에서 사용)
 */
export interface DayPlan {
    dayNumber: number
    places: Place[]
}


