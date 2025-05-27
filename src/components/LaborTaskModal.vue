<template>
  <div class="labor-overlay" v-if="task && task.currentTask">
    <div class="labor-container">
      <h3 class="labor-title">{{ task.taskName }}</h3>
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <button
        @click="performWork"
        :class="['game-button', { completed: isCompleted }]"
        :disabled="isCompleted"
      >
        <span class="button-text">{{ buttonText }}</span>
      </button>
    </div>
  </div>
</template>

<script>
  import { mapActions } from "vuex";

  export default {
    name: "LaborTaskModal",
    props: {
      task: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        isCompleted: false,
        localClicksDone: 0,
      };
    },
    computed: {
      progress() {
        const currentClicks =
          this.localClicksDone + (this.task.clicksCompleted || 0);
        return (currentClicks / this.task.clicksNeeded) * 100;
      },
      buttonText() {
        if (this.isCompleted) {
          return "完成！";
        } else {
          const remainingClicks =
            this.task.clicksNeeded -
            ((this.task.clicksCompleted || 0) + this.localClicksDone);
          return `努力工作 (還需 ${remainingClicks} 次)`;
        }
      },
    },
    watch: {
      // 當 task 改變時重置本地狀態
      task: {
        handler() {
          this.isCompleted = false;
          this.localClicksDone = 0;
        },
        deep: true,
      },
    },
    methods: {
      ...mapActions({
        completeLaborTask: "laborTasks/progressTask",
      }),
      performWork() {
        if (this.isCompleted) return;

        // 更新本地點擊次數
        this.localClicksDone++;

        // 檢查是否完成任務
        if (
          this.localClicksDone + this.task.clicksCompleted <
          this.task.clicksNeeded
        ) {
          this.completeLaborTask();
        } else {
          this.isCompleted = true;

          // 延遲關閉模態框，給用戶一個視覺反饋
          setTimeout(() => {
            this.$emit("complete", this.localClicksDone);
          }, 500);
        }
      },
    },
  };
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

  .labor-container {
    background-color: #fff;
    border-radius: 15px;
    padding: 25px;
    width: 320px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
    text-align: center;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 2px solid #ffc226;
    position: relative;
    overflow: hidden;
  }

  .labor-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(to right, #ffc226, #ffeb3b, #ffc226);
  }

  .labor-title {
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    font-size: 1.4rem;
    color: #5d4215;
    position: relative;
    font-weight: bold;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }

  .labor-title::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background-color: #ffc226;
    border-radius: 3px;
  }

  h3 {
    margin-bottom: 15px;
    color: #5d4215;
  }

  .progress-container {
    width: 100%;
    height: 20px;
    background-color: #f5f5f5;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(to right, #4caf50, #8bc34a);
    transition: width 0.3s ease;
    width: 0%;
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
  }

  .game-button {
    margin: 0 auto;
    display: block;
    padding: 12px 24px;
    font-size: 1.1rem;
    transition: all 0.3s;
    min-width: 180px;
  }

  .game-button:disabled {
    background-color: #4caf50;
    cursor: default;
  }

  .button-text {
    position: relative;
    z-index: 2;
  }

  .game-button.completed {
    background-color: #2196f3;
    color: white;
    font-weight: bold;
    position: relative;
    overflow: hidden;
    border: 2px solid #1976d2;
  }

  .game-button.completed::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      transparent 75%,
      transparent
    );
    background-size: 20px 20px;
    z-index: 1;
    animation: shine 1s linear infinite;
  }

  @keyframes shine {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 20px 0;
    }
  }
</style>
