<template>
  <div class="login-container">
    <div class="login-card">
      <h1>養蜂達人</h1>
      <div class="game-description">
        <p>歡迎來到養蜂達人！開始你的養蜂生涯吧！</p>
      </div>
      
      <div class="bee-animation">
        <img src="@/assets/images/honeybee.png" alt="蜜蜂" class="bee-icon" />
      </div>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- 切換登入/註冊模式 -->
        <div class="mode-switch">
          <button 
            type="button" 
            :class="['mode-button', { active: mode === 'login' }]"
            @click="mode = 'login'"
          >
            登入
          </button>
          <button 
            type="button" 
            :class="['mode-button', { active: mode === 'register' }]"
            @click="mode = 'register'"
          >
            註冊
          </button>
        </div>
        
        <div class="form-group">
          <label for="username">帳號</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="請輸入帳號" 
            maxlength="20"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密碼</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="請輸入密碼" 
            required
          />
        </div>
        
        <div class="form-group" v-if="mode === 'register'">
          <label for="characterName">你的養蜂人名稱</label>
          <input 
            type="text" 
            id="characterName" 
            v-model="characterName" 
            placeholder="請輸入你的名稱" 
            maxlength="12"
            required
          />
        </div>
        
        <div class="message" v-if="message" :class="messageType">{{ message }}</div>
        
        <button type="submit" class="submit-button" :disabled="!canSubmit">
          {{ mode === 'login' ? '登入遊戲' : '創建帳號' }}
        </button>
      </form>
      
      <div class="game-features">
        <h3>遊戲特色</h3>
        <ul>
          <li>🐝 建立你自己的蜂場</li>
          <li>🌼 派遣蜜蜂採集各種花蜜</li>
          <li>🏆 升級你的蜂巢，增加產量</li>
          <li>⚡ 應對各種自然挑戰和病蟲害</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      mode: 'login',  // 'login' 或 'register'
      username: '',
      password: '',
      characterName: '',
      message: '',
      messageType: 'info',
      accounts: {}  // 存儲帳號信息
    };
  },
  computed: {
    canSubmit() {
      if (this.mode === 'login') {
        return this.username.trim().length >= 3 && this.password.length >= 4;
      } else {
        return this.username.trim().length >= 3 && 
               this.password.length >= 4 && 
               this.characterName.trim().length >= 2;
      }
    }
  },
  mounted() {
    // 載入已存在的帳號
    this.loadAccounts();
    
    // 從 URL 獲取可能的錯誤訊息
    if (this.$route.query.error) {
      this.message = decodeURIComponent(this.$route.query.error);
      this.messageType = 'error';
      this.$router.replace({ path: this.$route.path });
    }
  },
  methods: {
    handleSubmit() {
      if (!this.canSubmit) return;
      
      if (this.mode === 'login') {
        this.loginUser();
      } else {
        this.registerUser();
      }
    },
    
    loginUser() {
      // 檢查帳號是否存在
      if (!this.accounts[this.username]) {
        this.message = '帳號不存在';
        this.messageType = 'error';
        return;
      }
      
      // 檢查密碼是否正確
      if (this.accounts[this.username].password !== this.password) {
        this.message = '密碼不正確';
        this.messageType = 'error';
        return;
      }
      
      // 登入成功，載入該帳號的遊戲數據
      this.message = '登入成功，正在載入遊戲...';
      this.messageType = 'success';
      
      // 設定當前使用者
      localStorage.setItem('beekeeper_current_user', this.username);
      localStorage.setItem('beekeeper_name', this.accounts[this.username].characterName);
      
      // 導航到遊戲頁面
      setTimeout(() => {
        this.$router.push('/game');
      }, 1000);
    },
    
    registerUser() {
      // 檢查帳號是否已存在
      if (this.accounts[this.username]) {
        this.message = '此帳號已被使用';
        this.messageType = 'error';
        return;
      }
      
      // 創建新帳號
      this.accounts[this.username] = {
        password: this.password,
        characterName: this.characterName,
        created: Date.now()
      };
      
      // 保存帳號信息
      this.saveAccounts();
      
      // 設定當前使用者
      localStorage.setItem('beekeeper_current_user', this.username);
      localStorage.setItem('beekeeper_name', this.characterName);
      localStorage.setItem('beekeeper_new_game', 'true');  // 新帳號需要新遊戲
      
      this.message = '帳號創建成功，正在進入遊戲...';
      this.messageType = 'success';
      
      // 導航到遊戲頁面
      setTimeout(() => {
        this.$router.push('/game');
      }, 1000);
    },
    
    loadAccounts() {
      // 從 localStorage 載入帳號信息
      const accountsData = localStorage.getItem('beekeeper_accounts');
      if (accountsData) {
        try {
          this.accounts = JSON.parse(accountsData);
        } catch (e) {
          console.error('解析帳號數據時出錯:', e);
          this.accounts = {};
        }
      }
      
      // 如果有記住的用戶名，自動填充
      const lastUser = localStorage.getItem('beekeeper_current_user');
      if (lastUser && this.accounts[lastUser]) {
        this.username = lastUser;
      }
    },
    
    saveAccounts() {
      // 將帳號信息保存到 localStorage
      localStorage.setItem('beekeeper_accounts', JSON.stringify(this.accounts));
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  padding: 20px;
}

.login-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 30px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  text-align: center;
  position: relative;
}

