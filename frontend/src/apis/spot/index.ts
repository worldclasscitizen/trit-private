import http from '@/apis/http'
import { type SpotResponseDto } from '@/apis/search'

export interface SpotRequestDto {
    kakaoPlaceId: string
    name: string
    address: string
    category: string
    lat: number
    lng: number
    placeUrl: string
    thumbnailUrl: string
}

export const spotApi = {
    getSpotByKakaoPlaceId: async (kakaoPlaceId: string): Promise<SpotResponseDto | null> => {
        try {
            const response = await http.get<SpotResponseDto>(`/spots`, {
                params: { kakaoPlaceId }
            })
            return response.data
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                return null
            }
            throw error
        }
    },

    // Upsert: KakaoPlaceId로 조회하여 없으면 생성, 있으면 반환
    createSpot: async (data: SpotRequestDto): Promise<SpotResponseDto> => {
        // 백엔드에서 200(Found) or 201(Created) 반환
        const response = await http.post<SpotResponseDto>('/spots', data)
        return response.data
    },

    getHotPlaces: async (): Promise<SpotResponseDto[]> => {
        const response = await http.get<SpotResponseDto[]>('/spots/hot')
        return response.data
    },

    getSpotById: async (spotId: number): Promise<SpotResponseDto> => {
        const response = await http.get<SpotResponseDto>(`/spots/${spotId}`)
        return response.data
    },

    generateSpotThumbnail: async (spotId: number): Promise<SpotResponseDto> => {
        const response = await http.post<SpotResponseDto>(`/spots/${spotId}/thumbnail`)
        return response.data
    }
}
