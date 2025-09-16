<script setup lang="ts"></script>

<template>
  <div>
    <main class="">
      <AdBanner/>
      <ListCard title="Khuyến mãi online" :tab="true"/>
      <CarouselBanner/>
      <ListCard title="Gợi ý cho bạn" :tab="false" tab-key="Đồng hồ thông minh"/>
      <ListCard
        title="Lễ hội trả chậm"
        :tab="false"
        tab-key="Điện thoại"
        img="https://cdnv2.tgdd.vn/mwg-static/tgdd/Banner/85/b0/85b0e362b56d952013af81b6388d7e4a.png"
      />
      <SaleBanner/>
      <CarouselBlog/>
      <SearchSuggestion/>
    </main>
  </div>
</template>
