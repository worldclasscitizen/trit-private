import apiClient from '@/apis/http'
import type {
  TripDetailResponseDto,
  TripItemResponseDto,
  TripItemsReplaceRequestDto,
  TripUpdateRequestDto,
  TripResponseDto,
  TripSummaryResponseDto,
  TripScrapResponseDto
} from '@/apis/trip/types'

import { TripStatus } from '@/types/common';

// API 호출 함수
/**
 * 새로운 빈 여행 계획을 생성합니다.
 * '여행 계획 시작' 시점에 호출됩니다.
 * @returns 생성된 여행의 상세 정보 (TripDetailResponseDto)
 */
export const createTrip = async (): Promise<TripDetailResponseDto> => {
  const response = await apiClient.post<TripDetailResponseDto>('/trips')
  return response.data
}

/**
 * 특정 여행 계획의 상세 정보를 조회합니다.
 * @param tripId 조회할 여행 계획의 ID
 * @returns 여행 계획의 상세 정보 (TripDetailResponseDto)
 */
export const getTripDetail = async (tripId: number): Promise<TripDetailResponseDto> => {
  const response = await apiClient.get<TripDetailResponseDto>(`/trips/${tripId}`)
  return response.data
}

/**
 * 특정 여행 계획을 삭제합니다.
 * @param tripId 삭제할 여행 계획의 ID
 */
export const deleteTrip = async (tripId: number): Promise<void> => {
  await apiClient.delete(`/trips/${tripId}`)
}

/**
 * 여행 아이템 목록 전체를 동기화합니다.
 * @param tripId 동기화할 여행의 ID
 * @param syncData 날짜별 아이템 목록
 * @returns 변경이 완료된 전체 아이템 목록
 */
export const syncTripItems = async (
  tripId: number,
  syncData: TripItemsReplaceRequestDto, // Changed type
): Promise<TripItemResponseDto[]> => {
  const response = await apiClient.put<TripItemResponseDto[]>(`/trips/${tripId}/items`, syncData)
  return response.data
}

/**
 * 여행의 기본 정보(제목, 날짜, 상태, 공개 여부)를 수정합니다.
 * @param tripId 수정할 여행의 ID
 * @param updateData 수정할 여행 정보
 * @returns 수정된 여행의 상세 정보 (TripDetailResponseDto)
 */
export const updateTrip = async (
  tripId: number,
  updateData: TripUpdateRequestDto,
): Promise<TripDetailResponseDto> => {
  const response = await apiClient.patch<TripDetailResponseDto>(`/trips/${tripId}`, updateData)
  return response.data
}

/**
 * 내 여행 목록을 조회합니다.
 * @param status 여행 상태별 필터링 (DRAFT, PLANNED, COMPLETED)
 * @returns 내 여행 목록 (TripResponseDto 배열)
 */
export const getMyTrips = async (status?: TripStatus): Promise<TripResponseDto[]> => {
  const response = await apiClient.get<TripResponseDto[]>('/trips', {
    params: { status },
  })
  return response.data
}



/**
 * 여행일지 스크랩을 요청합니다.
 */
export const requestScrapTrip = async (tripId: number): Promise<TripScrapResponseDto> => {
  const response = await apiClient.post<TripScrapResponseDto>(`/trips/${tripId}/scrap`);
  return response.data
}

