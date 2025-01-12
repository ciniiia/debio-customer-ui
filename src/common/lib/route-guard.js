import localStorage from './local-storage'
import store from '@/store/index'

const routeGuard = {
  hasStatusLogin() {
    const keystore = localStorage.getAddress()
    return !!keystore
  },
  async checkIsLoggedIn(to, from, next) {
    const address = localStorage.getAddress();
    let api = store.getters['substrate/getAPI'];
    if (api == null) {
      await store.dispatch('substrate/connect', address);
    }

    let wallet = store.getters['substrate/wallet'];
    const keystore = localStorage.getAddress()
    const isLoggedIn = !!keystore;
    if (to.path == '/login') {
      if (isLoggedIn) {
        if (wallet == null) {
          if (address != "") {
            await store.dispatch('substrate/getAkun', {
              address: address
            })
          }
        }
        next('/')
        return address;
      } else {
        next()
        return ""
      }
    } else {
      if (isLoggedIn) {
        if (wallet == null) {
          if (address != "") {
            await store.dispatch('substrate/getAkun', {
              address: address
            })
          }
        }
        next()
        return address;
      } else {
        next('/login')
        return ""
      }
    }
  },
}

export default routeGuard