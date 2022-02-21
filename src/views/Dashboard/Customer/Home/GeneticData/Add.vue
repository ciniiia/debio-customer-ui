<template lang="pug">
  .genetic-data-add
    .genetic-data-add__wrapper
      .genetic-data-add__title {{ isEdit ? "Edit Genetic Data" : "Add Genetic Data"}} 
      .genetic-data-add__forms
        ui-debio-input(
          :rules="titleRule"
          v-model="document.title"
          variant="small"
          label="Title"
          placeholder="Add title"
          outlined 
          block 
          validate-on-blur
        )

        ui-debio-textarea(
          :rules="descriptionRule"
          v-model="document.description"
          variant="small"
          label="Description"
          placeholder="Add Description"
          outlined 
          block 
          validate-on-blur
        )

        ui-debio-file(
          v-model="document.file"
          variant="small"
          :rules="fileRule"
          :accept="['.txt', '.vcf', '.gz']"
          label="Upload File"
          placeholder="Choose File"
          validate-on-blur
        )
        .genetic-data-add__tx-weight
          span.genetic-data-add__tx-weight-text Estimated transaction weight 
            v-tooltip.visible(right)
              template(v-slot:activator="{ on, attrs }")
                v-icon.dialog-confirmation__trans-weight-icon(
                  style="font-size: 12px;"
                  color="primary"
                  dark
                  v-bind="attrs"
                  v-on="on"
                ) mdi-alert-circle-outline 
              span(style="font-size: 10px;") Total fee paid in DBIO to execute this transaction.

          span( style="font-size: 12px;" ) {{ Number(txWeight).toFixed(4) }} DBIO
          
        Button(
          :disabled="!disable"
          block
          color="secondary"
          @click="onSubmit"
        ) Submit

      UploadingDialog(
        :show="isLoading"
      )

      SuccessDialog(
        :show="isSuccess"
        title="Success"
        @close="closeDialog"
      )


</template>

<script>
import { mapState } from "vuex"
import { u8aToHex } from "@polkadot/util"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import ipfsWorker from "@/common/lib/ipfs/ipfs-worker"
import cryptWorker from "@/common/lib/ipfs/crypt-worker"
import { queryGeneticDataById } from "@/common/lib/polkadot-provider/query/genetic-data"
import { addGeneticData, getAddGeneticDataFee, updateGeneticData } from "@/common/lib/polkadot-provider/command/genetic-data"
import Button from "@/common/components/Button"
import rulesHandler from "@/common/constants/rules"
import { validateForms } from "@/common/lib/validate"
import { checkCircleIcon } from "@/common/icons"
import SuccessDialog from "@/common/components/Dialog/SuccessDialog"
import UploadingDialog from "@/common/components/Dialog/UploadingDialog"


// import uploadFile from "@/common/lib/pinata"
// import IPFS from "ipfs-http-client"

