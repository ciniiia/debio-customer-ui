<template lang="pug">
  .request-second-opinion
    .request-second-opinion__content
      Description.request-second-opinion__card(v-if="isDescribing"  @click="onSubmit")
      GrantAccessPHR.request-second-opinion__card(v-if="isGrantingAccess" @back="toDescribeCard")


    .request-second-opinion__nav-cards
      v-card.request-second-opinion__nav-card
        .request-second-opinion__nav-card-title Complete two steps to request medical opinion
        .request-second-opinion__nav-card-title Step {{ step }}
        .request-second-opinion__nav-card-text {{ stepper[step] }}
        
        .request-second-opinion__step-wrapper
          .request-second-opinion__step-box(:class="{'request-second-opinion__step-box-selected': step === 1 || step === 2}")
          .request-second-opinion__step-box(:class="{'request-second-opinion__step-box-selected': step === 2}")


      v-card.request-second-opinion__nav-card
        .request-second-opinion__nav-card-title Help Desk
        .request-second-opinion__nav-card-text Our team is ready to answer all your questions about our program. What are you waiting for? 
          a  click here


</template>

<script>
import Description from "./Description"
import GrantAccessPHR from "./GrantAccessPHR"


export default {
  name: "RequestPage",

  data: () => ({
    isDescribing: true,
    isGrantingAccess: false,
    dataRequest: null,
    stepper: {
      1: "Describe your symptom by choosing what category it falls under, whether mental or physical.",
      2: "Grant access to your personal health record for review by a health professional to provide you with a better secondary opinion solution."
    },
    step: 1
  }),


  components: { Description, GrantAccessPHR },


  methods: {
    onSubmit(val) {
      this.dataRequest = val
      this.isDescribing = false
      this.step = 2
      this.isGrantingAccess = true
    },

    toDescribeCard() {
      this.isGrantingAccess = false
      this.step = 1
      this.isDescribing = true
    }
  }

}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .request-second-opinion
    display: flex
    justify-content: space-between

    &__content
      padding: 10px

    &__card
      width: 829px
      padding: 24px 

    &__nav-card
      width: 267px
      padding: 10px
      margin: 10px 20px 24px 10px

    &__nav-card-title
      margin-bottom: 5px
      @include button-2

    &__nav-card-text
      @include new-body-text-2

    &__step-wrapper
      padding: 16px 0 0  0
      display: flex
      gap: 12px

    &__step-box
      height: 8px
      width: 162px
      background: #E0E0E0
    
    &__step-box-selected
      background: #FFC4F9

</style>
