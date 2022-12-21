<template lang="pug">
  v-card.grant-access-card

    ui-debio-modal(
      :show="showModal"
      title="Add PHR File"
      cta-title="Submit"
      :cta-action="handleNewFile"
      :cta-outlined="false"
      @onClose="onCloseModalDocument"
    )
      ui-debio-input(
        :error="isDirty.document && isDirty.document.title"
        :rules="$options.rules.document.title"
        variant="small"
        label="Document Title"
        placeholder="Add Title"
        v-model="document.title"
        outlined
        block
        validate-on-blur
        @isError="handleError"
      )
      ui-debio-textarea(
        :error="isDirty.document && isDirty.document.description"
        :rules="$options.rules.document.description"
        variant="small"
        label="Description"
        placeholder="Add Description"
        v-model="document.description"
        validate-on-blur
        outlined
        block
        @isError="handleError"
      )
      ui-debio-file(
        v-model="document.file"
        :error="isDirty.document && isDirty.document.file"
        :rules="$options.rules.document.file"
        variant="small"
        accept=".pdf"
        label-rules="(.pdf - Maximum file size is 2 MB)"
        label="File input"
        :clearFile="clearFile"
        @isError="handleError"
        validate-on-blur
      )

    .grant-access-card__title(v-if="!isAddNewPHR") Select the Personal Health Records you want to give access to the Health Professionals. (you can select more than one)
    .grant-access-card__title(v-if="isAddNewPHR") Granted Access Personal Health Record

    v-divider.my-5

    template(v-if="!isAddNewPHR")
      ui-debio-data-table(
        :headers="headers"
        :loading="isLoading"
        :items="phrList"
      )

        template(v-slot:[`item.title`]="{ item }")
          .d-flex.flex-row
            v-checkbox.grant-access-card__checkbox(
              v-model="grantedAccess"
              :label="item.title"
              :value="item"
              color="primary"
              hide-details
            )

        template(v-slot:[`item.category`]="{ item }")
          .d-flex.flex-column
            span.grant-access-card__document-category(:title="item.category") {{ item.category }}

        template(v-slot:[`item.documentTitle`]="{ item }")
          .d-flex.flex-column
            span.grant-access-card__file-title(v-for="(file, idx) in item.files" :title="file.title")  {{ file.title }}

        template(v-slot:[`item.documentDescription`]="{ item }")
          .d-flex.flex-column.grant-access-card__file-descriptions
            span.grant-access-card__file-description(v-for="(file, idx) in item.files" :title="file.description") {{ file.description }}

      .grant-access-card__nav
        span The PHR you are looking for is not on the list? 
          a(@click="isAddNewPHR = true") +Add New PHR

      .grant-access-card__buttons
        ui-debio-button.grant-access-card__button(
          width="100px"
          block
          color="secondary"
          outlined
          @click="getBack"
        ) Back

        ui-debio-button.ml-5.grant-access-card__button(
          width="100px"
          block
          color="secondary"
        ) Next

    template(v-if="isAddNewPHR")
      .grant-access-card__nav-button(@click="handleBack")
        v-icon.grant-access-card__nav-icon mdi-chevron-left

      .grant-access-card__form-title Upload Personal Health Records
      .grant-access-card__forms
        ui-debio-input(
          :rules="$options.rules.phr.title"
          variant="small"
          label="PHR Title"
          :error="isDirty.phr && isDirty.phr.title"
          placeholder="Type PHR Title"
          v-model="phr.title"
          outlined
          block
          validate-on-blur
          @isError="handleError"
        )

        ui-debio-dropdown(
          :items="categories"
          :error="isDirty.phr && isDirty.phr.category"
          :rules="$options.rules.phr.category"
          variant="small"
          label="PHR Category"
          placeholder="Select PHR Category"
          v-model="phr.category"
          item-text="category"
          item-value="category"
          outlined
          close-on-select
          validate-on-blur
          block
          @isError="handleError"
        )

        ui-debio-button.secondary--text(
          color="secondary"
          height="2.5rem"
          block
          outlined
          @click="handleAddFile"
        ) Add file

        .grant-access-card__files
          .grant-access-card__files-title
            p {{ computeFiles.length ? "Uploaded Files" : "File Information" }}
            p(v-if="!computeFiles.length") Before uploading the document make sure to censored the KYC related in uploaded file

        .grant-access-card__files-items
          .grant-access-card__file-item.grant-access-card__file-item--no-file.d-flex.align-center(
            :class="{ 'grant-access-card__file-item--error': fileEmpty }"
            v-if="!computeFiles.length"
            @click="showModal = true"
          )
            .grant-access-card__file-details.mt-0
                .grant-access-card__file-details--left
                  ui-debio-icon.grant-access-card__file-icon(
                    :icon="fileTextIcon"
                    size="28"
                    color="#D3C9D1"
                    fill
                  )
                  .grant-access-card__file-name No File uploaded, Please add file to upload

          template(v-else)
            .grant-access-card__file-item(v-for="(item, idx) in computeFiles" :key="item.createdAt")
              ui-debio-modal.modal-confirm(
                :show="showModalConfirm === item.createdAt"
                title="Do you want to delete ?"
                @onClose="showModalConfirm = null"
              )
                span.modal-confirm__title By deleting this file, your file will not be uploaded
                .modal-confirm__cta.d-flex.justify-space-between(slot="cta")
                  ui-debio-button(
                    outlined
                    width="100"
                    color="secondary"
                    @click="showModalConfirm = null"
                  ) No
                  ui-debio-button(
                    width="100"
                    color="secondary"
                    @click="onDelete(item.createdAt)"
                  ) Yes
              
              .grant-access-card__file-title-add(:title="`Title: ${item.title}`") {{ item.title }}
                .grant-access-card__file-description-add(:title="`Description: ${item.description}`") {{ item.description }}
                .grant-access-card__file-details
                  .grant-access-card__file-details--left
                    ui-debio-icon.grant-access-card__file-icon(
                      :icon="fileTextIcon"
                      size="28"
                      color="#D3C9D1"
                      fill
                    )
                    .grant-access-card__file-name(v-if="item.file" :title="`File: ${item.file.name}`") {{ item.file.name }}

                  .grant-access-card__file-details--right
                    ui-debio-icon.grant-access-card__file-edit(
                      :icon="pencilIcon"
                      size="15"
                      color="#989898"
                      stroke
                      @click="onEdit(item)"
                    )
                    ui-debio-icon.grant-access-card__file-delete(
                      :icon="trashIcon"
                      size="15"
                      color="#989898"
                      fill
                      @click="showModalConfirm = item.createdAt"
                    )

        .d-flex.flex-column
          p.transaction-weight__info.d-flex.justify-space-between
            span.transaction-weight__text.mr-6.d-flex.align-center
              | Estimated transaction weight
              ui-debio-icon.ml-1(
                :icon="alertIcon"
                size="14"
                stroke
              )
              span.transaction-weight__tooltip Total fee paid in DBIO to execute this transaction.
            span {{ txWeight }}
          ui-debio-button.white--text(
            color="secondary"
            :loading="isLoading"
            height="2.5rem"
            @click="handleSubmit"
            block
          ) Submit
                    
  
