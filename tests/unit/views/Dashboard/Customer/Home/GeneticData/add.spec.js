import { createLocalVue, shallowMount, config } from "@vue/test-utils"
import AddGeneticData from "@/views/Dashboard/Customer/Home/GeneticData/Add"
import Vuex from "vuex"
import Vuetify from "vuetify"

config.stubs["ui-debio-file"] = { template: "<div></div>" }
config.stubs["ui-debio-input"] = { template: "<div></div>" }
config.stubs["ui-debio-textarea"] = { template: "<div></div>" }

describe("Genetic Analysis List", () => {
  let container
  let localVue = null

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.use(Vuetify)
  })

  afterEach(() => {
    localVue = null
  })

  it("Should render", () => {
    AddGeneticData.methods = {
      initialDataKey: jest.fn(), 
      getTxWeight: jest.fn(), 
      getDetails: jest.fn(), 
    };
    AddGeneticData.mixins = [];
    container = shallowMount(AddGeneticData, {
      localVue,
      vuetify: new Vuetify(),
      $route: {
        params: {
            id: "ID"
        }
      },
      store: new Vuex.Store({
        state: {
          substrate: {
            api: "API",
            wallet: "WALLET",
            mnemonicData: "oil spend nation obey lecture behave lake diary reward forest gym apple"
          },
          auth: {
            loadingData: "LOADING"
          },
          metamask: {
            web3: "WEB3"
          }
        }
      })
    })

    expect(container.exists()).toBe(true)
  })
})