h1 {
  color: #d4a017;
  margin-bottom: 15px;
  font-size: 2.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.game-description {
  margin-bottom: 20px;
  color: #5d4215;
  font-size: 1.1rem;
}

.bee-animation {
  margin: 15px 0;
  height: 80px;
  position: relative;
}

.bee-icon {
  width: 60px;
  height: 60px;
  animation: flyBee 3s infinite alternate ease-in-out;
  position: relative;
}

@keyframes flyBee {
  0% { transform: translate(-30px, 5px) rotate(5deg); }
  50% { transform: translate(30px, -10px) rotate(-5deg); }
  100% { transform: translate(-10px, 0) rotate(10deg); }
}

.login-form {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.mode-switch {
  display: flex;
  width: 100%;
  margin-bottom: 20px;
  border-radius: 25px;
  overflow: hidden;
  border: 2px solid #ffd24d;
}

.mode-button {
  flex: 1;
  padding: 10px;
  border: none;
  background-color: #f9f5ea;
  color: #8c6d3c;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-button.active {
  background-color: #ffc226;
  color: #5d4215;
}

.form-group {
  width: 100%;
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #5d4215;
  font-size: 1.1rem;
  text-align: left;
}

input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ffd24d;
  border-radius: 25px;
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  color: #5d4215;
}

input:focus {
  outline: none;
  border-color: #d4a017;
  box-shadow: 0 0 0 3px rgba(212, 160, 23, 0.3);
}

.submit-button {
  margin-top: 10px;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  width: 180px;
  background-color: #ffc226;
  color: #5d4215;
}

.submit-button:hover {
  background-color: #ffb300;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  background-color: #d6d6d6;
  color: #888;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.message {
  margin: 15px 0;
  padding: 10px;
  border-radius: 5px;
  width: 100%;
}

.message.info {
  color: #0c5460;
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
}

.message.error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.message.success {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.game-features {
  margin-top: 30px;
  text-align: left;
  background-color: rgba(255, 248, 230, 0.7);
  padding: 15px;
  border-radius: 10px;
}

.game-features h3 {
  color: #d4a017;
  margin-bottom: 10px;
  text-align: center;
}

.game-features ul {
  padding-left: 20px;
}

.game-features li {
  margin-bottom: 8px;
  color: #5d4215;
}

@media (max-width: 480px) {
  .login-card {
    padding: 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .game-description {
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  input {
    padding: 10px 12px;
  }
  
  .submit-button {
    width: 100%;
    padding: 10px 20px;
  }
}
</style>