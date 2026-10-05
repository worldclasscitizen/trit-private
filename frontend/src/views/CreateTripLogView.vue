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
            TRAVEL DIARY
          </h2>
          <div class="flex items-center gap-4">
            <label class="flex items-center text-sm font-medium text-gray-600">
              <select
                v-model="visibility"
                class="ml-2 px-3.5 py-3 border-2 border-[#2C2C2C] rounded-lg bg-white font-bold
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
              class="flex flex-row px-3 py-2.5 rounded-lg font-bold text-white bg-black
                    justify-center items-center border-2 border-[#2C2C2C]
                    disabled:bg-gray-400 disabled:cursor-not-allowed disabled:border-gray-400
                    transition-all active:scale-95 shadow-md
                    "
              :class="[
                isFormValid ? 'hover:border-2 hover:text-[#2c2c2c] hover:bg-[#CFF500] hover:border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px]' : ''
              ]"
              :disabled="!isFormValid || isSubmitting"
              @click="submitPost"
            >
              <BookMarked
                :size=20
                class="mr-1"
              />
              {{ isSubmitting ? '저장 중...' : '저장하기' }}
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
          <ContentEditor v-model="postContent" class="h-full" />
        </div>

        <!-- Debug HTML View (Real-time) -->
        <!-- <div class="mt-4 p-4 bg-gray-900 text-green-400 rounded-xl overflow-auto min-h-48 text-xs font-mono">
          <h3 class="text-white font-bold mb-2 uppercase tracking-wider">[실시간 HTML 데이터 확인]</h3>
          <pre>{{ postContent }}</pre>
        </div> -->
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
import { BookMarked } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentEditor from '@/components/log-write/ContentEditor.vue'
import { useNavigate } from '@/composables/common/useNavagation'
import { postTripLogCreate } from '@/apis/trip-log/index'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import AlertDialog from '@/components/common/AlertDialog.vue'

const { handleNavigate } = useNavigate()
const route = useRoute()
const router = useRouter()

// ----------------------------
// 상태
// ----------------------------
const title = ref('')
const postContent = ref('')
const visibility = ref<'PUBLIC' | 'PRIVATE'>('PUBLIC')
const isSubmitting = ref(false)

// ----------------------------
// 유효성
// ----------------------------
const isFormValid = computed(() => {
  return title.value.trim() !== '' && postContent.value.trim() !== ''
})

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

const showAlert = (message: string, title = '알림') => {
    dialogState.value = {
        show: true,
        title,
        message,
        confirmButtonText: '확인',
        showCancelButton: false,
        onConfirm: () => {},
    }
}

// tripId는 route param 기준
const tripId = Number(route.params.tripId)

// ----------------------------
// 제출 로직
// ----------------------------
const submitPost = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const payload = {
      tripId,
      title: title.value,
      content: postContent.value,
      visibility: visibility.value,
    }
    await postTripLogCreate(payload)
    // 성공 시 이전 페이지로 이동
    router.back()
  } catch (err) {
    console.error('글 작성 실패', err)
    showAlert('글 저장 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
