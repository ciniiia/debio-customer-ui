<template lang="pug">
  .payment-history-details
    ui-debio-modal(
      :show="!!messageError"
      :show-title="false"
      :show-cta="false"
      @onClose="$router.push({ name: 'customer-payment-history' })"
    )
      | {{ messageError }}

    .payment-history-details__wrapper
      ui-debio-card(block centered-content)
        .payment-details
          .payment-details__title {{ computeDetailsTitle }}
          .payment-details__order
            .order-section
              .order-detail
                span.order-detail__label Order ID
                .d-flex.align-baseline
                  p.order-detail__value(:title="payment.id") {{ payment.formated_id }}
                  ui-debio-icon.ml-2.mt-1(
                    role="button"
                    :icon="copyIcon"
                    stroke
                    size="16"
                    color="#5640A5"
                    title="Copy ID"
                    @click="handleCopy"
                  )
              .order-detail(v-if="payment.section === 'order'")
                span.order-detail__label Specimen Number
                p.order-detail__value(:title="payment.dna_sample_tracking_id") {{ payment.dna_sample_tracking_id.slice(0, 10) }}
              .order-detail
                span.order-detail__label Order Date
                p.order-detail__value {{ payment.created_at }}
              .order-detail
                span.order-detail__label Payment status
                p.order-detail__value(
                  :class="payment.status_class"
                ) {{ payment.status }}
              .order-detail
                span.order-detail__label Test Status
                p.order-detail__value(:class="payment.test_status_class") {{ payment.test_status || "-" }}

            .product-section
              div
                p.product-detail__title Service Provider
                .product-detail__provider {{ computeProviderName }}
              div
                p.product-detail__title Service Name
                .product-detail__provider {{ payment.service_info.name }}


          .payment-details__price
            .price
              h5.price__title Total Payment
              .price__detail
                .price__block
                  .price__label Paid Amount
                  .price__value.success--text
                    | {{ computeTotalPrices }}
                    | {{ formatUSDTE(payment.currency) }}
                .price__block
                  .price__label Service Price
                  .price__value
                    | {{ formatPrice(payment.prices[0].value, payment.currency) }}
                    | {{ formatUSDTE(payment.currency) }}
                .price__block(v-if="payment.section === 'order'")
                  .price__label QC Price
                  .price__value
                    | {{ payment.additional_prices.length ? formatPrice(payment.additional_prices[0].value, payment.currency) : "0" }}
                    | {{ formatUSDTE(payment.currency) }}

                hr.mb-4

                .price__block
                  .price__label Refund Amount
                  .price__value.primary--text
                    | {{ computeRefundedValue }}

                ui-debio-button.payment-details__etherscan-link(
                  color="secondary"
                  v-if="payment.section === 'order'"
                  @click="handleCTA"
                  :loading="isLoading"
                  :disabled="payment.status === 'Cancelled'"
                  outlined
                  block
                ) {{ payment.status === "Unpaid" ? "Pay" : "VIEW ON OCTOPUS EXPLORER" }}
</template>

<script>
import { copyIcon } from "@debionetwork/ui-icons"
import { getOrderDetail } from "@/common/lib/api"
import { getRatingService } from "@/common/lib/api"
import {
  queryDnaSamples,
  queryGeneticAnalysisByGeneticAnalysisTrackingId
} from "@debionetwork/polkadot-provider"
import { mapState } from "vuex"
import getEnv from "@/common/lib/utils/env"
import { formatUSDTE } from "@/common/lib/price-format.js"


// NOTE: Use anchor tag with "noreferrer noopener nofollow" for security
let timeout
const anchor = document.createElement("a")
anchor.target = "_blank"
anchor.rel = "noreferrer noopener nofollow"

