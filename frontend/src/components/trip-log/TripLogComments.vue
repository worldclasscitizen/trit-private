<template>
  <div class="bg-white flex flex-col h-full">
    <!-- Header (Optional) -->
    <div v-if="header" class="p-4 border-b border-gray-200 flex items-center justify-center relative">
        <h3 class="font-black text-lg text-[#2C2C2C]">{{ header }}</h3>
        <!-- Close button if needed passed via slot or event, but usually external control -->
    </div>

    <!-- Comments List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <template v-if="comments && comments.length > 0">
        <div v-for="comment in comments" :key="comment.commentId" class="flex items-start gap-3">
          <div
            class="border-[2px] border-[#2C2C2C] rounded-full overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] cursor-pointer hover:opacity-80"
            :class="layout === 'horizontal' ? 'w-8 h-8' : 'w-10 h-10'"
            @click="emit('navigate-user', comment.authorId)"
          >
            <img :src="comment.authorImageUrl" :alt="comment.authorNickname" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 flex items-start">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span 
                  class="font-black text-[#2C2C2C] cursor-pointer hover:underline"
                  :class="layout === 'horizontal' ? 'text-xs' : 'text-sm'"
                  @click="emit('navigate-user', comment.authorId)"
                >
                  {{ comment.authorNickname }}
                </span>
                <span class="font-bold text-gray-400" :class="layout === 'horizontal' ? 'text-[10px]' : 'text-xs'">{{ formatCommentDate(comment.createdAt) }}</span>
              </div>

              <div v-if="editingCommentId === comment.commentId" class="flex flex-col gap-2">
                 <input
                    v-model="editingContent"
                    type="text"
                    ref="editInputRef"
                    class="w-full border-[2px] border-[#2C2C2C] rounded-lg px-3 py-2 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
                    :class="layout === 'horizontal' ? 'text-xs' : 'text-sm'"
                    @keydown.enter.prevent="handleEditKeydown($event, comment.commentId)"
                    @keydown.esc="cancelEditComment"
                  />
                  <div class="flex justify-end gap-2">
                    <button @click="cancelEditComment" class="text-xs font-bold text-gray-500 hover:text-gray-700">취소</button>
                    <button @click="handleUpdateComment(comment.commentId)" class="text-xs font-bold text-blue-500 hover:text-blue-700">저장</button>
                  </div>
              </div>
              <p v-else :class="['font-medium text-gray-800 leading-relaxed break-all', layout === 'horizontal' ? 'text-xs' : 'text-sm']">{{ comment.content }}</p>
            </div>

            <div v-if="currentUserNickname === comment.authorNickname && editingCommentId !== comment.commentId" class="relative ml-2 flex-shrink-0">
              <button 
                @click.stop="toggleCommentDropdown(comment.commentId)"
                class="p-1 hover:bg-gray-100 rounded-full transition-colors -mt-1"
                :data-comment-dropdown-trigger="comment.commentId"
              >
                <MoreHorizontal class="w-4 h-4 text-gray-400" stroke-width="2" />
              </button>
              
              <div
                v-if="activeCommentDropdownId === comment.commentId"
                class="absolute right-0 top-full mt-1 w-20 bg-white border-[2px] border-[#2C2C2C] rounded-lg shadow-[4px_4px_0px_0px_rgba(44,44,44,0.2)] overflow-hidden z-10"
                :data-comment-dropdown-menu="comment.commentId"
              >
                <button
                  @click="handleEditClick(comment)"
                  class="w-full px-3 py-2 flex items-center justify-center hover:bg-gray-50 transition-colors text-xs font-bold text-[#2C2C2C] border-b border-gray-100"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteClick(comment.commentId)"
                  class="w-full px-3 py-2 flex items-center justify-center hover:bg-red-50 transition-colors text-xs font-bold text-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
          <MessageCircle class="w-12 h-12 mb-2 text-gray-300" stroke-width="1.5" />
          <p class="text-sm font-bold text-gray-400">댓글이 아직 없어요</p>
          <p class="text-xs text-gray-400">첫 번째 댓글을 남겨보세요!</p>
      </div>
    </div>

    <!-- Input Section -->
    <div class="border-t border-gray-200 bg-white">
      <slot name="footer-actions" />
      
      <div class="p-4" :class="{'pt-0': $slots['footer-actions']}">
        <form @submit.prevent="handleCommentSubmit" class="flex items-center gap-2.5">
          <div 
            :class="[
              'border-[2px] border-[#2C2C2C] rounded-full overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]',
              layout === 'horizontal' ? 'w-8 h-8' : 'w-10 h-10'
            ]"
          >
           <img
            v-if="isLoggedIn && currentUserProfileImage"
            :src="currentUserProfileImage"
            alt="My Profile"
            class="w-full h-full object-cover"
          />
          <img
            v-else
            src="/default-profile.svg"
            alt="Default Profile"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="relative flex-1">
          <input
            v-model="newComment"
            :disabled="!isLoggedIn"
            type="text"
            :placeholder="
              isLoggedIn ? '댓글을 입력하세요...' : '로그인 후 댓글을 남길 수 있습니다.'
            "
            class="w-full border-[2px] border-[#2C2C2C] rounded-lg font-medium bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(107,143,212,0.3)] transition-all placeholder:text-gray-400"
            :class="[
              !isLoggedIn ? 'bg-gray-100' : '',
              layout === 'horizontal' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
            ]"
            @keydown.enter.prevent="handleKeydownSubmit"
            ref="mainInputRef"
          />
          <div
            v-if="!isLoggedIn"
            @click="emit('login-required')"
            class="absolute inset-0 cursor-pointer"
          ></div>
        </div>
        <button
          type="submit"
          :disabled="!isLoggedIn"
          :class="[
            'border-[2px] border-[#2C2C2C] rounded-lg font-black bg-[#F9CA6B] text-[#2C2C2C] hover:shadow-[3px_3px_0px_0px_rgba(44,44,44,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed',
            layout === 'horizontal' ? 'px-3 py-2 text-[10px]' : 'px-5 py-3 text-xs'
          ]"
        >
          작성
        </button>
      </form>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { MoreHorizontal, MessageCircle } from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import type { TripLogCommentResponse } from '@/apis/trip-log/types'

