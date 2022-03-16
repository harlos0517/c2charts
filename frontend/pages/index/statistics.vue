<template lang="pug">
  #main.px-0
    table#chart-table.table.table-dark.table-striped.table-hover.table-bordered.table-fix-head.mb-5.mx-auto
      thead.thead-light.text-center.align-middle
        tr
          template(v-for="col in cols")
            th(
              v-if="col.show"
              :rowspan="(col.type === 'fixed' || col.type === 'sort') ? 2 : 1"
              :colspan="(col.type === 'category' ? col.items.filter(x=>x.show).length : (col.type === 'minmax' ? 2 : 1))"
              :class="[...(col.nameClass || []), { 'sort-head': col.type === 'sort' || col.type === 'minmax', 'bg-dark text-white': curSort.col === col }]"
              @click="sort(col)"
            )
              | {{ col.name }}
              span(v-if="curSort.col !== col") ⥮
              span(v-else-if="curSort.inc") ↑
              span(v-else) ↓
        tr
          template(v-for="col in cols")
            template(v-if="col.show")
              template(v-if="col.type === 'category'")
                template(v-for="item in col.items")
                  th(
                    v-if="item.show"
                    :class="['sort-head', { 'bg-dark text-white': curSort.col === item }]"
                    @click="sort(item)"
                  )
                    | {{ item.name }}
                    span(v-if="curSort.col !== item") ⥮
                    span(v-else-if="curSort.inc") ↑
                    span(v-else) ↓
              template(v-else-if="col.type === 'minmax'")
                th.sort-Head(
                  :class="['sort-head', { 'bg-dark text-white': curSort.col === col }]"
                  @click="sort(col, true)"
                ) Min
                th.sort-Head(
                  :class="['sort-head', { 'bg-dark text-white': curSort.col === col }]"
                  @click="sort(col, false)"
                ) Max
      tbody.mt-3.text-center
        tr(v-for="chart in chartsPaged")
          template(v-for="col in cols")
            template(v-if="col.show")
              template(v-if="col.name === 'Character'")
                td(:class="col.valueClass || []" :style="`background-color: #${chart.char.color};`")
                  | {{ col.getValue(chart) }}
              template(v-else-if="col.name === 'Rhythm'")
                td(:class="col.valueClass || []")
                  span(v-for="(rhythm, ri) in chart.topRhythms.filter(x=>x.beats<6)")
                    br(v-if="ri")
                    | [{{ rhythm.beats || ' ' }}] {{ rhythm.pattern }} ({{ (rhythm.count/chart.rhyTotal*100).toFixed(0) }}%)
              template(v-else-if="col.name === 'DIFF' || col.name === 'Lv'")
                td(:class="[...(col.valueClass || []), { 'text-warning': curSort.col === col }, chart.char.id === 'other' ? 'other' : chart.diff.name.toLowerCase()]")
                  a.text-reset(:href="`chart.html?charId=${chart.char.id}&songId=${chart.song.id}&diff=${chart.diff.name}`" target="_blank") {{ col.name === 'DIFF' && chart.char.id === 'other' ? '?????' : col.getValue(chart) }}
              template(v-else-if="col.type === 'fixed' || col.type === 'sort'")
                td(:class="[...(col.valueClass || []), { 'text-warning': curSort.col === col, [chart.diff.name]: col.name === 'DIFF' || col.name === 'Lv' }]")
                  | {{ col.getValue(chart) }}
              template(v-else-if="col.type === 'category'")
                template(v-for="item in col.items")
                  td(v-if="item.show" :class="{ 'text-warning': curSort.col === item }")
                    | {{ item.getValue(chart) }}
              template(v-else-if="col.type === 'minmax'")
                td(v-if="curSort.col !== col && col.getValue(chart, true)===col.getValue(chart, false)" colspan="2")
                  | {{ col.getValue(chart, true ) }}
                template(v-else)
                  td(:class="{ dim: curSort.col === col && !curSort.inc, 'text-warning': curSort.col === col && curSort.inc }")
                    | {{ col.getValue(chart, true ) }}
                  td(:class="{ dim: curSort.col === col &&  curSort.inc, 'text-warning': curSort.col === col && !curSort.inc }")
                    | {{ col.getValue(chart, false) }}
    #cols.position-fixed.d-flex.flex-row
      #hover-tag.bg-light.text-dark.text-center
        svg.bi.bi-layout-text-window-reverse(width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg")
          path(fill-rule="evenodd" d="M2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm12-1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z")
          path(fill-rule="evenodd" d="M5 15V4H4v11h1zM.5 4h15V3H.5v1zM13 6.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zm0 3a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zm0 3a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5z")
      .content.form-group.flex-fill.bg-light.text-dark.p-2.pt-3.rounded-bottom
        .form-check.pb-2(v-for="col in cols")
          input(type="checkbox" :id="col.name" :value="col.name" v-model="col.show" @change="checkCategory(col)" :disabled="col.disabled")
          label(:for="col.name") {{ col.name }}
          template(v-if="col.type === 'category'")
            br
            .ml-4.form-check(v-for="item in col.items")
              input(type="checkbox" :id="item.name" :value="item.name" v-model="item.show" @change="checkCategory(item, col)")
              label(:for="item.name") {{ item.name }}
          template(v-if="col.filter")
            br
            select.ml-4(v-model="col.filter.filtered" @change="filtering" multiple)
              option(v-for="value in col.filter.list") {{ value }}
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, onMounted, ref } from '@nuxtjs/composition-api'

