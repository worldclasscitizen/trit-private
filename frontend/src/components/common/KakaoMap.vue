<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full"></div>

    <div
      v-if="!mapLoaded"
      class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2C2C2C] mx-auto mb-3"
        ></div>
        <p class="font-bold text-gray-600">지도를 불러오는 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, markRaw, toRaw } from 'vue'
import markerImg from '@/assets/marker.png'
import yellowMarkerImg from '@/assets/yellow-marker.png'

interface LatLng {
  lat: number
  lng: number
}

interface MarkerOption extends LatLng {
  id?: number | string
  kakaoPlaceId?: string
  type?: 'plan' | 'search'
  order?: number
  color?: string
}

interface PolylineOption {
  path: LatLng[]
  color?: string
}

const props = defineProps<{
  center?: LatLng
  level?: number
  markers?: MarkerOption[]
  polylines?: PolylineOption[]
  selectedMarkerId?: number | string | null
  showPlanLine?: boolean
}>()

const emits = defineEmits<{
  (e: 'marker-click', id: number | string): void
  (e: 'map-move'): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<any>(null)
const mapLoaded = ref(false)

let kakaoOverlays: any[] = []
let kakaoPolylines: any[] = []

const DEFAULT_MARKER_SRC = markerImg
const SELECTED_MARKER_SRC = yellowMarkerImg

const NORMAL_SIZE = { width: 40, height: 40 }
const BIG_SIZE = { width: 45, height: 45 }

const clearOverlays = () => {
  kakaoOverlays.forEach((m) => m.setMap(null))
  kakaoOverlays = []
}

const clearPolylines = () => {
  kakaoPolylines.forEach((p) => p.setMap(null))
  kakaoPolylines = []
}

const renderMarkers = (markers: MarkerOption[]) => {
  const rawMap = toRaw(map.value)
  if (!rawMap) return

  const kakao = (window as any).kakao
  clearOverlays()



  if (!markers || markers.length === 0) return

  const bounds = new kakao.maps.LatLngBounds()

  const normalImage = new kakao.maps.MarkerImage(
    DEFAULT_MARKER_SRC,
    new kakao.maps.Size(NORMAL_SIZE.width, NORMAL_SIZE.height),
  )
  const selectedImage = new kakao.maps.MarkerImage(
    SELECTED_MARKER_SRC,
    new kakao.maps.Size(BIG_SIZE.width, BIG_SIZE.height),
  )

  markers.forEach((m) => {
    const pos = new kakao.maps.LatLng(m.lat, m.lng)
    const isSelected = props.selectedMarkerId && String(m.id) === String(props.selectedMarkerId)

    if (m.type === 'plan') {
      const content = document.createElement('div')

      const hasOrder = m.order !== undefined && m.order !== null
      
      // 배경색 클래스 결정 (inline style이 없을 때만 적용됨)
      const defaultBgClass = isSelected ? 'bg-[#FF8A00]' : 'bg-[#9BCCC4]'
      
      content.className = `
        flex items-center justify-center
        ${hasOrder ? 'w-12 h-12 border-[2px] text-base' : 'w-5 h-5 border-[1px]'}
        rounded-full font-black text-black border-[#2C2C2C]
        transition-all duration-200 ease-in-out
        ${!m.color ? defaultBgClass : ''} 
        ${isSelected && !m.color ? 'scale-110' : ''}
      `
      
      // custom color가 있을 때만 인라인 스타일 적용 (인라인 스타일이 클래스보다 우선순위 높음)
      if (m.color) {
        content.style.backgroundColor = m.color
      }

      content.innerHTML = hasOrder ? String(m.order) : ''

      const customOverlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: content,
        map: rawMap,
        yAnchor: 0.5,
        zIndex: isSelected ? 999 : 100,
      })

      content.onclick = () => {
        if (m.id !== undefined && m.id !== null) {
          emits('marker-click', m.id)
        }
      }

      customOverlay.customId = m.id
      customOverlay.customType = m.type
      customOverlay.customOrder = m.order
      kakaoOverlays.push(customOverlay)
    } else {
      const marker = new kakao.maps.Marker({
        position: pos,
        map: rawMap,
        image: isSelected ? selectedImage : normalImage,
        zIndex: isSelected ? 999 : 1, // Search markers stay low
        clickable: true,
      })

      marker.customId = m.id
      marker.customType = m.type

      kakao.maps.event.addListener(marker, 'click', () => {
        if (m.id !== undefined && m.id !== null) {
          emits('marker-click', m.id)
        }
      })
      kakaoOverlays.push(marker)
    }
    bounds.extend(pos)
  })

  // Draw polyline for plan markers
  // Draw polyline for plan markers
  if (props.showPlanLine !== false) {
    renderPlanPolylineAsOverlay(markers)
  }

  if (!props.selectedMarkerId) {
    rawMap.setBounds(bounds)
  }
}

