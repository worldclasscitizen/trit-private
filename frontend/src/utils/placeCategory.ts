// src/utils/placeCategory.ts
import {
  MapPin,
  Coffee,
  Utensils,
  ShoppingBag,
  Bed,
  Camera,
  Landmark,
  Train,
} from 'lucide-vue-next'

/**
 * 카테고리 문자열을 분석하여 알맞은 Lucide 아이콘 컴포넌트를 반환합니다.
 * @param category API에서 받은 카테고리 문자열 (예: "음식점 > 카페")
 */
export function getCategoryIcon(category: string) {
  const cat = category || ''

  // 카카오맵 카테고리 기준 매핑
  if (cat.includes('카페')) return Coffee
  if (cat.includes('음식점')) return Utensils
  if (cat.includes('쇼핑') || cat.includes('마트') || cat.includes('백화점')) return ShoppingBag
  if (cat.includes('숙박') || cat.includes('호텔') || cat.includes('펜션')) return Bed
  if (cat.includes('관광') || cat.includes('명소')) return Camera
  if (cat.includes('문화') || cat.includes('예술')) return Landmark
  if (cat.includes('교통') || cat.includes('역') || cat.includes('터미널')) return Train

  // 기본 아이콘
  return MapPin
}

/**
 * 카테고리에 따른 배경색을 반환합니다. (선택 사항)
 */
export function getCategoryColor(category: string) {
  const cat = category || ''

  if (cat.includes('카페')) return 'bg-[#F9CA6B]' // 노랑
  if (cat.includes('음식점')) return 'bg-[#FF9B9B]' // 빨강 (살짝 연한)
  if (cat.includes('숙박')) return 'bg-[#9BCCC4]' // 민트
  if (cat.includes('쇼핑')) return 'bg-[#B4A7D6]' // 보라

  return 'bg-gray-200' // 기본 회색
}
