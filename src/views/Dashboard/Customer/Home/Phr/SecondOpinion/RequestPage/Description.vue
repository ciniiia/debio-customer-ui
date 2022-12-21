<template lang="pug">
  v-card.request-second-opinion-card
    .request-second-opinion-card__title Describe your symptoms

    v-divider.my-5 

    label.text-label Select Category 

    v-radio-group.request-second-opinion-card__radio-input(
      v-model="category"
      row
    )
      v-radio(label="Physical Health" value="Physical Health")
      v-radio(label="Mental Health" value="Mental Health")

    ui-debio-textarea.request-second-opinion-card__text-area(
      variant="large"
      label="Describe your symptoms"
      placeholder="Describe how you feels..."
      v-model="description"
      validate-on-blur
      outlined
      block
    )

    .request-second-opinion-card__button
      ui-debio-button(
        width="160px"
        :disabled="disable"
        block
        color="secondary"
        @click="onSubmit"
      ) Next
  
</template>
  

<script>


export default {
  name: "Description",

  data: () => ({
    category: null,
    description: null
  }),

  computed: {
    disable() {
      return !this.category || !this.description
    }
  },


  methods: {
    onSubmit() {
      this.$emit("click", {category: this.category, description:this.description})
    }
  }


}
</script>



<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .request-second-opinion-card
    height: 540px
    &__title
      @include button-1

    &__radio-input
      padding: 5px

    &__text-area
      padding-bottom: 120px

    &__button
      float: right
</style>
