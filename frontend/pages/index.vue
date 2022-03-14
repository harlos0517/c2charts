<template lang="pug">
  div
    #navbar.position-fixed.flex-row.middle-center.w-100.px-4
      NuxtLink#title.nav-item.h1.m-0.p-3.link-text-reset(to='/')
        | Cytus II Chart Viewer
      .flex-grow-1
      NuxtLink#analyze.nav-item.rounded-lg.p-3.link-text-reset(to='/statistics')
        | Statistics

      #report.nav-item.rounded-lg.p-3 Report
      b-popover(target="#report" triggers="click" placement="bottom")
        template(#title) Report issues and suggestions
        div
          a(href='https://github.com/DeemoHarlos/c2charts/issues/new') Github
          | &nbsp;|&nbsp;
          a(href='https://www.messenger.com/t/deemoharlos') Messenger

      #about.nav-item.rounded-lg.p-3 About
      b-popover(target="#about" triggers="click" placement="bottom")
        template(#title) Created by Deemo Harlos<br>UI/UX Designed by 雪糕蒂絲
        div
          | Deemo Harlos:
          br
          a(href='https://www.youtube.com/c/DeemoHarlos') YouTube
          | &nbsp;|&nbsp;
          a(href='https://twitter.com/deemo_harlos') Twitter
          br
          a(href='https://www.patreon.com/DeemoHarlos') Patreon Donation
          | &nbsp;|&nbsp;
          a(href='https://Ko-fi.com/deemoharlos') Ko-fi Donation
    #router
      NuxtChild
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    return {}
  },
})
</script>

<style lang="sass" scoped>
$navbar-height: 5rem

#navbar
  height: $navbar-height
  background-color: #424242
  z-index: 1000
  .nav-item:hover
    background-color: #FFFFFF20
  #report, #about
    cursor: pointer
#router
  padding-top: $navbar-height
</style>
