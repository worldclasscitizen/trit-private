<template>
  <div
    class="group bg-white border-[3px] border-[#2C2C2C] rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(44,44,44,1)] shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] flex flex-col h-full"
  >
    <!-- Image Area -->
    <div class="h-48 overflow-hidden border-b-[3px] border-[#2C2C2C] relative">
      <img
        :src="log.thumbnailUrl"
        :alt="log.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        class="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg border-[2px] border-[#2C2C2C] text-xs font-black shadow-sm"
      >
        {{ log.date }}
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-5 flex-1 flex flex-col">
      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mb-3">
        <span
          v-for="tag in log.tags"
          :key="tag"
          class="px-2 py-0.5 bg-[#F0F9FF] border-[1.5px] border-[#2C2C2C] rounded-md text-[10px] font-bold text-[#2C2C2C]"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-black text-[#2C2C2C] mb-2 line-clamp-2 leading-tight font-sans">
        {{ log.title }}
      </h3>

      <!-- Preview Text -->
      <p class="text-sm text-gray-600 font-medium line-clamp-3 mb-4 flex-1">
        {{ log.preview }}
      </p>

      <!-- Footer (Author & Stats) -->
      <div class="flex items-center justify-between pt-4 border-t-[2px] border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full border-[1.5px] border-[#2C2C2C] overflow-hidden">
            <img :src="log.authorAvatar" class="w-full h-full object-cover" />
          </div>
          <span class="text-xs font-bold text-[#2C2C2C]">{{ log.author }}</span>
        </div>

        <div class="flex items-center gap-3 text-xs font-bold text-gray-400">
          <span class="flex items-center gap-1">
            <Heart class="w-3.5 h-3.5" /> {{ log.likes }}
          </span>
          <span class="flex items-center gap-1">
            <MessageCircle class="w-3.5 h-3.5" /> {{ log.comments }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Heart, MessageCircle } from 'lucide-vue-next'

interface Log {
  id: number
  title: string
  preview: string
  date: string
  thumbnailUrl: string
  tags: string[]
  author: string
  authorAvatar: string
  likes: number
  comments: number
}

defineProps<{
  log: Log
}>()
</script>
