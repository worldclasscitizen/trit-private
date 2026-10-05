<template>
  <div class="h-screen bg-[#F5F5F5] font-sans selection:bg-[#F9CA6B] selection:text-black flex flex-col overflow-hidden">
    <TravelNavbar current-page="main" @navigate="handleNavigate" />

    <div class="flex-grow pt-24 max-w-[1700px] mx-auto w-full px-4 flex flex-col box-border overflow-hidden">
      <section class="flex flex-col flex-grow bg-white rounded-t-2xl shadow-sm p-4 md:p-8 overflow-hidden h-full">

        <div class="flex justify-between items-center mb-2">
          <h2
            class="text-xl font-bold text-gray-800 text-[#2C2C2C]"
            style="font-family: 'Bebas Neue', sans-serif; line-height: 0.8"
          >
            EDIT TRAVEL DIARY
          </h2>
          <div class="flex items-center gap-4">

            <label class="flex items-center text-sm font-medium text-gray-600">
              <select
                v-model="visibility"
                class="ml-2 px-3.5 py-3 border-2 rounded-lg bg-white font-bold
                  focus:outline-none focus:ring-2 focus:ring-gray-200"
                :class="[
                  visibility === 'PUBLIC' ? 'border-[#9BCCC4]' : 'border-[#ff856c]'
                ]"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </label>

            <button
              class="flex flex-row px-5 py-2.5 rounded-lg font-bold text-[#2c2c2c] bg-[#ff856c]
                justify-center items-center border-2 border-[#ff856c]
                transition-all active:scale-95 tracking-wider
                hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] "
              @click="onCancel"
            >
              취소
            </button>

            <button
              class="flex flex-row px-3 py-2.5 rounded-lg font-bold text-white bg-black
                justify-center items-center border-2 border-[#2C2C2C]
                disabled:bg-gray-400 disabled:cursor-not-allowed disabled:border-gray-400
                transition-all active:scale-95 shadow-md
                "
              :class="[
                isFormValid ? 'hover:border-2 hover:text-[#2c2c2c] hover:bg-[#CFF500] hover:border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px]' : ''
              ]"
              :disabled="!isFormValid || isSubmitting"
              @click="onSubmit"
            >
              <BadgeCheck
                :size="20"
                class="mr-1"
              />
              {{ isSubmitting ? '저장 중...' : '수정 완료' }}
            </button>
          </div>
        </div>

        <input
          type="text"
          v-model="title"
          placeholder="여행 일지 제목을 입력하세요"
          class="w-full px-4 py-4 text-3xl font-bold border-b border-gray-50
            focus:outline-none focus:border-black transition-colors mb-4"
        />

        <div class="flex-grow flex flex-col min-h-0 relative h-full mb-10">
          <ContentEditor
            v-model="content"
            ref="editorRef"
            class="h-full"
          />
        </div>

      </section>
    </div>

    <!-- Alert Dialog -->
    <AlertDialog
      :show="dialogState.show"
      :title="dialogState.title"
      :message="dialogState.message"
      :confirm-button-text="dialogState.confirmButtonText"
      :show-cancel-button="dialogState.showCancelButton"
      @close="closeDialog"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { BadgeCheck } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ContentEditor from '@/components/log-write/ContentEditor.vue'
import { getTripLogDetail, patchTripLog } from '@/apis/trip-log'
import type { TripLogDetail, TripVisibility } from '@/types/trip/trip.model'
import { useNavigate } from '@/composables/common/useNavagation'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import AlertDialog from '@/components/common/AlertDialog.vue'

// ----------------------------
// Props 및 라우터 설정
// ----------------------------
interface Props {
  logId: number
}

const props = defineProps<Props>()
const router = useRouter()
const { handleNavigate } = useNavigate() // Navbar 네비게이션을 위해 추가

// ----------------------------
// 상태
// ----------------------------
const content = ref('')
const title = ref('')
const visibility = ref<TripVisibility>('PUBLIC')
const isSubmitting = ref(false)
const editorRef = ref<InstanceType<typeof ContentEditor> | null>(null)

const dialogState = ref({
  show: false,
  title: '알림',
  message: '',
  confirmButtonText: '확인',
  showCancelButton: false,
  onConfirm: () => {},
})

const closeDialog = () => {
    dialogState.value.show = false
}

const handleDialogConfirm = () => {
    dialogState.value.onConfirm()
    closeDialog()
}

const showAlert = (message: string, title = '알림', onConfirm?: () => void) => {
    dialogState.value = {
        show: true,
        title,
        message,
        confirmButtonText: '확인',
        showCancelButton: false,
        onConfirm: onConfirm || (() => {}),
    }
}

const showConfirm = (message: string, onConfirm: () => void, title = '확인') => {
     dialogState.value = {
        show: true,
        title,
        message,
        confirmButtonText: '확인',
        showCancelButton: true,
        onConfirm,
    }
}

// ----------------------------
// 유효성 검사
// ----------------------------
const isFormValid = computed(() => {
  return title.value.trim() !== '' && content.value.trim() !== ''
})

// ----------------------------
// 데이터 불러오기 로직
// ----------------------------
const fetchLog = async () => {
  try {
    const log: TripLogDetail = await getTripLogDetail(props.logId)
    content.value = log.content
    title.value = log.title
    visibility.value = log.visibility
  } catch (e) {
    console.error(e)
    showAlert('로그를 불러오는 중 오류가 발생했습니다.')
  }
}

onMounted(() => {
  fetchLog()
})

// ----------------------------
// 수정 제출 로직
// ----------------------------
const onSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const params = {
      logId: props.logId,
      payload: {
        title: title.value,
        content: content.value,
        visibility: visibility.value,
      }
    }
    await patchTripLog(params)
    showAlert('여행 일지가 성공적으로 수정되었습니다.', '수정 완료', () => {
        router.back()
    })
  } catch (e) {
    console.error(e)
    showAlert('로그 수정에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// ----------------------------
// 취소 로직
// ----------------------------
const onCancel = () => {
  showConfirm('수정 내용을 취소하고 \n이전 페이지로 돌아가시겠습니까?', () => {
    router.back()
  })
}
</script>