import songs from '@/assets/data/songsAnalyzed.json'

type Filter = {
  list: string[]
  filtered: string[]
  sort: boolean
}

type Column = {
  name: string
  show: boolean
} & ({
  type: 'sort'
  disabled?: boolean
  nameClass?: string[]
  valueClass?: string[]
  filter: Filter | null
  getValue: (e: any) => any
  sortKey: (e: any) => any
} | {
  type: 'fixed'
  disabled?: boolean
  nameClass?: string[]
  valueClass?: string[]
  filter: Filter | null
  getValue: (e: any) => any
} | {
  type: 'minmax'
  getValue: (e: any, minmax: 'min' | 'max') => string
  sortKey?: (e: any, minmax: 'min' | 'max') => string
} | {
  type: 'category'
  items: Column[]
})

export default defineComponent({
  setup() {

    const get = (e: any, minmax: 'min' | 'max') => {
      return e[minmax ? 'min' : 'max']
    }

    const numerifyString = (str: string) => {
      const num = parseInt(str)
      if (isNaN(num)) return 15 + str.charCodeAt(0)
      else return num
    }

    const charts = ref<any[]>([])
    const chartsDisp = ref<any[]>([])
    const chartsPaged = ref<any[]>([])
    const curNum = ref(20)
    const cols = ref<Column[]>([
      {	name: 'Character', type: 'fixed', show: true, disabled: true,
        filter: { list: [], filtered: [], sort: false },
        nameClass: ['char', 'st-th'], valueClass: ['char', 'st-td'],
        getValue: (e: any) => e.char.name },
      {	name: 'Song', type: 'sort', show: true, disabled: true,
        nameClass: ['song', 'st-th'], valueClass: ['song', 'st-td'],
        sortKey: (e: any) => e.sortIndex, getValue: (e: any) => e.song.name },
      {	name: 'Composer', type: 'fixed', show: false,
        nameClass: ['composer'], valueClass: ['composer'],
        getValue: (e: any) => e.song.composer },
      { name: 'DIFF', type: 'sort', show: true, disabled: true,
        filter: { list: [], filtered: [], sort: true },
        nameClass: ['diff', 'st-th'], valueClass: ['text-uppercase', 'border-0', 'diff', 'st-td'],
        sortKey: (e: any) => e.diff.id, getValue: (e: any) => e.diff.name },
      { name: 'Lv', type: 'sort', show: true, disabled: true,
        filter: { list: [], filtered: [], sort: true },
        nameClass: ['lv', 'st-th'], valueClass: ['lv', 'border-0', 'st-td'],
        sortKey: (e: any) => numerifyString(e.Level), getValue: (e: any) => e.Level },
      { name: 'Number of', type: 'category', show: true, items: [
        { name: 'Page', type: 'sort', show: false,
          sortKey: (e: any) => e.numOf.page, getValue: (e: any) => e.numOf.page },
        { name: 'Tempo', type: 'sort', show: false,
          sortKey: (e: any) => e.numOf.tempo, getValue: (e: any) => e.numOf.tempo },
        { name: 'Event', type: 'sort', show: false,
          sortKey: (e: any) => e.numOf.event, getValue: (e: any) => e.numOf.event },
        { name: 'Note', type: 'sort', show: true,
          sortKey: (e: any) => e.numOf.note, getValue: (e: any) => e.numOf.note },
      ] },
      { name: 'Notes', type: 'category', show: false, items: [
        { name: 'Click', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[0], getValue: (e: any) => e.notes[0] },
        { name: 'Hold', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[1], getValue: (e: any) => e.notes[1] },
        { name: 'Long', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[2], getValue: (e: any) => e.notes[2] },
        { name: 'DragH', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[3], getValue: (e: any) => e.notes[3] },
        { name: 'Drag', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[4], getValue: (e: any) => e.notes[4] },
        { name: 'Flick', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[5], getValue: (e: any) => e.notes[5] },
        { name: 'CDragH', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[6], getValue: (e: any) => e.notes[6] },
        { name: 'CDrag', type: 'sort', show: false,
          sortKey: (e: any) => e.notes[7], getValue: (e: any) => e.notes[7] },
      ] },
      { name: 'Time', type: 'sort', show: true,
        sortKey: (e: any) => e.time, getValue: (e: any) => getTimeStr(e.time) },
      { name: 'BPM', type: 'minmax', show: false,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.tempo, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.tempo, minmax), 1) },
      { name: 'real BPM', type: 'minmax', show: true,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.absTempo, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.absTempo, minmax), 1) },
      { name: 'Scanline Speed', type: 'minmax', show: true,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.lineSpeed, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.lineSpeed, minmax), 1) },
      { name: 'Beats/Page', type: 'minmax', show: false,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.beats, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.beats, minmax), 2) },
      { name: 'Notes/Page', type: 'category', show: true, items: [
        { name: 'Max', type: 'sort', show: false,
          sortKey: (e: any) => e.notePerPage.max, getValue: (e: any) => e.notePerPage.max },
        { name: 'R.Max', type: 'sort', show: true,
          sortKey: (e: any) => e.notePerPage.rMax, getValue: (e: any) => e.notePerPage.rMax },
      ] },
      { name: 'Notes/Time', type: 'category', show: true, items: [
        { name: 'Max', type: 'sort', show: false,
          sortKey: (e: any) => e.notePerPage.densityMax,
          getValue: (e: any) => decimals(e.notePerPage.densityMax, 2) },
        { name: 'R.Max', type: 'sort', show: true,
          sortKey: (e: any) => e.notePerPage.rDensityMax,
          getValue: (e: any) => decimals(e.notePerPage.rDensityMax, 2) },
        { name: 'Avg', type: 'sort', show: false,
          sortKey: (e: any) => e.notePerPage.density,
          getValue: (e: any) => decimals(e.notePerPage.density, 2) },
        { name: 'R.Avg', type: 'sort', show: true,
          sortKey: (e: any) => e.notePerPage.rDensity,
          getValue: (e: any) => decimals(e.notePerPage.rDensity, 2) },
      ] },
      { name: 'Hold Beat', type: 'minmax', show: false,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.holdBeat, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.holdBeat, minmax), 2) },
      { name: 'Hold Time (ms)', type: 'minmax', show: false,
        sortKey: (e: any, minmax: 'min' | 'max') => get(e.holdTime, minmax),
        getValue: (e: any, minmax: 'min' | 'max') => decimals(get(e.holdTime, minmax) / 1000000, 2) },
      { name: 'Max Siblings', type: 'sort', show: false,
        sortKey: (e: any) => e.maxSibling, getValue: (e: any) => e.maxSibling },
      { name: 'Max Finger', type: 'sort', show: true,
        sortKey: (e: any) => e.maxFinger, getValue: (e: any) => e.maxFinger },
      { name: 'Rhythm', type: 'fixed', show: true,
        valueClass: ['text-left', 'text-monospace'],
        getValue: (e: any) => e.topRhythms },
    ] as Column[])
    const curSort = ref<any>({ col: {}, inc: true })

    const decimals = (num: number, dec: number) => num.toFixed(dec)
    const getTimeStr = (us: number) => {
      let sec = us / 1000000
      let m = Math.floor(sec / 60)
      let s = ('00' + (sec % 60).toFixed(2)).slice(-5)
      return `${m}:${s}`
    }
    const sort = (col: any, incr?: boolean) => {
      if (col.type === 'sort' || col.type === 'minmax') {
        console.log('sorting')
        let inc: boolean, key: any
        if (incr !== undefined) inc = incr
        else if (curSort.value.col === col) inc = !curSort.value.inc
        else inc = true
        curSort.value.col = col
        curSort.value.inc = inc
        key = (e: any) => col.sortKey(e, inc)
        chartsDisp.value = chartsDisp.value.slice().sort((a, b) => {
          return inc ? (key(a) - key(b)) : (key(b) - key(a))
        })
        chartsPaged.value = chartsDisp.value.slice(0, 20)
        curNum.value = chartsPaged.value.length
      }
    }
    const checkCategory = (col: any, parent: any) => {
      if (col.type === 'category')
        col.items.forEach((x: any) => x.show = col.show)
      else if (parent &&  col.show)
        parent.show = true
      else if (parent && !col.show && !parent.items.filter((x: any) => x.show).length)
        parent.show = false
    }
    const unique = (arr: any[]) => {
      return [...new Set(arr)]
    }
    const filtering = () => {
      chartsDisp.value = charts.value.filter(chart => {
        let outerFlag = true
        cols.value.forEach(col => {
          if (col.type !== 'sort' && col.type !== 'fixed') return
          if (!col.filter) return
          let flag = false
          col.filter.filtered?.forEach(f => {
            // use == instead of === because filtered values are strings instead of number
            // eslint-disable-next-line eqeqeq, eqeqeq-fix/eqeqeq
            if (col.getValue(chart) == f) flag = true
          })
          if (!flag) outerFlag = false
        })
        return outerFlag
      })
      sort(curSort.value.col, curSort.value.inc)
      chartsPaged.value = chartsDisp.value.slice(0, 20)
    }
    const handleScroll = (_e: any) => {
      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight &&
      curNum.value < chartsDisp.value.length) {
        console.log('add')
        chartsPaged.value = chartsPaged.value.concat(chartsDisp.value.slice(curNum.value, curNum.value + 10))
        curNum.value = chartsPaged.value.length
      }
    }

    onMounted(() => {
      charts.value = songs
      chartsDisp.value = charts.value.slice()
      curSort.value.col = cols.value[1]
      cols.value
        .forEach(col => {
          if (col.type !== 'sort' && col.type !== 'fixed') return
          if (!col.filter) return
          col.filter.list = unique(charts.value.map(col.getValue))
          if (col.filter.sort)
            col.filter.list = col.filter.list.sort((a, b) => {
              return numerifyString(a) - numerifyString(b)
            })
          col.filter.filtered = col.filter.list.slice()
        })
      chartsPaged.value = chartsDisp.value.slice(0, 20)
      curNum.value = chartsPaged.value.length
      window.addEventListener('scroll', handleScroll)
    })

    return {
      charts,
      chartsDisp,
      chartsPaged,
      curNum,
      cols,
      curSort,
      decimals,
      getTimeStr,
      sort,
      checkCategory,
      unique,
      filtering,
      handleScroll,
    }
  },
})
</script>

