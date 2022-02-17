<template lang="pug">
  .layout-dashboard
    ui-debio-modal(
      :show="showModalPassword"
      title="Unlock Wallet"
      :icon="checkCircleIcon"
      :showCta="!success"
      :showTitle="!success"
      class="font-weight-bold"
      disable-dismiss
    )
      ui-debio-input(
        v-if="!success"
        :error="!!error"
        autofocus
        :errorMessages="!!error ? error.message : null"
        :rules="$options.rules.password"
        :type="showPassword ? 'text' : 'password'"
        variant="small"
        placeholder="Input Password"
        v-model="password"
        outlined
        block
        validate-on-blur
        @keyup.enter="handleSubmitPassword"
        @blur="error = null"
        @isError="handleError"
      )
        ui-debio-icon(
          slot="icon-append"
          role="button"
          size="18"
          @click="handleShowPassword"
          :icon="showPassword ? eyeIcon : eyeOffIcon"
          stroke
        )
      .modal-password__cta.d-flex.flex-column(slot="cta")
        .modal-password__cta.d-flex.align-center.justify-between
          Button.router-link.modal-password__cta-submit(
            color="secondary"
            width="130"
            :to="{ name: 'forgot-password' }"
            outlined
          ) Forgot Password

          Button.modal-password__cta-submit(
            color="secondary"
            width="130"
            @click="handleSubmitPassword"
          ) Submit
        
        .modal-password__cta.d-flex.align-center.justify-space-between
          div.modal-password__divider
          span.modal-password__cta-forgot OR
          div.modal-password__divider
          
        .modal-password__cta-change-account(
          @click="signOut"
        ) Not you? Try different account


    NavigationDrawer.layout-dashboard__sidebar(:items="computeNavs")
      template
        v-tooltip(top)
          template(v-slot:activator="{ on, attrs }")
            Button(
              outlined
              height="35px"
              style="font-size: 13px"
              @click="goToRequestTestPage"
              class="font-weight-bold sidebar-text mt-4 dg-raleway-font"
              color="primary"
              :bind="attrs"
              :on="on"
            ) Request Test
          span Get your biological sample tested or stake $DBIO to request Lab

        v-tooltip(bottom)
          template(v-slot:activator="{ on, attrs }")
            Button(
              outlined
              height="35px"
              style="font-size: 13px"
              @click="goToUploadEMR"
              class="font-weight-bold sidebar-text mt-4 dg-raleway-font"
              color="primary"
              :bind="attrs"
              :on="on"
            ) Upload EMR
          span Upload your Electronic Medical Record

        v-tooltip(bottom)
          template(v-slot:activator="{ on, attrs }")
            Button(
              style="font-size: 11px"
              outlined
              height="35px"
              @click="goToRequestAnalysis"
              class="font-weight-bold sidebar-text mt-4 dg-raleway-font"
              color="primary"
              :bind="attrs"
              :on="on"
            ) Request Genetic Analysis
          span Get your genetic data analyzed by Genetic Analyst

    .layout-dashboard__wrapper
      Navbar.layout-dashboard__navbar(:error="pageError" :notifications="localListNotification")
      .layout-dashboard__main
        transition(name="transition-slide-x" mode="out-in")
          maintenancePageLayout(v-if="pageError" :error="pageError")
          router-view(v-else @onPageError="handlePageError")
</template>

<script>
import {mapState, mapMutations, mapActions} from "vuex"
import store from "@/store"
import {validateForms} from "@/common/lib/validate"
import {
  gridIcon,
  boxIcon,
  eyeIcon,
  eyeOffIcon,
  databaseIcon,
  checkCircleIcon,
  fileTextIcon,
  creditCardIcon,
  geneticDnaIcon
} from "@/common/icons"

import NavigationDrawer from "@/common/components/NavigationDrawer"
import Navbar from "@/common/components/Navbar.vue"
import Button from "@/common/components/Button"
import maintenancePageLayout from "@/views/Dashboard/maintenancePageLayout"
import errorMessage from "@/common/constants/error-messages"
// import localStorage from "@/common/lib/local-storage"