const props = withDefaults(defineProps<{
  comments: TripLogCommentResponse[]
  currentUserNickname?: string
  currentUserProfileImage?: string
  isLoggedIn: boolean
  header?: string
  layout?: 'vertical' | 'horizontal'
}>(), {
  layout: 'vertical'
})

const emit = defineEmits<{
  (e: 'post-comment', content: string): void
  (e: 'update-comment', id: number, content: string): void
  (e: 'delete-comment', id: number): void
  (e: 'login-required'): void
  (e: 'navigate-user', userId: number): void
}>()

const newComment = ref('')
const activeCommentDropdownId = ref<number | null>(null)
const editingCommentId = ref<number | null>(null)
const editingContent = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const mainInputRef = ref<HTMLInputElement | null>(null)

const handleCommentSubmit = () => {
  if (!props.isLoggedIn) {
     emit('login-required')
    return
  }
  if (!newComment.value.trim()) return
  emit('post-comment', newComment.value)
  newComment.value = ''
}

const handleKeydownSubmit = (e: KeyboardEvent) => {
  if (e.isComposing) return
  handleCommentSubmit()
}

const startEditComment = async (comment: TripLogCommentResponse) => {
  editingCommentId.value = comment.commentId
  editingContent.value = comment.content
  await nextTick()
  if (editInputRef.value) {
    editInputRef.value.focus()
  }
}

const handleEditKeydown = (e: KeyboardEvent, commentId: number) => {
  if (e.isComposing) return
  handleUpdateComment(commentId)
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const handleUpdateComment = async (commentId: number) => {
  if (!editingContent.value.trim()) return
  emit('update-comment', commentId, editingContent.value)
  editingCommentId.value = null
  editingContent.value = ''
}

const handleEditClick = (comment: TripLogCommentResponse) => {
  activeCommentDropdownId.value = null
  startEditComment(comment)
}

const handleDeleteClick = (commentId: number) => {
  activeCommentDropdownId.value = null
  emit('delete-comment', commentId)
}

const toggleCommentDropdown = (commentId: number) => {
  if (activeCommentDropdownId.value === commentId) {
    activeCommentDropdownId.value = null
  } else {
    activeCommentDropdownId.value = commentId
  }
}

const formatCommentDate = (dateString: string) => {
  const date = parseISO(dateString)
  const now = new Date()
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)
  if (diffSeconds < 60) return `${diffSeconds}초 전`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  return format(date, 'yyyy.MM.dd')
}

// Click outside logic
const handleClickOutside = (e: MouseEvent) => {
  if (activeCommentDropdownId.value !== null) {
    const target = e.target as HTMLElement
    const trigger = target.closest(`[data-comment-dropdown-trigger="${activeCommentDropdownId.value}"]`)
    const menu = target.closest(`[data-comment-dropdown-menu="${activeCommentDropdownId.value}"]`)
    
    if (!trigger && !menu) {
      activeCommentDropdownId.value = null
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
    focusInput: () => mainInputRef.value?.focus()
})
</script>

<style scoped>
/* Scoped styles */
</style>
