import http from '@/apis/http'

export interface SpotReviewResponseDto {
    id: number
    content: string
    rating: number
    createdAt: string
    userNickname: string
    userProfileImage: string
}

export interface SpotReviewStatsResponseDto {
    averageRating: number
    reviewCount: number
}

export interface SpotReviewRequestDto {
    spotId: number
    rating: number
    content: string
}

export interface SpotReviewListResponseDto {
    myReview: SpotReviewResponseDto | null
    reviews: SpotReviewResponseDto[]
}

export interface SpotReviewUpdateRequestDto {
    rating?: number
    content?: string
}

export const spotReviewApi = {
    getSpotReviews: async (spotId: number): Promise<SpotReviewListResponseDto> => {
        const response = await http.get<SpotReviewListResponseDto>(`/spot-reviews`, {
            params: { spotId },
        })
        return response.data
    },

    getSpotReviewStats: async (spotId: number): Promise<SpotReviewStatsResponseDto> => {
        const response = await http.get<SpotReviewStatsResponseDto>(`/spot-reviews/stats`, {
            params: { spotId },
        })
        return response.data
    },

    postSpotReview: async (data: SpotReviewRequestDto): Promise<void> => {
        await http.post(`/spot-reviews`, data)
    },

    updateSpotReview: async (reviewId: number, data: SpotReviewUpdateRequestDto): Promise<void> => {
        await http.patch(`/spot-reviews/${reviewId}`, data)
    },

    deleteSpotReview: async (reviewId: number): Promise<void> => {
        await http.delete(`/spot-reviews/${reviewId}`)
    },
}
