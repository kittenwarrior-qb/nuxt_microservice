<template>
    <div v-if="!isHidden" class="">
        <div class="max-w-[1200px] mx-auto rounded-lg mt-5 relative">
            <img src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Banner/71/bd/71bd8c97f581fdb5384db58f4d4effb9.png" alt="abcd" class="rounded-lg" />
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