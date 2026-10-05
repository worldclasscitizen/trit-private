import type { Place } from '@/types/trip/place.model'
import { ref } from 'vue'
import { spotApi } from '@/apis/spot'

export function usePlaceSearch() {
  const searchQuery = ref('')
  const searchResults = ref<Place[]>([])
  const isSearching = ref(false)
  const isSearchPanelOpen = ref(false)

  // mapInstance: KakaoMap 컴포넌트에서 가져온 지도 객체
  const searchPlaces = (mapInstance?: any) => {
    if (!searchQuery.value.trim()) return

    if (!(window as any).kakao || !(window as any).kakao.maps) {
      alert('카카오맵 SDK가 로드되지 않았습니다.')
      return
    }

    isSearchPanelOpen.value = true
    isSearching.value = true
    searchResults.value = [];

    (window as any).kakao.maps.load(() => {
      if (!(window as any).kakao.maps.services) {
        alert('카카오맵 Services 라이브러리가 로드되지 않았습니다.')
        isSearching.value = false
        return
      }

      const ps = new (window as any).kakao.maps.services.Places()

      // 내부 검색 함수 (재귀적 호출 또는 fallback 처리용)
      const executeSearch = (options: any, isFallbackAttempt: boolean) => {
        ps.keywordSearch(
          searchQuery.value,
          (data: any[], status: any) => {
            if (status === (window as any).kakao.maps.services.Status.OK) {
              console.log('Kakao Search Results:', data)

              // 1. Immediate UI Update
              // 우선 카카오 데이터로 화면을 그린다 (ID는 카카오 ID 임시 사용)
              searchResults.value = data.map((item: any) => ({
                id: Number(item.id), // 임시 ID (Kakao ID가 숫자가 아닐수도 있지만, Place Model이 number라 임시 변환)
                kakaoPlaceId: item.id,
                name: item.place_name,
                address: item.road_address_name || item.address_name,
                category: item.category_group_name || '기타',
                lat: Number(item.y),
                lng: Number(item.x),
                phone: item.phone,
                placeUrl: item.place_url,
                thumbnailUrl: undefined // 초기엔 없음
              }))

              isSearching.value = false // 로딩 해제 (카드는 떴음)

              // 2. Background Sync
              // 각 아이템별로 독립적으로 백엔드 싱크 & 썸네일 생성 수행
              data.forEach(async (item: any, index: number) => {
                try {
                  const spotRequest = {
                    kakaoPlaceId: item.id,
                    name: item.place_name,
                    address: item.road_address_name || item.address_name,
                    category: item.category_group_name || '기타',
                    lat: Number(item.y),
                    lng: Number(item.x),
                    placeUrl: item.place_url,
                    thumbnailUrl: ''
                  }

                  // A. Upsert Spot
                  let spot = await spotApi.createSpot(spotRequest)

                  // 업데이트: ID 교체 및 기존 썸네일 확인
                  if (searchResults.value[index]) {
                    searchResults.value[index] = {
                      ...searchResults.value[index],
                      id: spot.id, // 진짜 DB ID로 교체
                      thumbnailUrl: spot.thumbnailUrl
                    }
                  }

                  // B. 썸네일 없으면 생성 요청
                  if (!spot.thumbnailUrl) {
                    try {
                      const updatedSpot = await spotApi.generateSpotThumbnail(spot.id)
                      // 생성 완료 후 다시 업데이트
                      if (searchResults.value[index]) {
                        searchResults.value[index] = {
                          ...searchResults.value[index],
                          thumbnailUrl: updatedSpot.thumbnailUrl
                        }
                      }
                    } catch (err) {
                      console.warn(`Thumbnail generation failed for spot ${spot.id}`, err)
                    }
                  }

                } catch (err) {
                  console.error('Background sync failed for item', index, err)
                }
              })
            }
            // 2. 결과 없음 (ZERO_RESULT)
            else if (status === (window as any).kakao.maps.services.Status.ZERO_RESULT) {
              if (options.bounds && !isFallbackAttempt) {
                console.log('No results in current bounds. Retrying globally...')
                executeSearch({}, true)
              } else {
                isSearching.value = false
                searchResults.value = []
              }
            }
            // 3. 에러
            else {
              isSearching.value = false
              alert('검색 중 오류가 발생했습니다.')
            }
          },
          options,
        )
      }

      // 초기 검색 옵션 설정
      let initialOptions: any = {}
      if (mapInstance) {
        const bounds = mapInstance.getBounds()
        initialOptions = { bounds }
      }

      // 첫 검색 실행 (Local First)
      executeSearch(initialOptions, false)
    })
  }

  const closeSearchPanel = () => {
    isSearchPanelOpen.value = false
    searchQuery.value = ''
    searchResults.value = []
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    isSearchPanelOpen,
    searchPlaces,
    closeSearchPanel,
  }
}
