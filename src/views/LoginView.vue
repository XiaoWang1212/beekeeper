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
        
        <form @submit.prevent="startGame" class="login-form">
          <div class="form-group">
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
          
          <div class="message" v-if="message">{{ message }}</div>
          
          <button type="submit" class="start-button" :disabled="!canStart">
            開始遊戲
          </button>
          
          <div class="continue-game" v-if="hasSavedGame">
            <button @click="continueGame" class="continue-button">
              繼續遊戲
            </button>
          </div>
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
        characterName: '',
        message: '',
        hasSavedGame: false
      };
    },
    computed: {
      canStart() {
        return this.characterName.trim().length >= 2;
      }
    },
    mounted() {
      // 檢查是否有已保存的遊戲
      this.checkSavedGame();
      
      // 從 URL 獲取可能的錯誤訊息
      if (this.$route.query.error) {
        this.message = decodeURIComponent(this.$route.query.error);
        this.$router.replace({ path: this.$route.path });
      }
    },
    methods: {
      startGame() {
        if (!this.canStart) return;
        
        // 儲存玩家名稱
        localStorage.setItem('beekeeper_name', this.characterName);
        localStorage.setItem('beekeeper_new_game', 'true');
        
        // 導航到遊戲頁面
        this.$router.push('/game');
      },
      
      continueGame() {
        // 導航到遊戲頁面但不重置遊戲
        localStorage.removeItem('beekeeper_new_game');
        this.$router.push('/game');
      },
      
      checkSavedGame() {
        // 檢查本地存儲中是否有保存的遊戲數據
        const savedGame = localStorage.getItem('beekeeper_game');
        this.hasSavedGame = !!savedGame;
        
        // 如果有存檔，預填之前的角色名稱
        if (this.hasSavedGame) {
          const savedName = localStorage.getItem('beekeeper_name');
          if (savedName) {
            this.characterName = savedName;
          }
        }
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
  }
  
  input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #ffd24d;
    border-radius: 25px;
    font-size: 1rem;
    background-color: rgba(255, 255, 255, 0.8);
    color: #5d4215;
    text-align: center;
  }
  
  input:focus {
    outline: none;
    border-color: #d4a017;
    box-shadow: 0 0 0 3px rgba(212, 160, 23, 0.3);
  }
  
  .start-button, .continue-button {
    margin-top: 10px;
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    width: 180px;
  }
  
  .start-button {
    background-color: #ffc226;
    color: #5d4215;
  }
  
  .start-button:hover {
    background-color: #ffb300;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .start-button:disabled {
    background-color: #d6d6d6;
    color: #888;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .continue-button {
    background-color: #6eb657;
    color: white;
    margin-top: 10px;
  }
  
  .continue-button:hover {
    background-color: #5ca349;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .continue-game {
    margin-top: 10px;
  }
  
  .message {
    margin: 15px 0;
    padding: 10px;
    border-radius: 5px;
    color: #856404;
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
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
    
    .start-button, .continue-button {
      width: 100%;
      padding: 10px 20px;
    }
  }
  </style>