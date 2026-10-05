<template>
  <div
    class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-4 hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.15)] transition-all cursor-pointer group"
  >
    <div class="flex items-center gap-4">
      <!-- Image -->
      <div
        class="w-24 h-24 border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden flex-shrink-0"
      >
        <img
          v-if="place.imageUrl"
          :src="place.imageUrl"
          :alt="place.name"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-full h-full bg-[#FFF8ED] flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        >
          <Map :size="32" :stroke-width="2" class="text-[#2C2C2C]" />
        </div>
      </div>
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <h5 class="text-xl font-black group-hover:text-[#9BCCC4] transition-colors truncate">
            {{ place.name }}
          </h5>
            <!-- Rating removed -->
        </div>
        <div class="flex flex-col gap-1.5 mb-3">
            <div class="flex items-center gap-2 text-xs font-bold text-gray-600">
                <MapPin :size="14" :stroke-width="2" />
                <span class="truncate">{{ place.address || place.location }}</span>
            </div>
            
             <div v-if="place.phone" class="flex items-center gap-2 text-xs font-bold text-gray-600">
               <Phone :size="14" :stroke-width="2" />
               <span class="truncate">{{ place.phone }}</span>
             </div>
             
             <div v-if="place.placeUrl" class="flex items-center gap-2 text-xs font-bold text-gray-600">
               <Globe :size="14" :stroke-width="2" />
               <a 
                :href="place.placeUrl" 
                target="_blank" 
                @click.stop
                class="hover:text-[#E88555] hover:underline truncate max-w-[150px]"
               >
                 {{ truncateUrl(place.placeUrl) }}
               </a>
             </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex gap-1.5 flex-wrap">
            <span
              v-if="categoryTag"
              class="px-2.5 py-0.5 bg-[#9BCCC4] border-[2px] border-[#2C2C2C] rounded-full text-xs font-black truncate max-w-[150px]"
            >
              #{{ categoryTag }}
            </span>
          </div>
           <!-- Review count removed -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Map, MapPin, Phone, Globe } from 'lucide-vue-next'


const props = defineProps<{
  place: any
}>()



const categoryTag = computed(() => {
    if (!props.place.category) return ''
    const parts = props.place.category.split(' > ')
    return parts[parts.length - 1]
})

const truncateUrl = (url: string) => {
  if (!url) return ''
  return url.length > 25 ? url.substring(0, 25) + '...' : url
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  // target.src = '/images/no-image.jpg' // Use placeholder logic or keep broken image hidden?
  // Current logic in template uses v-else for placeholder if imageUrl is missing.
  // If src breaks, we might want to hide the img and show the div?
  // For now, let's just leave it, or maybe set to a transparent pixel.
}


</script>
