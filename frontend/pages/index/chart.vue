<template lang="pug">
  #main.p-4.p-lg-5
    #header.d-flex.flex-row.py-4
      .w-auto.col-lg-2.p-0.mr-4.mr-lg-5.ml-lg-n2.d-flex.justify-content-start.align-items-center
        NuxtLink.back.d-flex.middle-center.h-100.btn.p-0.px-lg-3.ml-2.ml-lg-5.text-white.rounded-lg(
          :to="`/char?id=${character.song_pack_id}`"
        )
          BIconChevronLeft
      img#song-image.mr-4.mr-lg-5.rounded-lg(
        v-if="character.song_pack_id !== 'other'"
        :src="`/images/${song.song_id}.png`"
        :alt="song.song_name"
      )
      #song-image.mr-4.mr-lg-5.rounded-lg.d-flex.justify-content-center.align-items-center(v-else)
        span ?
      .flex-grow-1.flex-column.justify-content-between
        .m-0.my-3.h5
          span.py-3.px-5.rounded-lg(:style="`background-color: ${character.theme_color};`")
            | {{ character.song_pack_name }}
        .m-0.my-1.h1 {{ song.song_name || song.song_id }}
        .m-0.my-1.h3 {{ song.artist || 'unknown' }}
        .m-0.my-1.h4
          span.pb-1.pt-2.px-2(:class="character.song_pack_id === 'other' ? 'other' : difficulty")
            | {{ character.song_pack_id === 'other' ? '?????' : difficulty.toUpperCase() }} {{ level }}

    #header-bar.d-flex.flex-row.align-items-center.position-fixed.w-100.py-2.px-4.px-lg-5(
      :style="`background-color: ${character.theme_color}; top: ${header ? 5 : 0}rem; opacity: ${header ? 1 : 0}`"
    )
      .p-0.mr-4.mr-lg-5.ml-lg-n2.d-flex.justify-content-start.align-items-center
        NuxtLink.back.h-100.btn.p-0.px-lg-3.ml-2.ml-lg-5.text-white.rounded-lg(:to="`char?id=${character.song_pack_id}`")
          BIconChevronLeft
      #header-name.m-0.h5.mr-4.mr-lg-5.text-center
        span.py-3.px-5.rounded-lg {{ character.song_pack_name }}
      .m-0.px-2.h1.flex-grow-1 {{ song.song_name || song.song_id }}
      .m-0.px-2.h3.flex-grow-1.d-none.d-lg-block {{ song.artist }}
      .m-0.h4.mr-2.mr-lg-5
        span.pb-1.pt-2.px-2.text-nowrap(:class="character.song_pack_id === 'other' ? 'other' : difficulty")
          | {{ character.song_pack_id === 'other' ? '?????' : difficulty.toUpperCase() }} {{ level }}

    #charts.row.px-3.px-lg-5.my-3(v-if="pageNum || (song.charts && song.charts[diffId] && song.charts[diffId].pageNum)")
      .chart.col-12.col-md-6.col-xl-3.p-2.p-lg-3.my-3(v-for="url in imageUrls")
        img(:src="url")
    .row.middle-center
      b-spinner(:style="{ display: rendering ? 'initial' : 'none' }" label="Spinning")
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, onMounted, onUnmounted, ref, useContext, useRoute } from '@nuxtjs/composition-api'
import { BIconChevronLeft } from 'bootstrap-vue'

import songPacksData from '@/assets/data/songPacks.json'
import { SongPack, SongInfo } from '../../../data/src/types/songPack'
import { Chart } from '../../../data/src/types/chart'

import { loadAssets, processData } from '@/util/chart2images'
import { preprocess } from '@/util/preProcess'

