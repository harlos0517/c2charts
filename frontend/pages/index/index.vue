<template lang="pug">
  #main.container-xl.p-5
    .row
      NuxtLink.char-container.col-6.col-md-4.col-xl-3.py-5.px-0.rounded-lg.link-text-reset(
        v-for="(songPack, index) in songPacks"
        :to="`/char?id=${songPack.song_pack_id}`"
        :key="index"
      )
        .char.text-center.mb-3
          img.h-100(
            :src="`/images/${songPack.song_pack_id}_l.png`"
            :alt="songPack.song_pack_name"
          )
        .char-name.text-center.p-3.mx-5.rounded-lg(
          :style="`background-color: ${songPack.theme_color};`"
          :class="{ 'text-dark': songPack.song_pack_id === 'ilka001' }"
        ) {{ songPack.song_pack_name }}
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

import songPacksData from '@/assets/data/songPacks.json'
import { SongPack } from '@data/types/songPack'

export default defineComponent({
  setup() {
    const songPacks = songPacksData as SongPack[]
    return { songPacks }
  },
})
</script>

<style lang="sass" scoped>
.char-container:hover
  background-color: #FFFFFF20
.char
  height: 150px
</style>
