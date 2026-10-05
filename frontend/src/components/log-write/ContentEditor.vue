<style scoped lang="scss" src="@/assets/ContentEditor.css">
</style>

<template>
  <div class="editor-wrapper border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm h-full relative">
    <!-- Mini Progress Indicator -->
    <div
      v-if="isUploading"
      class="absolute top-16 right-4 z-20
            bg-white/90 backdrop-blur-sm border border-gray-100 rounded-lg shadow-lg
            p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div class="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      <div class="flex flex-col">
        <span class="text-xs font-bold text-gray-800">이미지 업로드 중 ({{ uploadingImages.length }}개)</span>
        <div class="w-32 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
          <div
            class="h-full bg-black transition-all duration-500"
            :style="{ width: avgProgress + '%' }"
          />
        </div>
      </div>
    </div>

    <div class="relative flex-grow flex flex-col h-full">
      <QuillEditor
        class="flex-grow h-full"
        theme="snow"
        contentType="html"
        :content="content"
        :toolbar="[
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['link', 'image'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
    ]"
        @update:content="updateContent"
        @ready="onReady"
      />
    </div>
  </div>
</template>


<script setup lang="ts">
import { Quill } from '@vueup/vue-quill'
import { ref, watch, computed, type Ref } from 'vue'
import { getPresignedUrl} from '@/apis/trip-log/index'
import { uploadToS3, getPublicImageUrl } from '@/composables/trip-log/useImageUpload'
import type { UploadingImage } from '@/types/image/image.model'
import { resizeImage } from '@/utils/imageResize'

/* -------------------------------------------------------------------------- */
/* Quill 초기화 패치 (가장 중요)                 */
/* -------------------------------------------------------------------------- */
// Quill이 로드되자마자 실행되어야 합니다.
const Image = Quill.import('formats/image');

// 기존 방식(상속)이 안 먹힐 때 사용하는 "직접 패치" 방식입니다.
// 원본 sanitize 함수를 백업합니다.
const originalSanitize = Image.sanitize;

// Image 포맷의 sanitize 함수를 덮어씁니다.
Image.sanitize = function(url: string) {
  // 1. blob이나 data URL이면 무조건 통과 (보안 검사 건너뛰기)
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // 2. 그 외(http 등)는 기존 로직을 태움
  return originalSanitize(url);
};

// data-upload-id 속성을 유지하기 위한 포맷 설정도 직접 패치합니다.
const originalFormats = Image.formats;
Image.formats = function(domNode: HTMLElement) {
  const formats = originalFormats.call(this, domNode) || {}; // 기존 포맷 가져오기
  if (domNode.hasAttribute('data-upload-id')) {
    formats['upload-id'] = domNode.getAttribute('data-upload-id');
  }
  return formats;
};

// 프로토타입의 format 메서드도 확장합니다 (속성 쓰기용).
const originalFormat = Image.prototype.format;
Image.prototype.format = function(name: string, value: string | null) {
  if (name === 'upload-id') {
    if (value) {
      this.domNode.setAttribute('data-upload-id', value);
    } else {
      this.domNode.removeAttribute('data-upload-id');
    }
  } else if (name === 'uploading') {
    if (value) {
      this.domNode.classList.add('uploading');
    } else {
      this.domNode.classList.remove('uploading');
    }
  } else if (originalFormat) {
    originalFormat.call(this, name, value);
  }
};
/* -------------------------------------------------------------------------- */

interface Props {
  modelValue: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

/* ---------------- state ---------------- */
const content = ref(props.modelValue)
const quillInstance: Ref<Quill | null> = ref(null)
const isUploading = ref(false)
const uploadingImages = ref<UploadingImage[]>([])
const isInitialized = ref(false)

const avgProgress = computed(() => {
  if (uploadingImages.value.length === 0) return 0
  const sum = uploadingImages.value.reduce((a, b) => a + b.progress, 0)
  return Math.floor(sum / uploadingImages.value.length)
})

/* ---------------- constants ---------------- */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

/* ---------------- utils ---------------- */
const validateImage = (file: File) => {
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.')
    return false
  }
  if (file.size > MAX_IMAGE_SIZE) {
    alert('이미지는 5MB 이하만 가능합니다.')
    return false
  }
  return true
}

const uploadImageAndGetUrl = async (file: File): Promise<string> => {
  const data = await getPresignedUrl(file)
  if (!data || !data.presignedUrl) {
    throw new Error('Presigned URL을 받지 못했습니다.')
  }
  await uploadToS3(data.presignedUrl, file)

  const publicUrl = (data as { imageUrl?: string }).imageUrl || getPublicImageUrl(data.presignedUrl)
  if (!publicUrl) {
    throw new Error('이미지 URL 추출에 실패했습니다.')
  }
  return publicUrl
}

