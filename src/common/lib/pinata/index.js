import pinataSDK from "@pinata/sdk"
import NodeFormData from "form-data"
import { Readable } from "stream"

export default function uploadFile (val) {

  const pinataApiKey = process.env.VUE_APP_PINATA_API_KEY
  const pinataSecretApiKey = process.env.VUE_APP_PINATA_API_SECRET_KEY

  const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey)
  const options = {
    pinataMetadata: {
      name: `${val.title}`
    },
    pinataOptions: {
      cidVersion: 0
    }
  }
  
  return new Promise((res, rej) => {
    const readable = new Readable()

    const reader = val.file
      .stream()
      .getReader()
      
    reader.read().then(function processBlob({ done, chunk }) {
      if (done) {
        readable.push(chunk)
        readable.push(null)
        return
      }
  
      readable.push(chunk)
  
      return reader.read().then(processBlob)
    })
    
    // const file = stream.Readable(val.file)
    console.log((val.file), "<<<<")
    console.log("readable file ------> ", readable)
    

    const data = new NodeFormData()
    data.append("file", readable)
    console.log(data)



    if (!(readable instanceof Readable)) {
      rej(new Error("readStream is not a readable stream"))
    }

    console.log("???")

    if (options) {
      if (options.pinataMetadata) {
        if (options.pinataMetadata.name) {
          console.log("Name", options.pinataMetadata.name)
          if (!(typeof options.pinataMetadata.name === "string" || options.pinataMetadata.name instanceof String)) {
            rej(new Error("metadata name must be of type string"))
          }

          if (options.pinataMetadata.keyvalues) {
            console.log("emang masuk sini ?", options.pinataMetadata.keyvalues);
            if (!(typeof options.pinataMetadata.keyvalues === "object")) {
              rej(new Error("metatadata keyvalues must be an object"))
            }
            let i = 0
  
            Object.entries(options.pinataMetadata.keyvalues).forEach(function (keyValue) {
              if (i > 9) {
                rej(new Error("No more than 10 keyvalues can be provided for metadata entries"))
              }
              //  we want to make sure that the input is a string, a boolean, or a number, so we don"t get an object passed in by accident
              if (!(typeof keyValue[1] === "string" || typeof keyValue[1] === "boolean" || !isNaN(keyValue[1]))) {
                rej(new Error("Metadata keyvalue values must be strings, booleans, or numbers"))
              }
              i++
            })
          }
        }
        data.append("pinataMetadata", JSON.stringify(options.pinataMetadata))
      }

      console.log("data ==>", data)

      if (options.pinataOptions) {

        if (typeof options.pinataOptions !== "object") {
          rej(new Error("options must be an object"))
        }

        if (options.pinataOptions.cidVersion) {
          // eslint-disable-next-line eqeqeq
          if (options.pinataOptions.cidVersion != 0 && options.pinataOptions.cidVersion != 1) {
            rej(new Error("unsupported or invalid cidVersion"))
          }
        }

        if (options.pinataOptions.wrapWithDirectory) {
          // eslint-disable-next-line eqeqeq
          if (options.pinataOptions.wrapWithDirectory !== true && options.pinataOptions.wrapWithDirectory !== false) {
            rej(new Error("wrapWithDirectory must be a boolean value of true or false"))
          }
        }

        data.append("pinataOptions", JSON.stringify(options.pinataOptions))
        
      }
    }

  
    pinata.testAuthentication().then((result) => {
      //handle successful authentication here
      console.log(result)
    }).catch((err) => {
      //handle error here
      console.log(err)
    })
    
    // pinata.pinFileToIPFS(data).then((result) => {
    pinata.pinFileToIPFS(readable, options).then((result) => {
      //handle results here
      res(result)
      console.log("result", result)
    }).catch((err) => {
      //handle error here
      console.log("error pinata")
      console.log(err)
    })

  })

}