let kakaoPlanPolylineOverlay: any = null

const renderPlanPolylineAsOverlay = (markers: MarkerOption[]) => {
  const rawMap = toRaw(map.value)
  if (!rawMap) return
  const kakao = (window as any).kakao

  // Clear existing overlay
  if (kakaoPlanPolylineOverlay) {
    kakaoPlanPolylineOverlay.setMap(null)
    kakaoPlanPolylineOverlay = null
  }

  const linePath = markers
    .filter((m) => m.type === 'plan')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((m) => ({ lat: m.lat, lng: m.lng }))

  if (linePath.length < 2) return

  // SVG로 라인을 그릴 컨테이너 생성
  const svgNS = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(svgNS, "svg")

  // Use a large canvas approach to ensure visibility and avoid clipping issues
  // Centered on the anchor point.
  const CANVAS_SIZE = 4000
  const OFFSET = CANVAS_SIZE / 2

  svg.style.position = 'absolute'
  svg.style.pointerEvents = 'none'
  svg.style.width = `${CANVAS_SIZE}px`
  svg.style.height = `${CANVAS_SIZE}px`
  svg.style.overflow = 'visible'

  // Center the SVG on the anchor point (which will be at top-left 0,0 locally)
  // so we shift it back by OFFSET
  svg.style.transform = `translate(-${OFFSET}px, -${OFFSET}px)`

  // 지도 투영 변환을 사용하여 좌표 변환
  const projection = rawMap.getProjection()

  const startPos = projection.pointFromCoords(new kakao.maps.LatLng(linePath[0].lat, linePath[0].lng))

  linePath.forEach((point, i) => {
    if (i === 0) return

    const prevPoint = linePath[i - 1]
    const fromPos = projection.pointFromCoords(new kakao.maps.LatLng(prevPoint.lat, prevPoint.lng))
    const toPos = projection.pointFromCoords(new kakao.maps.LatLng(point.lat, point.lng))

    const line = document.createElementNS(svgNS, "line")

    // Coordinates relative to anchor, plus OFFSET to center in SVG
    const x1 = (fromPos.x - startPos.x) + OFFSET
    const y1 = (fromPos.y - startPos.y) + OFFSET
    const x2 = (toPos.x - startPos.x) + OFFSET
    const y2 = (toPos.y - startPos.y) + OFFSET

    line.setAttribute("x1", String(x1))
    line.setAttribute("y1", String(y1))
    line.setAttribute("x2", String(x2))
    line.setAttribute("y2", String(y2))
    line.setAttribute("stroke", "#000000")
    line.setAttribute("stroke-width", "3")
    line.setAttribute("stroke-opacity", "0.9")
    line.setAttribute("stroke-linecap", "round") // Smooth joints

    svg.appendChild(line)
  })

  // CustomOverlay로 추가
  kakaoPlanPolylineOverlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(linePath[0].lat, linePath[0].lng),
    content: svg,
    map: rawMap,
    zIndex: 50, // Between Search(10) and Plan(100)
    xAnchor: 0,
    yAnchor: 0
  })

  // kakaoOverlays.push(kakaoPlanPolylineOverlay) - Do not push to avoid array growth on zoom re-renders
}

const renderPolylines = (polylines: PolylineOption[]) => {
  const rawMap = toRaw(map.value)
  if (!rawMap) return
  const kakao = (window as any).kakao

  clearPolylines()

  if (!polylines || polylines.length === 0) return

  polylines.forEach(poly => {
    const linePath = poly.path.map(p => new kakao.maps.LatLng(p.lat, p.lng));
    if (linePath.length > 1) {
      const kakaoPolyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 4,
        strokeColor: poly.color,
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      });
      kakaoPolyline.setMap(rawMap);
      kakaoPolylines.push(kakaoPolyline);
    }
  });
}