</template>

<script>

import { mapState } from "vuex"
import { u8aToHex } from "@polkadot/util"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import cryptWorker from "@/common/lib/ipfs/crypt-worker"
import { getEMRCategories } from "@/common/lib/api"
import { registerElectronicMedicalRecord, registerElectronicMedicalRecordFee } from "@debionetwork/polkadot-provider"
import { queryElectronicMedicalRecordByOwnerId,  queryElectronicMedicalRecordFileById } from "@debionetwork/polkadot-provider"
import { generalDebounce } from "@/common/lib/utils"
import errorMessage from "@/common/constants/error-messages"
import { validateForms } from "@/common/lib/validate"
import { errorHandler } from "@/common/lib/error-handler"
import { uploadFile, getFileUrl } from "@/common/lib/pinata-proxy"
import { fileTextIcon, alertIcon, pencilIcon, trashIcon, eyeOffIcon, eyeIcon } from "@debionetwork/ui-icons"


const englishAlphabet = val => (val && /^[A-Za-z0-9!@#$%^&*\\(\\)\-_=+:;"',.\\/? ]+$/.test(val)) || errorMessage.INPUT_CHARACTER("English alphabet")

export default {
  name: "GrantAccessPHR",

  mixins: [validateForms],

  data: () => ({
    phrList: [],
    grantedAccess: [],
    isLoading: false,
    isAddNewPHR: false,
    showModal: false,
    fileEmpty: false,
    disabledButton: false,
    showModalConfirm: null,
    publicKey: null,
    secretKey: null,
    txWeight: null,
    error: null,
    clearFile: false,

    headers: [
      {
        text: "PHR Title",
        value: "title",
        sortable: true
      },
      {
        text: "Category",
        value: "category",
        sortable: true
      },
      {
        text: "Document Title",
        value: "documentTitle",
        sortable: true
      },
      {
        text: "Description",
        value: "documentDescription",
        sortable: true
      }
    ],
    phr: {
      title: "",
      category: "",
      files: []
    },
    document: {
      title: "",
      description: "",
      file: null
    },
    categories: [],
    fileTextIcon,
    pencilIcon,
    trashIcon,
    eyeOffIcon,
    alertIcon,
    eyeIcon
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      lastEventData: (state) => state.substrate.lastEventData,
      mnemonicData: (state) => state.substrate.mnemonicData,
      web3: (state) => state.metamask.web3,
      walletBalance: (state) => state.substrate.walletBalance
    }),

    computeFiles() {
      return this.phr.files.map(file => ({ ...file, percent: 0 })).reverse()
    },

    disabledDocumentForm() {
      return this.document.title === "" || this.document.description === "" || this.document.file === null
    },

    disabledFinish() {
      return this.computeFiles?.some(file => file.percent !== 100)
    }
  },

  async created() {
    this.fetchCategories()
    await this.getPHRHistory()
    if (this.mnemonicData) this.initialDataKey()
  },

  watch: {
    async lastEventData(event) {
      if (event !== null) {
        const dataEvent = JSON.parse(event.data.toString())
        if (event.method === "ElectronicMedicalRecordAdded") {
          if (dataEvent[1] === this.wallet.address) {
            this.resetState()
            this.isLoading = false
            this.isAddNewPHR = false
            this.grantedAccess = []
            await this.getPHRHistory()
          }
        }
      }
    },

    mnemonicData(val) {
      if (val) this.initialDataKey()
    },

    phr: {
      deep: true,
      immediate: true,
      handler: generalDebounce(async function (val) {
        this.txWeight = "Calculating..."

        const txWeight = await registerElectronicMedicalRecordFee(this.api, this.wallet, val)
        this.txWeight = `${Number(this.web3.utils.fromWei(String(txWeight.partialFee), "ether")).toFixed(4)} DBIO`
      }, 500)
    }
  },

  rules: {
    password: [ val => !!val || errorMessage.PASSWORD(8) ],
    phr: {
      title: [
        val => !!val || errorMessage.REQUIRED,
        val => val && val.length < 50 || errorMessage.MAX_CHARACTER(50),
        englishAlphabet
      ],
      category: [ val => !!val || errorMessage.REQUIRED ]
    },
    document: {
      title: [
        val => !!val || errorMessage.REQUIRED,
        val => val && val.length < 50 || errorMessage.MAX_CHARACTER(50),
        englishAlphabet
      ],
      description: [
        val => !!val || errorMessage.REQUIRED,
        val => val && val.length < 255 || errorMessage.MAX_CHARACTER(255),
        englishAlphabet
      ],
      file: [
        val => !!val || errorMessage.REQUIRED,
        val => (val && val.size < 2000000) || errorMessage.FILE_SIZE(2),
        val => (val && val.type === "application/pdf") || errorMessage.FILE_FORMAT("PDF")
      ]
    }
  },

  methods: {

    initialDataKey() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async fetchCategories() {
      this.categories = await getEMRCategories()
    },

    getBack() {
      this.$emit("back")
    },

    handleBack() {
      this.isAddNewPHR = false
    },

    handleAddFile() {
      this.showModal = true
      this.clearFile = false
    },

    onDelete(id) {
      this.showModalConfirm = null
      this.phr.files = this.phr.files.filter(file => file.createdAt !== id)
    },

    async getPHRHistory() {
      this.showModal = false
      this.isLoading = true
      const documents = []

      try {
        const dataPHR = await queryElectronicMedicalRecordByOwnerId(this.api, this.wallet.address)

        if (dataPHR !== null || !dataPHR?.length) {
          const listPHR = dataPHR.reduce((filtered, current) => {
            if (filtered.every(v => v.id !== current.id)) filtered.push(current)

            return filtered
          }, [])

          listPHR.reverse()

          for (const phrDetail of listPHR) {
            const documentDetail = await this.preparePHRData(phrDetail)
            documents.push(documentDetail)
          }
        }
 
        this.phrList = documents
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.error(error);
      }
    },

    async preparePHRData(dataPHR) {
      let files = []

      for (let i = 0; i < dataPHR.files?.length; i++) {
        const file = await queryElectronicMedicalRecordFileById(this.api, dataPHR.files[i])

        dataPHR.createdAt = new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })

        files.push({
          ...file,
          createdAt: new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          recordLink: file.recordLink
        })
      }

      return {
        id: dataPHR.id,
        title: dataPHR.title,
        category: dataPHR.category,
        createdAt: dataPHR.createdAt,
        files: files?.slice(0, 3)
      }
    },

    async finalSubmit() {
      this.isLoading = true
      this.disabledButton = true
      try {
        if (this.phr.files.length === 0) return

        for await (let [index, value] of this.phr.files.entries()) {
          const dataFile = await this.setupFileReader({ value })
          await this.upload({
            encryptedFileChunks: dataFile.chunks,
            fileName: dataFile.fileName,
            fileSize: dataFile.fileSize,
            index: index,
            fileType: dataFile.fileType
          })
        }

        await registerElectronicMedicalRecord(this.api, this.wallet, this.phr)
      } catch (e) {
        const error = await errorHandler(e.message)
        this.error = error
        this.isLoading = false
        this.disabledButton = false
      }
    },

    setupFileReader({ value }) {
      return new Promise((resolve, reject) => {
        const file = value.file
        const fr = new FileReader()

        fr.onload = async function () {
          resolve(value)
        }

        fr.onerror = reject

        fr.readAsArrayBuffer(file)
      })
    },

    handleNewFile() {
      if (Number(this.walletBalance) < Number(this.txWeight.split(" ")[0])) {
        this.error = {
          title: "Insufficient Balance",
          message: "Your transaction cannot succeed due to insufficient balance, check your account balance"
        }
        return
      }

      this._touchForms("document")
      const { title: docTitle, description: docDescription, file: docFile } = this.isDirty?.document
      if (docTitle || docDescription || docFile) return

      const context = this
      const fr = new FileReader()
      const { title, description, file } = this.document

      fr.onload = async function() {
        try {
          const encrypted = await context.encrypt({
            text: fr.result,
            fileType: file.type,
            fileSize: file.size,
            fileName: file.name
          })

          const { chunks, fileName, fileType, fileSize } = encrypted

          const dataFile = {
            title,
            description,
            file,
            chunks,
            fileName,
            fileSize,
            fileType,
            createdAt: new Date().getTime()
          }

          context.phr.files.push(dataFile)

        } catch(e) {
          this.error = e.message
        }
      }

      fr.readAsArrayBuffer(file)

      this.onCloseModalDocument()
    },

    async encrypt({ text, fileType, fileName, fileSize }) {
      const context = this
      const arrChunks = []
      let chunksAmount
      const pair = {
        secretKey: this.secretKey,
        publicKey: this.publicKey
      }

      const data = await new Promise((resolve, reject) => {
        try {
          cryptWorker.workerEncryptFile.postMessage({ pair, text, fileType }) // Access this object in e.data in worker
          cryptWorker.workerEncryptFile.onmessage = async (event) => {
            if (event.data.chunksAmount) {
              chunksAmount = event.data.chunksAmount
              return
            }

            arrChunks.push(event.data)
            context.encryptProgress = (arrChunks.length / chunksAmount) * 100

            if (arrChunks.length === chunksAmount) {
              resolve({
                fileName,
                fileSize,
                fileType,
                chunks: arrChunks
              })
            }
          }

          this.fileEmpty = false
        } catch (err) {
          reject(new Error(err.message))
        }
      })

      return data
    },

    async upload({ encryptedFileChunks, index, fileType, fileName, fileSize }) {
      const data = JSON.stringify(encryptedFileChunks)
      const blob = new Blob([data], { type: fileType })

      const result = await uploadFile({
        title: fileName,
        type: fileType,
        size: fileSize,
        file: blob
      })

      const link = getFileUrl(result.IpfsHash)

      this.phr.files[index].recordLink = link
    },

    onCloseModalDocument() {
      this.showModal = false
      Object.assign(this.document, { title: "", description: "", file: null })
      this.clearFile = true
      this._resetForms("document")
    },

    async handleSubmit() {
      if (Number(this.walletBalance) < Number(this.txWeight.split(" ")[0])) {
        this.error = {
          title: "Insufficient Balance",
          message: "Your transaction cannot succeed due to insufficient balance, check your account balance"
        }
        return
      }

      this._touchForms("phr")
      const isPHRValid = Object.values(this.isDirty?.phr).every(v => v !== null && v === false)
      const isDocumentValid = Object.values(this.isDirty?.document).every(v => v !== null && v === false)

      if (!isPHRValid || (!isDocumentValid && this.phr.files.length < 1)) {
        if (!this.phr.files.length) this.fileEmpty = true

        return
      }

      this.fileEmpty = false
      this.clearFile = true

      await this.finalSubmit()
    },

    resetState() {
      Object.assign(this.phr, { title: "", category: "", files: [] })
      Object.assign(this.document, { title: "", description: "", file: null })
    }
  }
}