<style lang="sass" scoped>
@import '@/assets/styles/level.sass'

#main
  margin-top: 0rem
  margin-bottom: 3em
  width: max-content
table th, table td
  vertical-align: middle!important
tbody
  border-top: none!important
.table-fix-head
  & > thead
    & > tr
      & > th
        position: sticky
        border: #999999 1px solid
      &:first-child
        height: 3em
        & > th
          top: 5rem
      &:nth-child(2)
        & > th
          top: calc(5rem + 3em + 1px)
.st-th
  z-index: 10
.st-td
  position: sticky
  z-index: 5
  background-color: #333333
.char
  left: 0
  width: 110px
.song
  left: 110px
  width: 200px
.composer
  width: 200px
.diff
  left: 310px
  width: 80px
.lv
  left: 390px
.sort-head
  &:hover
    background-color: #AAAAAA!important
  &:active
    background-color: #777777!important
.dim
  color: #FFFFFF30
#bottom
  font-size: 0.8em
  background-color: #00000099
#index
  font-size: 1em
  right: 1.5em
  bottom: 4em
  z-index: 1500
#alert
  font-size: 6vw
  top: 10vw
  right: 10vw
  max-width: 80vw
  z-index: 1500
  & > .close
    font-size: 16vw
    top: 0
    right: .2em
#cols
  top: 5rem
  right: -200px
  width: calc(200px + 4em)
  height: 75vh
  filter: drop-shadow(0 0 10px #000000)
  transition: right 500ms
  z-index: 1000
  & > .content
    overflow-y: scroll
  select
    width: -webkit-fill-available
  &:hover
    right: 0
#hover-tag
  width: 4em
  height: 4em
  line-height: 3em
  border-bottom-left-radius: 4em
  svg
    transform: translate(.5em, 0)

</style>
