<template lang="pug">
  ui-debio-card(block)
    .second-opinion-banner
      .second-opinion-banner__content
        .second-opinion-banner__title DeBio Second Opinion
        .second-opinion-banner__sub-title Use your uploaded PHR to get second opinion

      v-img(
        alt="no-list-data"
        src="@/assets/second-opinion-banner.svg"
        max-width="630px"
        max-height="132px"
      )
</template>

<script>

export default {
  name: "SecondOpinionBanner"
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .second-opinion-banner
    margin: -25px
    display: flex
    justify-content: space-between

    &__content
      width: 559px

    &__title
      margin: 32px 0px 8px 24px
      @include title-reg

    &__sub-title
      margin-left: 24px
      @include body-text-3-opensans

</style>