export default {
  name: "AddGeneticData",
  
  components: { Button, SuccessDialog, UploadingDialog },

  mixins: [validateForms],

  data: () => ({
    secretKey: null,
    publicKey: null,
    document: {
      title: "",
      description: "",
      file: null
    },
    isEdit: false,
    isSuccess: false,
    checkCircleIcon,
    link: null,
    txWeight: 0,
    isLoading: false,
    dataId: null
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      lastEventData: (state) => state.substrate.lastEventData,
      web3: (state) => state.metamask.web3
    }),

    disable() {
      const { title, description, file } = this.document
      return !title, description, file
    },

    titleRule() {
      return[
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.ENGLISH_ALPHABET,
        rulesHandler.MAX_CHARACTER(50)
      ]
    },

    descriptionRule() {
      return[
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.ENGLISH_ALPHABET,
        rulesHandler.MAX_CHARACTER(255)
      ]
    },

    fileRule() {
      return[
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.FILE_SIZE(1000000000)
      ]
    }
  },

  async created() {
    if (this.mnemonicData) this.initialDataKey()
  },

  async mounted () {

    if (this.$route.params.id) {
      this.isEdit = true
      this.dataId = this.$route.params.id
    }

    await this.getTxWeight()
    await this.getDetails()

  },

  watch: {
    mnemonicData(val) {
      if (val) this.initialDataKey()
    },

    lastEventData(e) {
      if (e !== null) {
        const dataEvent = JSON.parse(e.data.toString())
        if (e.method === "GeneticDataAdded" || e.method === "GeneticDataUpdated") {
          if (dataEvent[1] === this.wallet.address) {
            this.isLoading = false
            this.isSuccess = true
          }
        }
      }
    }
  },

  methods: {

    async getDetails() {
      const detail = await queryGeneticDataById(this.api, this.dataId)
      this.document.title = detail.title
      this.document.description = detail.description
      this.document.file = detail.reportLink
    },

    initialDataKey() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))
      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async encrypt({ text, fileType, fileName}) {      
      const context = this
      const arrChunks = []
      let chunksAmount
      const pair = {
        secretKey: this.secretKey,
        publicKey: this.publicKey
      }

      return await new Promise((res, rej) => {
        try {
          cryptWorker.workerEncryptFile.postMessage({
            pair,
            text,
            fileType
          })

          cryptWorker.workerEncryptFile.onmessage = async (event) => {
            if (event.data.chunksAmount) {
              chunksAmount = event.data.chunksAmount
              return
            }

            arrChunks.push(event.data)
            context.encryptProgress = (arrChunks.length / chunksAmount) * 100

            if (arrChunks.length === chunksAmount ) {
              res({
                fileName: fileName,
                chunks: arrChunks,
                fileType: fileType
              })
            }
          }
        } catch (e) {
          rej(new Error(e.message))
        }
      })

    },


    setupFileReader(value) {
      return new Promise((res, rej) => {
        const context = this
        const fr = new FileReader()

        const { title, description, file } = value
        
        fr.onload = async function () {
          try {
            const encrypted = await context.encrypt({
              text: fr.result,
              fileType: file.type,
              fileName: file.name
            })

            const { chunks, fileName, fileType } = encrypted
            const dataFile = { 
              title,
              description,
              file,
              chunks,
              fileName,
              fileType,
              createdAt: new Date().getTime()
            }
            res(dataFile)
          } catch (e) {
            console.error(e)
          }          
        }
        fr.onerror = rej
        fr.readAsArrayBuffer(value.file)
      })
    },

    async upload({ encryptedFileChunks, fileName, fileType }) {
      const chunkSize = 30 * 1024 * 1024
      let offset = 0

      const data = JSON.stringify(encryptedFileChunks)
      const blob = new Blob([data], { type: fileType })
      const newBlobData = new File([blob], fileName)

      // UPLOAD TO PINATA API

      // if (data) {
      //   const test = await uploadFile({
      //     title: this.document.title,
      //     type: this.document.description,
      //     file: blob
      //   })

      //   console.log({test})
      //   return
      // }

      // // const data = encryptedFileChunks


      // console.log("************")
      // console.log(newBlobData)
      // console.log(newBlobData.size)
      // console.log("************")


      const uploaded = await new Promise((res, rej) => {
        try{
          const fileSize = newBlobData.size
          do {
            let chunk = newBlobData.slice(offset, chunkSize + offset)           
            ipfsWorker.workerUpload.postMessage({
              seed: chunk.seed,
              file: newBlobData
            })
            offset += chunkSize
          } while ((chunkSize + offset) < fileSize)

          let uploadSize = 0
          ipfsWorker.workerUpload.onmessage = async (event) => {
            uploadSize += event.data.data.size

            if (uploadSize >= fileSize) {
              res({
                fileName: fileName,
                fileType: fileType,
                collection: event.data
              })
            }
          }

        } catch(e) {
          rej(new Error(e.message))
        }
      })

      const link = this.getFileIpfsUrl(uploaded)
      this.link = link

    }, 

    getFileIpfsUrl(file) {
      const path = `${file.collection.data.ipfsFilePath}/${file.fileName}`
      return `https://ipfs.io/ipfs/${path}`
    },

    // async submit(dataFile) {
    //   this.isLoading = true

    //   if (!this.document.file) return

    //   console.log("---------------")
    //   console.log(IPFS)


    //   const file = this.document.file
    //   let ipfs = await IPFS({
    //     host: "https://api.pinata.cloud/psa",
    //     repo: "file-path" + Math.random()
    //   })

    //   console.log("ipfs", ipfs)


    //   const { cid } = await ipfs.add(file)
    //   const url = `https://ipfs.debio.network/ipfs/${cid.string}`
    //   console.log(url)
    // },

    async onSubmit() {
      this.isLoading = true

      try{
        if (!this.document.file) return

        const dataFile = await this.setupFileReader(this.document)

        await this.upload({
          encryptedFileChunks: dataFile.chunks,
          fileName: dataFile.fileName,
          fileType: dataFile.fileType
        })

        if (this.isEdit) {
          await updateGeneticData(
            this.api,
            this.wallet,
            this.dataId,
            this.document.title,
            this.document.description,
            this.link
          )
          
        } else {
          await addGeneticData(
            this.api, 
            this.wallet, 
            this.document.title, 
            this.document.description, 
            this.link)
        }


      } catch (e) {
        console.error(e)
      }
    },

    async getTxWeight() {
      const txWeight = await getAddGeneticDataFee(this.api, this.wallet, "title", "description", "link")
      this.txWeight = this.web3.utils.fromWei(String(txWeight.partialFee), "ether")
    },

    closeDialog() {
      this.isSuccess = false
      this.document.title = null
      this.document.description = null
      this.document.file = null
    }
  }
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .genetic-data-add
    width: 100%
    height: 100%

    &__wrapper
      background: #ffffff
      padding-top: 60px
      padding-bottom: 195px

    &__title
      text-align: center
      margin-bottom: 54px
      @include h6-opensans

    &__forms
      display: flex
      flex-direction: column
      gap: 20px
      margin: 0 auto
      max-width: 450px

    &__input
      height: 125px

    &__tx-weight
      display: flex
      justify-content: space-between

    &__tx-weight-text
      letter-spacing: -0.004em
      @include body-text-3-opensans


</style>