</script>



<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .grant-access-card
    height: 100%
    padding: 20px

    &__title
      @include button-1

    &__nav      
      margin-top: 10px
      @include button-3
    
    &__buttons
      max-width: 140px
      display: flex
      float: right
      justify-content: space-between
      margin-right: 200px
      padding-bottom: 6%


    &__checkbox
      margin-top: -5px !important

    &__document-title,
    &__document-category,
    &__file-title,
    &__file-description
      max-width: 150px
      white-space: pre
      overflow: hidden
      text-overflow: ellipsis

    &__forms
      display: flex
      flex-direction: column
      gap: 20px
      margin: 0 auto
      max-width: 450px

    &__form-title
      margin-top: -24px
      text-align: center
      @include h6

    &__files
      margin: 10px 0 20px

    &__files-title
      margin-bottom: 24px

      p:first-of-type
        @include button-2

      p
        @include body-text-3-opensans

    &__files-items
      display: flex
      flex-direction: column
      gap: 20px
      padding-right: .35rem
      max-height: calc(116px * 3)
      overflow-y: auto
      margin-top: -50px !important

      &::-webkit-scrollbar-track
        background-color: #f2f2ff

      &::-webkit-scrollbar
        width: 0.25rem

      &::-webkit-scrollbar-thumb
        border-radius: 0.625rem
        background: #a1a1ff

        &__files-loading
      &::v-deep
        .ui-debio-modal__card
          max-width: 600px

    &__file-item
      padding: 12px 20px
      border-radius: 4px
      border-style: dashed 
      border-color: #8AC1FF
      background: #F9F9FF
      transition: all cubic-bezier(.7, -0.04, .61, 1.14) .3s

      &:hover
        background: #f2f2ff
        border-color: #a1a1ff

      &--no-file
        height: 64px

      &--error
        border-color: #c400a5

        &::v-deep
          .customer-create-phr__file-icon > svg
            color: #c400a5 !important

        .customer-create-phr__file-name
          color: #c400a5

    &__file-title-add
      font-weight: 600
      overflow: hidden
      white-space: nowrap
      text-overflow: ellipsis
      @include body-text-1

    &__file-name
      max-width: 320px
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis
      @include body-text-5

    &__file-description-add
      margin-top: 10px
      display: -webkit-box
      -webkit-line-clamp: 2
      -webkit-box-orient: vertical
      overflow: hidden
      color: #595959
      @include body-text-4

    &__file-details
      margin-top: 12px
      display: flex
      justify-content: space-between

      &--left,
      &--right
        display: flex
        align-items: center
        gap: 10px

    &__file-edit,
    &__file-delete
      cursor: pointer

    &::v-deep

      .ui-debio-modal__card-title
        @include h2
        font-weight: 700

  .modal-confirm
    &__title
      width: 212px
      text-align: center

    &__cta
      width: 250px
      margin: 0 auto

  .transaction-weight
    &__text
      position: relative

    &__tooltip
      max-width: 143px
      padding: 10px
      position: absolute
      top: 35px
      z-index: 10
      background: #fff
      border: 1px solid #D3C9D1
      right: -120px
      transition: all .3s ease-in-out
      visibility: hidden
      opacity: 0
      @include tiny-reg



  .modal-files-upload
    &__files
      display: flex
      flex-direction: column
      gap: 35px

    &__file-details
      display: flex
      align-items: center
      gap: 115px
      justify-content: space-between

    &__file-name
      max-width: 360px
      overflow: hidden
      text-overflow: ellipsis
      white-space: nowrap
      @include body-text-medium-2

    &__progress
      display: flex
      align-items: center
      justify-content: space-between
      gap: 15px
      margin-top: 8px

    &__status
      display: flex
      align-items: center
      gap: 8px

    &__file-percent,
    &__error-message
      @include body-text-5

    &__error-message
      color: #F5222D

    &__file-percent
      color: #8C8C8C

    &__progress-check
      width: 12px
      height: 12px
      border-radius: 50%

      &--success
        background: linear-gradient(225deg, #76DA92 0%, #61FFF6 100%)

      &--cancel
        background: #757274

      &--failed
        background: #FF525B

    &__progressbar
      width: 100%
      height: 6px
      background: #E7E7E7
      border-radius: 3px

      &--thumb
        width: 0%
        height: 100%
        background: #6FE4AF
        border-radius: inherit

</style>
