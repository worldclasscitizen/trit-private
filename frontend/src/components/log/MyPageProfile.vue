<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Pencil } from 'lucide-vue-next';
import type { LogViewProfile } from '@/types/user/user.model'

interface Props {
  profileData: LogViewProfile | null;
  isMyProfile: boolean;
  diaryCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  diaryCount: 0,
})

const emit = defineEmits(['open-friends-modal', 'profile-updated']);

const authStore = useAuthStore();
const defaultProfileImage = '/default-profile.svg';

const isEditMode = ref(false);
const editableNickname = ref('');
const editableBio = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);


watch(() => props.profileData, (newProfile) => {
  if (newProfile) {
    editableNickname.value = newProfile.nickname;
    editableBio.value = newProfile.bio || '';
    isEditMode.value = false;
  }
}, { immediate: true });

function resetImageSelection() {
    selectedFile.value = null;
    if (imagePreviewUrl.value) {
        URL.revokeObjectURL(imagePreviewUrl.value);
        imagePreviewUrl.value = null;
    }
}

function handleEnterEditMode() {
  if (props.profileData) {
    editableNickname.value = props.profileData.nickname;
    editableBio.value = props.profileData.bio || '';
    isEditMode.value = true;
    resetImageSelection();
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
}

function cancelEdit() {
  isEditMode.value = false;
  if (props.profileData) {
    editableNickname.value = props.profileData.nickname;
    editableBio.value = props.profileData.bio || '';
  }
  resetImageSelection();
}

async function handleSave() {
  if (!props.isMyProfile || !props.profileData) return;

  let imageUploadSuccess = true;
  if (selectedFile.value) {
    imageUploadSuccess = await authStore.uploadProfileImage(selectedFile.value);
    if (!imageUploadSuccess) {
      alert('프로필 사진 변경에 실패했습니다.');
      return; // Stop if image upload fails
    }
  }

  const payload: { nickname?: string; bio?: string } = {};
  if (editableNickname.value !== props.profileData.nickname) {
    payload.nickname = editableNickname.value;
  }
  if (editableBio.value !== (props.profileData.bio || '')) {
    payload.bio = editableBio.value;
  }

  let profileUpdateSuccess = true;
  if (Object.keys(payload).length > 0) {
    profileUpdateSuccess = await authStore.updateUserProfile(payload);
    if (!profileUpdateSuccess) {
        alert('프로필 업데이트에 실패했습니다.');
    }
  }

  if (imageUploadSuccess || profileUpdateSuccess) {
    alert('프로필이 성공적으로 업데이트되었습니다.');
    isEditMode.value = false;
    resetImageSelection();
    emit('profile-updated');
  } else {
     isEditMode.value = false; // 변경 사항 없어도 편집 모드 종료
  }
}
</script>

<template>
  <div v-if="profileData" class="w-full bg-[#fae282] border-[4px] border-[#2C2C2C] rounded-[30px] p-6 text-center shadow-[0px_4px_0px_0px_rgba(44,44,44,1)]">
    <div
      class="relative group w-28 h-28 mx-auto mb-4"
      :class="{ 'cursor-pointer': isEditMode }"
      @click="isEditMode ? triggerFileInput() : null"
    >
      <img
        :src="imagePreviewUrl || profileData.profileImageUrl || defaultProfileImage"
        alt="Profile"
        class="w-full h-full object-cover rounded-full border-[4px] border-[#2C2C2C]"
      />
      <div v-if="isEditMode" class="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil class="w-8 h-8 text-white" />
      </div>
      <input
        v-if="isMyProfile"
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/*"
        @change="handleFileChange"
      />
    </div>

    <div v-if="isEditMode" class="mb-4">
      <input
        type="text"
        v-model="editableNickname"
        class="w-full text-center text-xl font-bold p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9BCCC4] focus:border-[#9BCCC4] transition placeholder-gray-400"
        placeholder="닉네임"
      />
    </div>
    <div v-else>
      <h1 class="text-2xl font-black text-[#2C2C2C]">{{ profileData.nickname }}</h1>
      <span class="text-sm text-gray-500">@{{ profileData.email?.split('@')[0] }}_traveler</span>
    </div>

    <div v-if="isEditMode" class="mt-4 mb-4">
       <textarea
          v-model="editableBio"
          class="w-full text-sm p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9BCCC4] focus:border-[#9BCCC4] transition placeholder-gray-400"
          rows="3"
          placeholder="자기소개를 입력하세요."
       ></textarea>
    </div>
    <p v-else class="text-sm text-gray-600 my-4 px-2 whitespace-pre-line leading-relaxed">
      {{ profileData.bio || '자기소개가 없습니다.' }}
    </p>

    <div class="flex justify-center items-center gap-4 my-6">
      <div class="text-center">
        <span class="block text-xl font-black text-[#2C2C2C]">{{ diaryCount }}</span>
        <span class="text-xs text-gray-500 uppercase">LOGS</span>
      </div>
      <div class="border-l-2 h-8 border-gray-200"></div>
      <button @click="$emit('open-friends-modal')" class="text-center" title="친구 목록 보기">
        <span class="block text-xl font-black text-[#2C2C2C]">{{ profileData.friendsCount }}</span>
        <span class="text-xs text-gray-500 uppercase">FRIENDS</span>
      </button>
    </div>

    <div v-if="isMyProfile">
      <div v-if="isEditMode" class="flex gap-2">
        <button @click="handleSave" class="w-full py-2.5 bg-[#2C2C2C] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
          저장
        </button>
        <button @click="cancelEdit" class="w-full py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
          취소
        </button>
      </div>
      <button v-else @click="handleEnterEditMode" class="w-full py-2.5 bg-[#2C2C2C] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors">
        프로필 편집
      </button>
    </div>
  </div>
</template>
