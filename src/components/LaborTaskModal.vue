<template>
    <div class="labor-overlay" v-if="task.isActive">
      <div class="labor-task">
        <h3>{{ task.name }}</h3>
        <div class="progress-container">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <button 
          @click="performWork" 
          class="game-button"
          :disabled="isCompleted">
          {{ buttonText }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LaborTaskModal',
    props: {
      task: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        isCompleted: false,
        localClicksDone: 0 // 在本地追蹤點擊次數，而不是修改 prop
      };
    },
    computed: {
      progress() {
        // 使用本地計數器來計算進度
        return ((this.localClicksDone + this.task.clicksDone) / this.task.clicksNeeded) * 100;
      },
      buttonText() {
        if (this.isCompleted) {
          return '完成！';
        } else {
          // 使用本地計數器和 prop 總和來顯示剩餘次數
          return `努力工作 (還需 ${this.task.clicksNeeded - this.task.clicksDone - this.localClicksDone} 次)`;
        }
      }
    },
    methods: {
      performWork() {
        if (this.isCompleted) return;
        
        // 更新本地點擊次數
        this.localClicksDone++;
        
        // 檢查是否完成任務
        if ((this.localClicksDone + this.task.clicksDone) >= this.task.clicksNeeded) {
          this.isCompleted = true;
          
          // 延遲關閉模態框，給用戶一個視覺反饋
          setTimeout(() => {
            // 通知父組件任務完成，並傳遞本地累積的點擊次數
            this.$emit('complete', this.localClicksDone);
          }, 500);
        } else {
          // 即使未完成，也可以定期通知父組件進度更新
          this.$emit('update-progress', this.localClicksDone);
        }
      }
    },
    watch: {
      // 當 task 改變時重置本地狀態
      'task': {
        handler() {
          this.localClicksDone = 0;
          this.isCompleted = false;
        },
        deep: true
      }
    }
  }
  </script>
  
  <style scoped>
  .labor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .labor-task {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  }
  
  h3 {
    margin-bottom: 15px;
    color: #5d4215;
  }
  
  .progress-container {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 15px;
  }
  
  .progress-bar {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s;
    width: 0%;
  }
  
  .game-button {
    margin: 0 auto;
    display: block;
  }
  
  .game-button:disabled {
    background-color: #4caf50;
    cursor: default;
  }
  </style>