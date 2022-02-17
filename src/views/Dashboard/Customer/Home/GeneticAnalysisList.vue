<template lang="pug">
  .genetic-analysis-list
    DataTable.genetic-analysis-list__table(
      :headers="headers"
      :items="items"
    )
      template(v-slot:[`item.action`]="{ item }")
        .genetic-analysis-list__actions
          ui-debio-icon.genetic-analysis-list__action(
            :icon="eyeIcon"
            size="16"
            role="button"
            stroke
            stroke-width="3"
          )
          ui-debio-icon.genetic-analysis-list__action(
            :icon="downloadIcon"
            :class="{ 'genetic-analysis-list__action--disabled': item.status !== 'Done' }"
            size="16"
            role="button"
            stroke
            stroke-width="3"
            @click="onDownload(item)"
          )
</template>

<script>
import { medicalResearchIllustration, downloadIcon, eyeIcon } from "@/common/icons"
import { downloadDecryptedFromIPFS } from "@/common/lib/ipfs"
import { u8aToHex } from "@polkadot/util"
import CryptoJS from "crypto-js"
import Kilt from "@kiltprotocol/sdk-js"
import DataTable from "@/common/components/DataTable"
import { mapState } from "vuex"

export default {
  name: "GeneticAnalysisList",
  components: { DataTable },

  data: () => ({
    medicalResearchIllustration,
    downloadIcon,
    eyeIcon,

    // TODO: Update headers and items to dynamic data from backend later
    publicKey: null,
    secretKey: null,
    headers: [
      { text: "Service Name", value: "name", sortable: true },
      { text: "Analyst Name", value: "analyst", sortable: true },
      { text: "Order Date", value: "createdAt", sortable: true },
      { text: "Last Update", value: "updatedAt", sortable: true },
      { text: "Status", value: "status", width: "115", sortable: true },
      {
        text: "Action",
        value: "action",
        sortable: false,
        align: "center"
      }
    ],
    items: [
      {
        name: "Genome Data",
        analyst: "Hildegard Einstein",
        createdAt: "28 Jan 2022",
        updatedAt: "29 Jan 2022",
        ipfsLink: "https://ipfs.io/ipfs/QmYaGRJSZV8FjjD9Bd7BAQ5KevCQfbG3mU4yb2PNQAr1Vh/A wonderful.pdf",
        status: "Inprogress"
      },
      {
        name: "Genotype",
        analyst: "Sarah Newton",
        createdAt: "28 Jan 2022",
        updatedAt: "29 Jan 2022",
        ipfsLink: "https://ipfs.io/ipfs/QmYaGRJSZV8FjjD9Bd7BAQ5KevCQfbG3mU4yb2PNQAr1Vh/A wonderful.pdf",
        status: "Done"
      },
      {
        name: "Ancestry DNA Data",
        analyst: "Jacky Colombus",
        createdAt: "28 Jan 2022",
        updatedAt: "29 Jan 2022",
        ipfsLink: "https://ipfs.io/ipfs/QmYaGRJSZV8FjjD9Bd7BAQ5KevCQfbG3mU4yb2PNQAr1Vh/A wonderful.pdf",
        status: "Done"
      },
      {
        name: "DCHGenome",
        analyst: "Azmi Galileo",
        createdAt: "28 Jan 2022",
        updatedAt: "29 Jan 2022",
        ipfsLink: "https://ipfs.io/ipfs/QmYaGRJSZV8FjjD9Bd7BAQ5KevCQfbG3mU4yb2PNQAr1Vh/A wonderful.pdf",
        status: "Done"
      },
      {
        name: "Ancestry DNA Data B",
        analyst: "Dr Octopus",
        createdAt: "28 Jan 2022",
        updatedAt: "29 Jan 2022",
        ipfsLink: "https://ipfs.io/ipfs/QmYaGRJSZV8FjjD9Bd7BAQ5KevCQfbG3mU4yb2PNQAr1Vh/A wonderful.pdf",
        status: "Open"
      }
    ]
  }),

  computed: {
    ...mapState({
      mnemonicData: (state) => state.substrate.mnemonicData
    })
  },

  watch: {
    mnemonicData(val) {
      if (val) this.initialData()
    }
  },

  async created() {
    if (this.mnemonicData) this.initialData()
  },

  methods: {
    async initialData() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async onDownload(item) {
      if (item.status !== "Done") return
      const fileName = item.ipfsLink.split("/").pop().replaceAll("%20", " ")
      const path = `${item.ipfsLink.split("/").slice(4, 5).join("")}/${fileName}`

      await downloadDecryptedFromIPFS(
        path,
        this.secretKey,
        this.publicKey,
        `[${item.name} - ${item.analyst}] • ${fileName}`,
        "application/pdf"
      )
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/functions.sass"

  .genetic-analysis-list

    &__actions
      display: flex
      justify-content: center
      align-items: center
      gap: toRem(16px)

    &__action--disabled
      cursor: not-allowed

      &::v-deep
        svg
          stroke: #C3C3C3
</style>
