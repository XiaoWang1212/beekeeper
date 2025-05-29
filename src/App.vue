<template>
  <router-view/>
</template>

<script>
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // 改用 Realtime Database
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { mapActions } from 'vuex';

const firebaseConfig = {
  apiKey: "AIzaSyAkYvKj5JpAL_0lpzrdDaYm9xi0SE9nox4",
  authDomain: "beekeeper-4bccb.firebaseapp.com",
  projectId: "beekeeper-4bccb",
  databaseURL: "https://beekeeper-4bccb-default-rtdb.firebaseio.com", // 添加此行
  storageBucket: "beekeeper-4bccb.firebasestorage.app",
  messagingSenderId: "126642118467",
  appId: "1:126642118467:web:1040498c3de60af13d19f6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export default {
  name: 'App',
  data() {
    return {
      currentUser: null,
      db: db,
      auth: auth
    }
  },
  created() {
    // 設置 Firebase 實例到 Vuex
    this.setFirebaseInstances({ db, auth });
    
    // 監聽用戶登入狀態
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // 用戶已登入
        this.currentUser = user;
        this.setCurrentUser(user);
        console.log('用戶已登入:', user.displayName || user.email);
        
        // 嘗試載入遊戲數據
        this.loadGame();
      } else {
        // 用戶已登出
        this.currentUser = null;
        this.setCurrentUser(null);
        console.log('用戶已登出');
        this.$router.push('/login'); // 重定向到登入頁面
      }
    });
  },
  methods: {
    ...mapActions({
      setFirebaseInstances: 'firebase/setInstances',
      setCurrentUser: 'firebase/setCurrentUser',
      loadGame: 'persistence/loadGame'
    })
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
