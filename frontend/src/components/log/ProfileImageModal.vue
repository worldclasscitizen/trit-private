<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Camera, X } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean;
  imageUrl?: string; // 새롭게 추가된 prop: 특정 이미지를 보여줄 때 사용
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const defaultProfileImage = '/default-profile.svg'

const selectedFile = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const isUploading = ref(false)

// 이미지 뷰어 모드인지 판단 (imageUrl prop이 전달되면 뷰어 모드)
const isViewerMode = computed(() => !!props.imageUrl);

// 모달이 보여질 때 미리보기 URL을 설정
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (isViewerMode.value) {
        imagePreviewUrl.value = props.imageUrl || null;
      } else {
        imagePreviewUrl.value = user.value?.profileImageUrl || null;
      }
      selectedFile.value = null; // 파일 선택 초기화
    }
  },
  { immediate: true } // 컴포넌트 마운트 시 한 번 실행
);

// imageUrl prop이 변경될 때마다 imagePreviewUrl 업데이트 (뷰어 모드일 경우)
watch(() => props.imageUrl, (newUrl) => {
  if (isViewerMode.value) {
    imagePreviewUrl.value = newUrl || null;
  }
});

function onFileSelectClick() {
  document.getElementById('modal-profile-image-input')?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

function cancelImageChange() {
  selectedFile.value = null
  imagePreviewUrl.value = user.value?.profileImageUrl || null
}

async function saveProfileImage() {
  if (!selectedFile.value) return
  isUploading.value = true
  try {
    const success = await authStore.uploadProfileImage(selectedFile.value)
    if (success) {
      alert('프로필 사진이 성공적으로 변경되었습니다.')
      emit('close')
    } else {
      cancelImageChange()
    }
  } finally {
    isUploading.value = false
  }
}

async function deleteProfileImage() {
  if (!confirm('정말로 프로필 사진을 삭제하시겠습니까?')) return
  isUploading.value = true
  try {
    const success = await authStore.deleteProfileImage()
    if (success) {
      alert('프로필 사진이 삭제되었습니다.')
      emit('close')
    }
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-2xl border-2 border-[#2C2C2C] bg-white p-8 shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)]"
    >
      <div class="flex items-center justify-between border-b-2 border-gray-100 pb-6 mb-8">
        <h2 class="text-2xl font-black text-gray-800">
          {{ isViewerMode ? '프로필 사진' : '프로필 사진 변경' }}
        </h2>
        <button @click="emit('close')" class="p-2 rounded-full hover:bg-gray-100">
          <X class="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div class="flex flex-col items-center">
        <div class="group relative">
          <img
            :src="imagePreviewUrl || defaultProfileImage"
            alt="Profile"
            class="h-48 w-48 rounded-full border-4 border-gray-200 object-cover shadow-md"
          />
          <div
            v-if="!isViewerMode"
            class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            @click="onFileSelectClick"
          >
            <Camera class="h-12 w-12 text-white" />
          </div>
        </div>
        <input
          v-if="!isViewerMode"
          type="file"
          id="modal-profile-image-input"
          class="hidden"
          accept="image/*"
          @change="onFileSelected"
        />

        <div v-if="!isViewerMode" class="mt-6 flex min-h-[40px] items-center gap-3">
          <template v-if="selectedFile">
            <button
              @click="saveProfileImage"
              :disabled="isUploading"
              class="rounded-lg bg-[#9BCCC4] border-2 border-[#2C2C2C] px-5 py-2 text-sm font-bold text-[#2C2C2C] shadow-sm transition-all hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:bg-gray-400 disabled:shadow-none"
            >
              {{ isUploading ? '저장 중...' : '저장' }}
            </button>
            <button @click="cancelImageChange" class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300">
              취소
            </button>
          </template>
          <template v-else-if="user?.profileImageUrl">
            <button
              @click="deleteProfileImage"
              :disabled="isUploading"
              class="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:bg-gray-400"
            >
              {{ isUploading ? '삭제 중...' : '사진 삭제' }}
            </button>
          </template>
          <p v-else class="text-sm text-gray-500">
            사진을 클릭하여 등록
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
