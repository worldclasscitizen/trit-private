import { ref, onUnmounted } from 'vue'

interface ResizeOptions {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function useResizablePanel(options: ResizeOptions = {}) {
  // 옵션 기본값 설정
  const { initialWidth = 380, minWidth = 280, maxWidth = 600 } = options

  // 상태
  const width = ref(initialWidth)
  const isDragging = ref(false)

  // 마우스 이동 시 실행 (실제 리사이징)
  const handleResize = (e: MouseEvent) => {
    if (!isDragging.value) return

    const newWidth = e.clientX

    // 최소/최대 범위 제한
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      width.value = newWidth
    }
  }

  // 마우스 뗐을 때 실행 (종료)
  const stopResize = () => {
    isDragging.value = false

    // 스타일 초기화
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    // 이벤트 제거
    window.removeEventListener('mousemove', handleResize)
    window.removeEventListener('mouseup', stopResize)
  }

  // 마우스 눌렀을 때 실행 (시작)
  const startResize = () => {
    isDragging.value = true

    // 드래그 중 텍스트 선택 방지 및 커서 고정
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    // window에 이벤트 부착 (패널 밖으로 마우스가 나가도 드래그 유지)
    window.addEventListener('mousemove', handleResize)
    window.addEventListener('mouseup', stopResize)
  }

  // 컴포넌트가 사라질 때 이벤트 정리 (안전장치)
  onUnmounted(() => {
    stopResize()
  })

  // 템플릿에서 쓸 것들 반환
  return {
    width,
    isDragging,
    startResize,
  }
}
