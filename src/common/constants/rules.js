import errorMessages from "./error-messages"

export default Object.freeze({
  FIELD_REQUIRED: val => !!val || errorMessages.REQUIRED,
  ENGLISH_ALPHABET: val => (val && /^[A-Za-z0-9!@#$%^&*\\(\\)\-_=+:;"',.\\/? ]+$/.test(val)) || errorMessages.INPUT_CHARACTER("English alphabet"),
  MAX_CHARACTER: (max) => {
    return val => val && val.length <= max || errorMessages.MAX_CHARACTER(max)
  },
  FILE_SIZE: (size) => {
    return val => (val && val.size < size ) || errorMessages.FILE_SIZE(size)
  }
})
