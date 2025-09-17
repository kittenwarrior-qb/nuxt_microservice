<template>
    <div v-if="!isHidden" class="">
        <div class="max-w-[1200px] mx-auto rounded-lg mt-5 relative">
            <img src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Banner/61/21/6121e88a03cd18583365e6c31932db6e.png" alt="abcd" class="rounded-lg" />
            <button 
                @click="closeAd"
                class="absolute top-2 right-2 bg-[#98a2b3] text-white text-[10px] rounded-full w-[18px] h-[18px] flex items-center justify-center hover:bg-opacity-70 transition-all duration-200"
                aria-label="Đóng quảng cáo"
            >
                ✕
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const isHidden = ref(false)

const closeAd = () => {
    isHidden.value = true
}
</script>