const panTo = (lat: number, lng: number) => {
  const rawMap = toRaw(map.value)
  if (!rawMap) return
  const kakao = (window as any).kakao
  rawMap.panTo(new kakao.maps.LatLng(lat, lng))
}

watch(
  () => props.selectedMarkerId,
  (newId) => {
    const kakao = (window as any).kakao
    if (!kakao) return

    const normalImage = new kakao.maps.MarkerImage(
      DEFAULT_MARKER_SRC,
      new kakao.maps.Size(NORMAL_SIZE.width, NORMAL_SIZE.height),
    )
    const selectedImage = new kakao.maps.MarkerImage(
      SELECTED_MARKER_SRC,
      new kakao.maps.Size(BIG_SIZE.width, BIG_SIZE.height),
    )

    kakaoOverlays.forEach((overlay) => {
      const isTarget = String(overlay.customId) === String(newId)

      if (overlay.customType === 'plan') {
        const content = overlay.getContent()
        if (isTarget) {
          content.classList.remove('bg-[#9BCCC4]')
          content.classList.add('bg-[#FF8A00]', 'scale-110')
        } else {
          content.classList.remove('bg-[#FF8A00]', 'scale-110')
          content.classList.add('bg-[#9BCCC4]')
        }
        overlay.setZIndex(isTarget ? 999 : 100)
      } else {
        // This is a kakao.maps.Marker
        overlay.setImage(isTarget ? selectedImage : normalImage)
        overlay.setZIndex(isTarget ? 999 : 1)
      }
    })
  },
)

const initMap = () => {
  if (!mapContainer.value) return
  const kakao = (window as any).kakao
  if (!kakao || !kakao.maps) return

  const center = props.center ?? { lat: 37.5665, lng: 126.978 }
  const level = props.level ?? 5

  const mapInstance = new kakao.maps.Map(mapContainer.value, {
    center: new kakao.maps.LatLng(center.lat, center.lng),
    level,
  })

  kakao.maps.event.addListener(mapInstance, 'dragend', () => {
    emits('map-move')
  })
  kakao.maps.event.addListener(mapInstance, 'zoom_changed', () => {
    emits('map-move')
    // Re-render polyline overlay to adjust line paths for new zoom level
    if (props.markers && props.markers.length > 0) {
      if (props.showPlanLine !== false) {
        renderPlanPolylineAsOverlay(props.markers)
      }
    }
  })

  map.value = markRaw(mapInstance)
  mapLoaded.value = true

  if (props.markers && props.markers.length > 0) {
    renderMarkers(props.markers)
  }
  if (props.polylines && props.polylines.length > 0) {
    renderPolylines(props.polylines);
  }
}

onMounted(() => {
  const checkKakao = () => {
    const kakao = (window as any).kakao
    if (kakao && kakao.maps) {
      if (typeof kakao.maps.load === 'function') {
        kakao.maps.load(() => {
          initMap()
        })
      } else {
        initMap()
      }
    } else {
      setTimeout(checkKakao, 200) // Poll every 200ms
    }
  }
  checkKakao()
})

watch(() => props.center, (newCenter) => {
    if (map.value && newCenter) {
      const kakao = (window as any).kakao
      if (!kakao || !kakao.maps) return

      const moveLatLon = new kakao.maps.LatLng(newCenter.lat, newCenter.lng);
      map.value.setCenter(moveLatLon);
    }
}, { deep: true });

watch(() => props.level, (newLevel) => {
    // newLevel이 유효한 값인지 확인합니다.
    if (map.value && newLevel !== undefined && newLevel !== null) {
      // ✅ 수정된 부분: setLevel은 map 인스턴스 메서드이므로 kakao 참조는 필요 없지만,
      // map이 로드된 상태인지 확인 후 레벨을 설정합니다.
      map.value.setLevel(newLevel);
    }
});

onUnmounted(() => {
  clearOverlays()
  clearPolylines()
  if (kakaoPlanPolylineOverlay) {
    kakaoPlanPolylineOverlay.setMap(null)
  }
  map.value = null
})



watch(
  () => props.markers,
  (newVal) => {
    if (!mapLoaded.value || !map.value) return
    renderMarkers(newVal ?? [])
  },
  { deep: true },
)

watch(
  () => props.polylines,
  (newVal) => {
    if (!mapLoaded.value || !map.value) return;
    renderPolylines(newVal ?? []);
  },
  { deep: true }
);


defineExpose({
  map,
  panTo,
})
</script>
