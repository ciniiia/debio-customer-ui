<template lang="pug">
  .no-data-card
    .no-data-card__illustration
      ui-debio-icon(
        :icon="emptyDataIllustration"
        size=274
        view-box="10 0 245 175"
        fill
      )

    .no-data-card__alert Oops! Looks like you haven't submitted any genetic data!
    .no-data-card__message You can add your genetic data by clicking the "Add Genetic Data" button.

    .no-data-card__button
      Button(
        color="secondary" 
        width=255
        @click="goToAddPage"
      ) Add Genetic Data


</template>


<script>
import { emptyDataIllustration } from "@/common/icons"
import Button from "@/common/components/Button"



export default {
  name: "NoDataCard",

  data: () => ({
    emptyDataIllustration
  }),

  components: { Button },

  methods: {
    goToAddPage() {
      this.$router.push({ name: "customer-add-genetic-data" })
    }
  }
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .no-data-card
    &__illustration
      display: flex
      flex-direction: column
      align-items: center
      margin-top: 15px

    &__alert
      display: flex
      flex-direction: column
      align-items: center
      letter-spacing: -0.0075em
      @include button-2

    &__message
      display: flex
      flex-direction: column
      align-items: center
      letter-spacing: -0.004em
      margin-top: 14px
      @include body-text-3

    &__button
      display: flex
      flex-direction: row
      justify-content: center
      align-items: center
      padding: 5px 17px
      margin-top: 30px
      

</style>
