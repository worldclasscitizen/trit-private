<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { X, MoreHorizontal } from 'lucide-vue-next'
import { fetchFriends } from '@/apis/user'
import type { User } from '@/types/user/user.model'
import ProfileImageModal from '@/components/log/ProfileImageModal.vue' // ProfileImageModal 임포트

const props = defineProps<{
  show: boolean;
  userId: number; // New prop for user ID
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const popoverOpenForFriendId = ref<number | null>(null)
const friends = ref<User[]>([])
const isLoading = ref(false)
const lastFetchedUserId = ref<number | null>(null); // To prevent re-fetching if the same user is shown again
const defaultProfileImage = '/default-profile.svg'

// 친구 이미지 크게 보기 관련 상태
const showImageViewerModal = ref(false);
const selectedFriendImageUrl = ref<string | undefined>(undefined);

watch(() => props.show, async (isVisible) => {
  if (isVisible && (friends.value.length === 0 || lastFetchedUserId.value !== props.userId)) {
    isLoading.value = true
    try {
      friends.value = await fetchFriends(props.userId) // Pass userId to fetchFriends
      lastFetchedUserId.value = props.userId;
    } catch (error) {
      console.error(`친구 목록 조회 실패 (userId: ${props.userId}):`, error);
      friends.value = [];
    } finally {
      isLoading.value = false
    }
  } else if (!isVisible) {
    // Reset friends list when modal closes to ensure fresh data next time
    friends.value = [];
    lastFetchedUserId.value = null;
    closeImageViewerModal(); // 친구 목록 모달 닫을 때 이미지 뷰어도 닫기
  }
})

function togglePopover(friendId: number) {
  if (popoverOpenForFriendId.value === friendId) {
    popoverOpenForFriendId.value = null
  } else {
    popoverOpenForFriendId.value = friendId
  }
}

function closePopover() {
    popoverOpenForFriendId.value = null
}

function openImageViewerModal(imageUrl: string) {
  selectedFriendImageUrl.value = imageUrl;
  showImageViewerModal.value = true;
}

function closeImageViewerModal() {
  showImageViewerModal.value = false;
  selectedFriendImageUrl.value = undefined;
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="emit('close'); closePopover()"
  >
    <div
      class="w-full max-w-lg rounded-2xl border-2 border-[#2C2C2C] bg-white shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)] flex flex-col"
    >
      <div class="flex items-center justify-between border-b-2 border-gray-100 p-6">
        <h2 class="text-2xl font-black text-gray-800">Friends</h2>
        <button @click="emit('close'); closePopover()" class="p-2 rounded-full hover:bg-gray-100">
          <X class="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div class="p-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
        <div v-if="isLoading" class="text-center py-12 text-gray-500 font-bold">
          친구 목록을 불러오는 중...
        </div>
        <div v-else-if="friends.length === 0" class="text-center py-12 text-gray-500 font-bold">
          친구가 없습니다.
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer"
                @click="openImageViewerModal(friend.profileImageUrl || defaultProfileImage)"
                title="프로필 사진 크게 보기"
              >
                <img :src="friend.profileImageUrl || defaultProfileImage" :alt="friend.nickname" class="w-full h-full object-cover" />
              </div>
              <router-link
                :to="{ name: 'user-log', params: { userId: friend.id } }"
                @click="emit('close')"
                class="font-bold text-gray-800 hover:underline"
              >
                {{ friend.nickname }}
              </router-link>
            </div>

            <div class="relative">
              <button
                @click.stop="togglePopover(friend.id)"
                class="p-2 rounded-full hover:bg-gray-200 text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled
                title="친구 관리 (구현 예정)"
              >
                <MoreHorizontal class="w-5 h-5" />
              </button>

              <!-- Popover for friend actions -->
              <div
                v-if="popoverOpenForFriendId === friend.id"
                class="absolute right-0 top-10 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10"
              >
                <button
                  class="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                  title="친구 끊기 (구현 예정)"
                >
                  친구 끊기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
     <!-- Click outside to close popover -->
    <div v-if="popoverOpenForFriendId !== null" class="fixed inset-0" @click="closePopover" style="z-index: 5;"></div>

    <!-- Friend Profile Image Viewer Modal -->
    <ProfileImageModal
      :show="showImageViewerModal"
      :image-url="selectedFriendImageUrl"
      @close="closeImageViewerModal"
    />
  </div>
</template>
