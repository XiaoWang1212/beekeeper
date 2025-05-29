export default {
  namespaced: true,
  
  state: {
    db: null,
    auth: null,
    currentUser: null,
    isLoading: false,
    error: null
  },
  
  getters: {
    isAuthenticated: state => !!state.currentUser,
    userId: state => state.currentUser ? state.currentUser.uid : null,
    userEmail: state => state.currentUser ? state.currentUser.email : null,
    displayName: state => state.currentUser ? (state.currentUser.displayName || state.currentUser.email) : null
  },
  
  mutations: {
    SET_DB(state, db) {
      state.db = db;
    },
    SET_AUTH(state, auth) {
      state.auth = auth;
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    // 設置 Firebase 實例
    setInstances({ commit }, { db, auth }) {
      commit('SET_DB', db);
      commit('SET_AUTH', auth);
    },
    
    // 設置當前用戶
    setCurrentUser({ commit }, user) {
      commit('SET_CURRENT_USER', user);
      // 如果用戶登入，保存到 localStorage 以便本地存取
      if (user) {
        localStorage.setItem('beekeeper_current_user', user.uid);
      } else {
        localStorage.removeItem('beekeeper_current_user');
      }
    },
    
    // 處理錯誤
    handleError({ commit }, error) {
      console.error('Firebase 錯誤:', error);
      commit('SET_ERROR', error.message);
      setTimeout(() => {
        commit('SET_ERROR', null);
      }, 5000);
    }
  }
};