export default defineComponent({
  components: { BIconChevronLeft },
  setup() {
    const route = useRoute()
    const { $axios } = useContext()

    const charId = ref('')
    const character = ref({})
    const songId = ref('')
    const song = ref<SongInfo>({
      song_id: '',
      song_name: null,
      artist: null,
      charts: null,
      is_hidden: false,
      IsDownloadOnly: false,
      Category: null,
    })
    const difficulty = ref('')
    const diffId = ref<'Easy' | 'Hard' | 'Chaos' | 'Glitch' | 'Crash' | 'Dream'>('Easy')
    const level = ref('0')
    const curPageNum = ref(0)
    const header = ref(false)
    const imageUrls = ref<string[]>([])
    const rendering = ref(true)
    const chart = ref<Chart | null>(null)
    const pageNum = ref(0)

    const handleScroll = () => {
      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 100 &&
        curPageNum.value < pageNum.value) {
        console.log('add')
        const newPageNum = Math.min(pageNum.value, curPageNum.value + 16)
        render(newPageNum)
      }
      if (window.pageYOffset > 240) header.value = true
      else header.value = false
    }

    function getSongs() {
      const res = songPacksData as SongPack[]
      const newChar = res.find((e: any) => e.song_pack_id === charId.value)
      if (!newChar) throw 'Character not found'
      const newSong = newChar.song_info_list?.find((e: any) => e.song_id === songId.value)
      if (!newSong) throw 'Song not found'
      const other = newChar.song_pack_id === 'other'
      character.value = newChar
      song.value = newSong
      if (!newSong.charts) throw 'Chart not found'
      level.value = other ? '?' : newSong.charts[diffId.value]?.Level || '?'
      curPageNum.value = 0
      document.title = `${newSong.song_name || newSong.song_id} [${difficulty.value.toUpperCase()}] - Cytus II Chart Viewer`
    }

    function getDiff(difficulty: string) {
      if (difficulty === 'easy'  ) return 'Easy'
      if (difficulty === 'hard'  ) return 'Hard'
      if (difficulty === 'chaos' ) return 'Chaos'
      if (difficulty === 'glitch') return 'Glitch'
      if (difficulty === 'crash' ) return 'Crash'
      if (difficulty === 'dream' ) return 'Dream'
      else throw 'Difficulty not found'
    }

    function getDiffId(difficulty: string) {
      if (difficulty === 'easy'  ) return 0
      if (difficulty === 'hard'  ) return 1
      if (difficulty === 'chaos' ) return 2
      if (difficulty === 'glitch') return 3
      if (difficulty === 'crash' ) return 4
      if (difficulty === 'dream' ) return 5
      else throw 'Difficulty not found'
    }

    async function render(newPageNum: number) {
      rendering.value = true
      await new Promise(res => setTimeout(res, 0))
      try {
        for (let i = curPageNum.value; i < newPageNum; i++) {
          imageUrls.value.push(
            processData(chart.value, pageNum.value, i) as unknown as string,
          )
          curPageNum.value ++
        }
      } catch (err) {
        console.error(err)
      }
      await new Promise(res => setTimeout(res, 0))
      rendering.value = false
    }

    onMounted(async() => {
      const query = route.value.query
      charId.value = query.charId as string || ''
      songId.value = query.songId as string || ''
      difficulty.value = query.diff as string || ''
      diffId.value = getDiff(difficulty.value)

      await loadAssets()
      const url = `/charts/${songId.value}_${getDiffId(difficulty.value)}.json`
      chart.value = await $axios.$get(url)
      pageNum.value = chart.value?.pages?.length || 0
      getSongs()
      render(Math.min(pageNum.value, 16))

      window.addEventListener('scroll', handleScroll)
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      charId,
      character,
      songId,
      song,
      difficulty,
      diffId,
      level,
      pageNum,
      curPageNum,
      header,
      imageUrls,
      rendering,
      handleScroll,
    }
  },
})
</script>

<style lang="sass" scoped>
@import '@/assets/styles/level.sass'

.back:hover
	background-color: #FFFFFF20

#header-bar .b-icon.bi
  font-size: 150%

#header .b-icon.bi
  font-size: 250%

#song-image
	background-color: #FFFFFF20
	width: 240px
	height: 240px


#song-image>span
	font-size: 200px

#header-bar
	top: 0
	opacity: 0
	left: 0
	z-index: 200
	transition: 300ms

.chart>img
	width: 100%
</style>