export default {
  name: "MainPage",

  mixins: [validateForms],

  components: {NavigationDrawer, Navbar, Button, maintenancePageLayout},

  data: () => ({
    checkCircleIcon,
    eyeIcon,
    eyeOffIcon,

    showModalPassword: false,
    pageError: null,
    showPassword: false,
    success: false,
    error: null,
    password: null,

    navs: [
      { text: "Dashboard", disabled: false, active: false, route: "customer-dashboard", icon: gridIcon },
      { text: "My Test", disabled: false, active: false, route: "my-test", icon: boxIcon },
      { text: "My EMR", disabled: false, active: false, route: "customer-emr", icon: fileTextIcon },
      { text: "My Genetic Data", disabled: false, active: false, route: "customer-genetic-data", icon: geneticDnaIcon},
      { text: "Data Bounty", disabled: false, active: false, route: "customer-data-bounty", icon: databaseIcon },
      { text: "Payment History", disabled: false, active: false, route: "customer-payment-history", icon: creditCardIcon }
    ]
  }),

  computed: {
    ...mapState({
      lastEventData: (state) => state.substrate.lastEventData,
      wallet: (state) => state.substrate.wallet,
      localListNotification: (state) => state.substrate.localListNotification,
      mnemonicData: (state) => state.substrate.mnemonicData
    }),

    ...mapActions({
      clearAuth: "auth/clearAuth"
    }),

    computeNavs() {
      const setActive = (name) => {
        return this.$route.name === name || this.$route.meta.parent === name
      }

      return this.navs.map((nav) => ({...nav, active: setActive(nav.route)}))
    },

    computeButtonActive() {
      return !/(\/customer\/request-test)/.test(this.$route.path)
    }
  },

  watch: {
    $route() {
      this.pageError = null
    },

    lastEventData(event) {
      if (event !== null) {
        this.$store.dispatch("substrate/addListNotification", {
          address: this.wallet.address,
          event: event,
          role: "customer"
        })
      }
    }
  },

  async mounted() {
    if (!this.mnemonicData) this.showModalPassword = true
    await this.getListNotification()
  },

  rules: {
    password: [(val) => !!val || errorMessage.PASSWORD(8)]
  },

  methods: {
    ...mapMutations({
      clearWallet: "metamask/CLEAR_WALLET"
    }),

    handlePageError(error) {
      this.pageError = error
    },

    async getListNotification() {
      await this.$store.dispatch("substrate/getListNotification", {
        address: this.wallet.address,
        role: "customer"
      })
    },

    goToRequestTestPage() {
      this.$router.push({name: "customer-request-test"})
    },

    goToUploadEMR() {
      this.$router.push({name: "customer-emr-create"})
    },

    goToRequestAnalysis() {
      this.$router.push({ name: "customer-request-analysis"})
    },

    handleShowPassword() {
      this.showPassword = !this.showPassword
    },

    async handleSubmitPassword() {
      try {
        await this.wallet.unlock(this.password)
        await store.dispatch("substrate/getEncryptedAccountData", {
          password: this.password
        })

        this.success = true

        setTimeout(() => {
          this.showModalPassword = false
        }, 1300)
      } catch (e) {
        this.error = e
      }
    },

    signOut() {
      this.$router.push({name: "landing-page"})
      localStorage.clear()
      this.clearAuth()
      this.clearWallet()
    }
  }
}
</script>

<style lang="sass" scoped>
.layout-dashboard
  width: 100%
  min-height: 100vh
  background: #F5F7F9
  display: flex

  &__wrapper
    width: 70%
    flex: 1
    display: flex
    flex-direction: column

  &__navbar
    padding: 2.5rem 1.563rem 1.563rem !important

  &__main
    padding: 0 1.563rem 1.563rem !important

.modal-password
  &__cta
    gap: 20px
    align-items: center

  &__cta-forgot,
  &__cta-submit
    font-size: 10px

  &__cta-forgot,
  &__cta-change-account
    color: #5640A5 !important
    font-weight: bold
    text-transform: uppercase

  &__cta-change-account
    font-size: 12px
    cursor: pointer

  &__divider
    border-top: 1px solid #E9E9E9
    width: 110px


.transition-slide-x
  &-enter-active,
  &-leave-active
    transition: all cubic-bezier(.7, -0.04, .61, 1.14) .3s

  &-enter
    opacity: 0
    transform: translateX(1.563rem)

  &-leave-to
    opacity: 0
    transform: translateX(-12.813rem)
</style>
