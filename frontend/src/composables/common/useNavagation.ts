// composables/navigation.ts
import { useRouter } from 'vue-router'

export function useNavigate() {
  const router = useRouter()

  const handleNavigate = (page: string, params?: any) => {
    switch (page) {
      case 'main':
        router.push('/')
        break
      case 'search':
        router.push({ path: '/search', query: params?.query })
        break
      case 'trips':
        router.push('/trips')
        break
      case 'log':
        router.push('/log')
        break
      case 'create-trip':
        router.push('/create-trip')
        break
      // 상세 페이지 이동 (params.id 필요)
      case 'trip-detail':
        if (params?.id) {
          router.push(`/trips/${params.id}`)
        }
        break
      // 수정 페이지 이동 (params.id 필요)
      case 'trip-edit':
        if (params?.id) {
          router.push(`/trips/${params.id}?edit=true`)
        }
        break
      default:
        console.warn(`Unknown page: ${page}`)
    }
  }

  return {
    handleNavigate,
  }
}
