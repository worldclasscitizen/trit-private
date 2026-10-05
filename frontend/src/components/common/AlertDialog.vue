<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
      @click.self="handleClose"
    >
      <div
        class="bg-white border-[3px] border-[#2C2C2C] rounded-2xl shadow-[8px_8px_0px_0px_rgba(44,44,44,0.3)] max-w-sm w-full p-8 text-center"
      >
        <h3 class="font-black text-2xl mb-4 text-[#2C2C2C] font-sans">{{ title }}</h3>
        <p class="text-base font-medium text-gray-700 mb-8 whitespace-pre-line">{{ message }}</p>
        <div class="flex gap-3 justify-center">
          <button
            v-if="showCancelButton"
            @click="handleClose"
            class="px-8 py-3 border-[2px] border-[#2C2C2C] rounded-lg font-black text-sm bg-white text-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 uppercase tracking-wide"
          >
            {{ closeButtonText }}
          </button>
          <button
            @click="handleConfirm"
            class="px-8 py-3 border-[2px] border-[#2C2C2C] rounded-lg font-black text-sm bg-[#F9CA6B] text-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 uppercase tracking-wide"
          >
            {{ confirmButtonText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '알림',
  },
  message: {
    type: String,
    required: true,
  },
  confirmButtonText: {
    type: String,
    default: '확인',
  },
  closeButtonText: {
    type: String,
    default: '취소',
  },
  showCancelButton: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close', 'confirm'])

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