export default {
  name: "CustomerPaymentDetails",

  data: () => ({
    copyIcon,
    messageError: null,
    rewardPopup: false,
    payment: {},
    txHash: null,
    formatUSDTE
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      rating: (state) => state.rating.rate,
      lastEventData: (state) => state.substrate.lastEventData,
      web3: (state) => state.metamask.web3
    }),

    computeProviderName() {
      return this.payment.section === "order"
        ? this.payment?.lab_info?.name ?? "Unknown Provider"
        : this.payment?.genetic_analyst_info?.name ?? "Unknown Provider"
    },

    computeDetailsTitle() {
      return this.payment?.status === "Paid"
        ? `[ ${this.payment?.status} Order ] - Thank you for your order`
        : `${this.payment?.status} Order`
    },

    hasPaymentDetails() {
      return Object.keys(this.payment)?.length
    },

    computeTotalPrices() {
      if (!this.payment?.additional_prices?.length) return this.formatPrice(this.payment?.prices[0].value, this.payment?.currency)
      return this.formatPrice(this.payment?.prices[0].value, this.payment?.currency) + this.formatPrice(this.payment?.additional_prices[0].value, this.payment?.currency)
    },

    computeRefundedValue() {
      return this.payment?.status === "Refunded"
        ? `${this.formatPrice(this.payment?.prices[0].value, this.payment?.currency)} ${this.payment?.currency}`
        : "-"
    }
  },

  beforeMount() {
    if (!this.$route.params.id) this.$router.push({ name: "customer-payment-history" })
  },

  async created() {
    await this.fetchDetails()
  },

  watch: {
    $route: {
      deep: true,
      immediate: true,
      handler: async function () {
        await this.fetchDetails()
      }
    },
    lastEventData: async function (e) {
      if (e.section === "geneticTesting" || e.section === "orders") await this.fetchDetails()
    }
  },

  methods: {
    async fetchDetails() {
      try {
        let data
        let rating
        let isNotGAOrders = false
        const dataPayment = await getOrderDetail(this.$route.params.id)
        this.txHash = dataPayment.blockMetaData.blockHash

        const classes = Object.freeze({
          PAID: "success--text",
          UNPAID: "warning--text",
          REFUNDED: "secondary--text",
          CANCELLED: "error--text",
          FULFILLED: "info--text",
          RESULTREADY: "success--text",
          INPROGRESS: "info--text",
          REGISTERED: "success--text",
          WETWORK: "secondary--text",
          REJECTED: "error--text",
          QUALITYCONTROLLED: "info--text"
        })

        const parseDate = (date) => {
          return new Date(parseInt(date.replaceAll(",", ""))).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        }

        if (Object.values(dataPayment).length) {
          if (!Object.hasOwnProperty.call(dataPayment, "genetic_analysis_tracking_id")) {
            try {
              isNotGAOrders = true
              rating = await getRatingService(dataPayment.service_id)
              data = await queryDnaSamples(this.api, dataPayment.dna_sample_tracking_id)
            } catch (error) {
              console.error(error)
            }

          } else {
            try {
              data = await queryGeneticAnalysisByGeneticAnalysisTrackingId(
                this.api,
                dataPayment.genetic_analysis_tracking_id
              )
            } catch (error) {
              console.error(error)
            }
          }

          this.payment = isNotGAOrders
            ? {
              ...dataPayment,
              section: "order",
              formated_id: `${dataPayment.id.substr(0, 3)}...${dataPayment.id.substr(dataPayment.id.length - 4)}`,
              test_status: data?.status.replace(/([A-Z]+)/g, " $1").trim(),
              test_status_class: classes[data?.status.toUpperCase()],
              rating,
              status_class: classes[dataPayment.status.toUpperCase()],
              created_at: parseDate(dataPayment.created_at)
            }
            : {
              ...dataPayment,
              formated_id: `${dataPayment.id.substr(0, 3)}...${dataPayment.id.substr(dataPayment.id.length - 4)}`,
              status_class: classes[dataPayment.status.toUpperCase()],
              test_status: data?.status.replace(/([A-Z]+)/g, " $1").trim(),
              test_status_class: classes[data?.status.toUpperCase()],
              genetic_analyst_info: {
                ...dataPayment.genetic_analyst_info,
                name: `${dataPayment.genetic_analyst_info.first_name} ${dataPayment.genetic_analyst_info.last_name}`
              },
              section: "orderGA",
              created_at: parseDate(dataPayment.created_at)
            }
        }
      } catch(e) {
        if (e.response.status === 404)
          this.messageError = "Oh no! We can't find your selected order. Please select another one"

        else this.messageError = "Something went wrong. Please try again later"
      }
    },

    async handleCopy() {
      await navigator.clipboard.writeText(this.payment?.id)
      this.payment.formated_id = "Copied!"

      clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.payment.formated_id = `${this.payment.id.slice(0, 3)}...${this.payment.id.slice(-4)}`
      }, 1000)
    },

    formatPrice(price, currency) {
      let unit
      currency === "USDT" || currency === "USDTE" ? unit = "mwei" : unit = "ether"
      const formatedPrice = this.web3.utils.fromWei(String(price.replaceAll(",", "")), unit)
      return parseFloat(formatedPrice)
    },

    async handleCTA() {
      if (this.payment?.status === "Unpaid") {
        this.$router.push({
          name: "customer-request-test-checkout",
          params: { id: this.$route.params.id }
        })

        return
      }

      anchor.href = `${getEnv("VUE_APP_OCTOPUS_EXPLORER")}/blocks/${this.txHash}`
      anchor.click()
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
  @import "@/common/styles/function.sass"

  .payment-history-details
    &__title
      margin-top: toRem(35px)

    &__content
      min-width: toRem(575px)
      max-width: toRem(800px)
      padding: toRem(30px)
      margin-top: toRem(60px)
      border: toRem(1px) solid #E9E9E9
      border-radius: toRem(4px)

    &::v-deep
      .ui-debio-card__body
        display: flex
        flex-direction: column
        align-items: center
        padding-bottom: toRem(100px)

  .payment-details
    width: toRem(815px)
    display: grid
    grid-template-columns: repeat(3, 1fr)
    grid-template-rows: toRem(77px) minmax(308px, 1fr)
    grid-column-gap: 0px
    grid-row-gap: 0px

    &__title
      grid-area: 1 / 1 / 2 / 4
      display: flex
      align-items: center
      background: #F8FBFF
      padding: toRem(30px)
      @include body-text-medium-1

    &__order
      grid-area: 2 / 1 / 3 / 3
      border: solid toRem(1px) #E9E9E9
      border-top: 0
      border-right: 0

    &__price
      grid-area: 2 / 3 / 3 / 4

  .order-section
    width: 100%
    display: grid
    grid-template-columns: repeat(3, 1fr)
    padding: toRem(26px) toRem(30px)
    gap: toRem(20px) toRem(70px)

  .product-section
    display: grid
    grid-template-columns: 1fr 1.95fr

  .product-detail
    &__title
      background: #F8FBFF
      padding: 12px 30px
      @include body-text-medium-3

    &__provider
      padding: 12px 30px
      color: #595959
      @include button-2

  .order-detail
    height: max-content

    &__label
      color: #8C8C8C
      @include body-text-3

    &__value
      @include button-1

  .price
    height: 100%
    border: solid toRem(1px) #E9E9E9
    border-top: 0

    &__title
      padding: toRem(16px)
      border-bottom: solid toRem(1px) #E9E9E9
      @include button-2

    &__detail
      padding: toRem(16px)
      padding-bottom: toRem(24px)

    &__block
      display: flex
      justify-content: space-between
      margin-bottom: toRem(8px)

      &:last-of-type
        margin-bottom: toRem(50px)

    &__label,
    &__value
      @include button-2

    &__label
      color: #595959

  .product
    &__details
      width: calc(100% - toRem(175px))
      display: flex
      flex-direction: column
      gap: toRem(15px)

    &__name
      @include h3-opensans

    &__lab
      width: 100%
      display: flex
      align-items: center
      justify-content: space-between
      gap: toRem(80px)

    &__provider
      @include body-text-2
</style>
