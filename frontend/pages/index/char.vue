<template lang="pug">
  #main.container-xl.p-5
    .d-lg-flex.flex-lg-row
      .char-image-row.pr-5.d-none.d-lg-block
        img.w-100.mb-5(
          v-if="songPack.song_pack_id!=='other'"
          :src="`/images/${songPack.song_pack_id}_s.png`"
          :alt="songPack.song_pack_name"
        )
        .text-center.p-3.rounded-lg.mb-4(
          :style="`background-color: ${songPack.theme_color};`"
        ) {{ songPack.song_pack_name }}
        NuxtLink.text-center.w-100.p-3.back.btn.text-white.rounded-lg.d-flex.flex-row(to="/")
          BIconChevronLeft
          span.flex-grow-1 BACK
      .char-image.d-block.d-lg-none
        .text-center.p-0.mb-4.rounded-lg.d-flex.flex-row.align-items-center(:style="`background-color: ${songPack.theme_color};`")
          NuxtLink.p-3.back.btn.text-white.rounded-lg.d-flex.flex-row(to="/")
            BIconChevronLeft
          .flex-grow-1.p-3 {{ songPack.song_pack_name }}
      .flex-grow-1
        table#song-table.table.table-dark.table-hover.table-fix-head
          thead.thead-light
            tr
              th.align-middle.border-0
                .d-flex.flex-row
                  .flex-grow-1.pr-3 Title
                  .flex-grow-1.text-right Composer
              template(v-if="songPack.song_pack_id!=='other'")
                th.text-center.align-middle.diff.border-0(
                  v-for="level in levels"
                  :class="level.toLowerCase()"
                ) {{ level.toUpperCase() }}
              template(v-else)
                th.text-center.align-middle.other.diff.border-0 ?
          tbody
            tr(v-for="song in songPack.song_info_list")
              td.align-middle
                .d-flex.flex-row
                  .flex-grow-1.pr-3 {{ song.song_name || song.song_id }}
                  .flex-grow-1.text-right {{ song.artist || '' }}
              template(v-if="songPack.song_pack_id!=='other'")
                td.text-center.align-middle.py-2.diff(v-for="level in levels")
                  NuxtLink.rounded-circle.m-auto(
                    :class="level.toLowerCase()"
                    v-if="song.charts[level]"
                    :to="`/chart?charId=${songPack.song_pack_id}&songId=${song.song_id}&diff=${level.toLowerCase()}`"
                  )
                    | {{ song.charts[level].Level }}
              template(v-else)
                td.text-center.align-middle.py-2.diff
                  a.other.rounded-circle.m-auto(:href="`/chart?charId=${songPack.song_pack_id}&songId=${song.song_id}&diff=&diff=${level.toLowerCase()}`") ?
</template>

<script lang="ts">
import { defineComponent, useRoute } from '@nuxtjs/composition-api'
import { BIconChevronLeft } from 'bootstrap-vue'

import songPacksData from '@/assets/data/songPacks.json'
import { SongPack } from '../../../data/src/types/songPack'

export default defineComponent({
  components: { BIconChevronLeft },
  setup() {
    const route = useRoute()

    const songPacks = songPacksData as SongPack[]
    const id = route.value.query.id
    const songPack = songPacks.find(p => p.song_pack_id === id) || songPacks[0] || null
    const songPackId = songPack?.song_pack_id || null

    const levels = ['Easy', 'Hard', 'Chaos', 'Glitch', 'Crash']

    return { songPack, songPackId, levels }
  },
})
</script>

<style lang="sass" scoped>
@import '@/assets/styles/level.sass'

.char-image-row
  width: 250px
td.diff>a
  display: block
  width: 2em
  height: 2em
  line-height: 2em
  border-width: 1px
  border-style: solid
</style>