/* ---------------- core upload logic ---------------- */
const uploadAndInsertImage = async (file: File) => {
  if (!quillInstance.value || !validateImage(file)) return

  const quill = quillInstance.value
  const item: UploadingImage = {
    id: crypto.randomUUID(),
    file,
    progress: 0,
  }

  // ... (state, timer, localUrl 선언 부분은 동일) ...
    uploadingImages.value.push(item)
    isUploading.value = true

    const timer = setInterval(() => {
        item.progress = Math.min(item.progress + 10, 90)
    }, 100)

    const localUrl = URL.createObjectURL(file)
    let cur: number | null = null

    try {
    const range = quill.getSelection(true)
    const insertIndex = range ? range.index : quill.getLength() // Math.max(quill.getLength() - 1, 0) 대신 quill.getLength()로 마지막 위치 사용
    cur = insertIndex

    // 1️⃣ 로컬 이미지 삽입
    console.log('[Debug] 임시 이미지 삽입 시도:', localUrl)

    // insertEmbed 실행 (이제 sanitize가 패치되었으므로 blob 주소가 유지되어야 함)
    // 인덱스 1만큼 삽입
    quill.insertEmbed(insertIndex, 'image', localUrl, 'user')

    // 2️⃣ ID 부여 및 스타일링 (Quill의 포맷 시스템 사용 - 델타에 저장됨)
    quill.formatText(insertIndex, 1, 'upload-id', item.id, 'user')
    quill.formatText(insertIndex, 1, 'uploading', 'true', 'user')

    console.log('[Debug] 이미지 삽입 및 ID 부여 성공:', item.id)

    // 커서 정리: 이미지 다음으로 이동
    quill.setSelection(insertIndex + 1, 0, 'silent');

    // 3️⃣ S3 업로드
    const resizedFile = await resizeImage(file, 1000, 1000, 0.8)
    const finalUrl = await uploadImageAndGetUrl(resizedFile)

    clearInterval(timer)
    item.progress = 100

    // 4️⃣ 이미지 교체
    console.log('[Debug] 교체 프로세스 시작. 아이디:', item.id);

    // [중요] 교체 직전 에디터 모델 동기화 (레이스 컨디션 방지)
    quill.update('user');

    // 1. Blot 트리 전체를 순회하여 ID가 일치하는 이미지를 직접 찾음 (가장 정확한 모델 탐색)
    let targetBlot: any = null;
    const images = (quill as any).scroll.descendants(Image);
    for (const blot of images) {
      if (blot.domNode && (blot.domNode as HTMLElement).getAttribute('data-upload-id') === item.id) {
        targetBlot = blot;
        break;
      }
    }

    let foundIndex = -1;
    if (targetBlot) {
      foundIndex = quill.getIndex(targetBlot);
    }

    if (foundIndex >= 0) {
      console.log('[Debug] 이미지 위치 찾음:', foundIndex);
      // Quill API로 교체
      quill.deleteText(foundIndex, 1, 'user')
      quill.insertEmbed(foundIndex, 'image', finalUrl, 'user')

      quill.setSelection(foundIndex + 1, 0, 'silent');
      quill.focus();
    } else {
      // 2. 모델에서 못 찾은 경우 DOM에서 직접 탐색 (최후의 보루)
      const targetImg = quill.root.querySelector(`img[data-upload-id="${item.id}"]`) as HTMLImageElement | null;
      if (targetImg) {
        console.warn('[Debug] Blot 탐색 실패. DOM 직접 교체 시도.');
        const parent = targetImg.parentNode;
        if (parent) {
          const replacement = document.createElement('img');
          replacement.src = finalUrl;
          replacement.className = targetImg.className;
          replacement.classList.remove('uploading');
          parent.replaceChild(replacement, targetImg);

          quill.update('user');
          updateContent(quill.root.innerHTML);
        }
      } else {
        console.error('[Debug] 이미지를 완전히 찾을 수 없음. 마지막에 추가함.');
        quill.insertEmbed(quill.getLength(), 'image', finalUrl, 'user');
      }
    }

    URL.revokeObjectURL(localUrl)
  } catch (e) {
    console.error('업로드 실패:', e)

    // 실패 시 임시 이미지 제거 시도
    if (cur !== null) {
        const targetImg = quill.root.querySelector(`img[data-upload-id="${item.id}"]`)
        if (targetImg) {
            const blot = Quill.find(targetImg)
            if (blot) {
                const index = quill.getIndex(blot)
                quill.deleteText(index, 1, 'user')
            }
        }
    }
    URL.revokeObjectURL(localUrl)
  } finally {
    uploadingImages.value = uploadingImages.value.filter(img => img.id !== item.id)
    if (uploadingImages.value.length === 0) isUploading.value = false
  }
}

/* ---------------- handlers ---------------- */
const handleDrop = (e: DragEvent) => {
  const files = Array.from(e.dataTransfer?.files ?? [])
    .filter(f => f.type.startsWith('image/'))
  files.forEach(uploadAndInsertImage)
}

const handleToolbarImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) uploadAndInsertImage(file)
  }
  input.click()
}

const onReady = (quill: Quill) => {
  if (isInitialized.value) return;
  isInitialized.value = true;

  quillInstance.value = quill;
  const toolbar = quill.getModule('toolbar') as { addHandler: (name: string, handler: () => void) => void } | null;
  if(toolbar){
    toolbar.addHandler('image', handleToolbarImage);
  }

  quill.root.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  })
  quill.root.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleDrop(e)
  })

  quill.root.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      // 이미지 클릭 시 브라우저 기본 동작 방지
      e.preventDefault();
      e.stopPropagation();

      if (confirm('이미지를 삭제할까요?')) {
        const blot = Quill.find(target);
        if (blot) {
          const index = quill.getIndex(blot);
          if (index >= 0) {
            console.log('[Debug] 이미지 삭제 시도 (인덱스):', index);
            quill.deleteText(index, 1, 'user');
            quill.focus();
            return;
          }
        }

        // [Fallback] Quill 모델에서 찾지 못하는 경우 DOM에서 직접 제거
        if (quill.root.contains(target)) {
          console.warn('[Debug] Quill 모델에서 이미지를 못 찾아 DOM 직접 제거 시도.');
          target.remove();
          quill.update('user');
          updateContent(quill.root.innerHTML);
        }
      }
    }
  })
}

/* ---------------- sync ---------------- */
watch(
  () => props.modelValue,
  v => { if (v !== content.value) content.value = v }
)

const updateContent = (html: string) => {
  content.value = html
  emit('update:modelValue', html)
}
</script>
