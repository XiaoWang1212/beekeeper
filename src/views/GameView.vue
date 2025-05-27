<template>
  <div class="game-container">
    <header>
      <h1>養蜂達人</h1>
      <div class="weather-display">
        <span id="weather-icon">{{ currentWeather.icon }}</span>
        <span id="weather-status">{{ currentWeather.name }}</span>
      </div>
    </header>

    <div class="resources-panel">
      <div class="resource">
        <img
          src="@/assets/images/honeybee.png"
          alt="蜜蜂"
          class="resource-icon"
        />
        <div class="resource-info">
          <span class="resource-name">蜜蜂</span>
          <span>{{ bees }}</span>
        </div>
      </div>
      <div class="resource">
        <img
          src="@/assets/images/honeyTotal.png"
          alt="蜂蜜"
          class="resource-icon"
        />
        <div class="resource-info">
          <span class="resource-name">蜂蜜 (kg)</span>
          <span>{{ honey.toFixed(1) }}</span>
        </div>
      </div>
      <div class="resource">
        <img src="@/assets/images/coin.png" alt="金錢" class="resource-icon" />
        <div class="resource-info">
          <span class="resource-name">金錢</span>
          <span>{{ money }}</span>
        </div>
      </div>
    </div>

    <div class="hive-display">
      <h2>蜂巢狀況</h2>
      <div class="hive-container" ref="hiveContainer">
        <!-- 蜂巢將由Vue動態生成 -->
      </div>
      <div class="hive-stats">
        <div>
          健康度: <span :style="healthColorStyle">{{ hiveHealth }}%</span>
        </div>
        <div>
          等級: <span>{{ hiveLevel }}</span>
        </div>
        <div>
          產蜜效率:
          <span>{{ honeyPerBeePerMinute.toFixed(2) }} kg/分鐘/蜂</span>
        </div>
        <div>
          蜂箱容量: <span>{{ hiveCapacity }} 隻</span>
        </div>
      </div>
    </div>

    <div class="action-panel">
      <button
        @click="collectHoney"
        :disabled="!canCollectHoney"
        class="game-button"
      >
        採集蜂蜜
      </button>
      <button @click="buyBee" :disabled="!canBuyBee" class="game-button">
        購買蜜蜂 (¥{{ beeCost }})
      </button>
      <button
        @click="upgradeHive"
        :disabled="!canUpgradeHive"
        class="game-button"
      >
        升級蜂巢 (¥{{ hiveUpgradeCost }})
      </button>
      <button @click="checkHive" class="game-button">檢查蜂巢</button>
      <button @click="openForagingModal" class="game-button special">
        採蜜任務
      </button>
      <button
        @click="openHoneyStorage"
        class="game-button honey-storage-button"
        :disabled="disableButtons"
      >
        <span class="icon">🍯</span>
        蜂蜜倉庫
        <span class="badge" v-if="hasNewOrders">!</span>
      </button>
    </div>

    <div class="challenges-panel">
      <h2>養蜂挑戰</h2>
      <div
        :class="['challenge-card', currentChallenge?.type]"
        v-if="currentChallenge"
        v-show="!challengeHidden"
      >
        <h3>{{ currentChallenge.data.title }}</h3>
        <p>{{ currentChallenge.data.description }}</p>
        <div class="challenge-actions">
          <button
            v-for="(solution, index) in currentChallenge.data.solutions"
            :key="index"
            @click="applySolution(solution)"
            class="challenge-button"
          >
            {{ solution.name }}
          </button>
        </div>
      </div>
    </div>

    <div class="notification-area">
      <!-- 通知將由Vue動態生成 -->
    </div>

    <div class="education-panel">
      <h2>今日養蜂知識</h2>
      <p>{{ currentBeeFact }}</p>
    </div>

    <!-- 模態框覆蓋層 -->
    <div
      id="modal-overlay"
      class="modal-overlay"
      :class="{ active: isModalActive, hidden: !isModalActive }"
      @click="closeAllModals"
    ></div>

    <!-- 採蜜任務模態框 -->
    <foraging-modal
      :is-active="isForagingModalActive"
      @close-modal="closeForagingModal"
      @start-mission="startForagingMission"
      @sell-all-honey="sellAllHoney"
      @update-selected-area="updateSelectedArea"
    />

    <!-- 勞力任務模態框 -->
    <labor-task-modal
      v-if="$store.state.laborTasks && $store.state.laborTasks.currentTask"
      :task="$store.state.laborTasks"
      @complete="completeLaborTask"
    />

    <honey-storage-modal
      :is-active="isHoneyStorageModalActive"
      @close-modal="closeHoneyStorageModal"
    />
  </div>
</template>

<script>
  import { mapState, mapGetters, mapActions } from "vuex";
  import ForagingModal from "@/components/ForagingModal.vue";
  import LaborTaskModal from "@/components/LaborTaskModal.vue";
  import HoneyStorageModal from "@/components/HoneyStorageModal.vue";

  export default {
    name: "GameView",
    components: {
      ForagingModal,
      LaborTaskModal,
      HoneyStorageModal,
    },
    data() {
      return {
        // 模態框狀態
        isModalActive: false,
        isForagingModalActive: false,
        isHoneyStorageModalActive: false,
      };
    },
    computed: {
      ...mapState({
        bees: (state) => state.bees.bees,
        honey: (state) => state.honey.total || 0,
        money: (state) => state.money,
        hiveLevel: (state) => state.bees.hiveLevel,
        hiveHealth: (state) => state.bees.hiveHealth,
        hiveCapacity: (state) => state.bees.hiveCapacity,
        honeyPerBeePerMinute: (state) => state.bees.honeyPerBeePerMinute,
        beeCost: (state) => state.bees.costs.bee,
        hiveUpgradeCost: (state) => state.bees.costs.hiveUpgrade,
        currentChallenge: (state) => state.challenges.currentChallenge,
        challengeHidden: (state) => state.challenges.challengeHidden,
        currentBeeFact: (state) => state.currentBeeFact,
        laborTask: (state) => state.laborTasks,
        weatherTypes: (state) => state.weather.weatherTypes,
      }),
      ...mapGetters({
        healthColorStyle: "bees/healthColorStyle",
        canBuyBee: "bees/canBuyBee",
        canUpgradeHive: "bees/canUpgradeHive",
        canCollectHoney: "honey/canCollectHoney",
        hasNewOrders: "orders/hasNewOrders",
        currentWeather: "weather/currentWeather",
      }),
      disableButtons() {
        return (
          this.$store.state.laborTasks &&
          this.$store.state.laborTasks.currentTask !== null
        );
      },
    },
    mounted() {
      this.initGame();

      // 設置蜜蜂渲染的觀察者
      this.$nextTick(() => {
        this.renderBees();
      });

      // 設置 bees 變化時重新渲染蜜蜂
      this.$watch(
        () => this.$store.state.bees.bees,
        () => {
          this.renderBees();
        }
      );
    },
    methods: {
      ...mapActions({
        initGame: "initGame",
        collectHoney: "honey/collectHoney",
        buyBee: "bees/buyBee",
        upgradeHive: "bees/upgradeHive",
        checkHive: "bees/checkHive",
        applySolution: "challenges/applySolution",
        startForagingMission: "foraging/startForagingMission",
        sellAllHoney: "honey/sellAllHoney",
        updateSelectedArea: "foraging/selectArea",
        completeLaborTask: "laborTasks/progressTask",
      }),

      // 開啟採蜜模態框
      openForagingModal() {
        this.isModalActive = true;
        this.isForagingModalActive = true;
      },

      // 關閉採蜜模態框
      closeForagingModal() {
        this.isForagingModalActive = false;
        this.isModalActive = false;
      },

      // 關閉所有模態框
      closeAllModals(event) {
        // 只有當點擊的是覆蓋層本身時才關閉
        if (event.target.id === "modal-overlay") {
          this.isForagingModalActive = false;
          this.isModalActive = false;
          this.isHoneyStorageModalActive = false;
        }
      },

      // 渲染蜜蜂動畫
      renderBees() {
        const hiveContainer = this.$refs.hiveContainer;
        if (!hiveContainer) return;

        // 清空現有蜜蜂
        while (hiveContainer.firstChild) {
          hiveContainer.removeChild(hiveContainer.firstChild);
        }

        // 獲取容器尺寸，用於計算安全範圍
        const containerWidth = hiveContainer.clientWidth;
        const containerHeight = hiveContainer.clientHeight;

        // 安全邊距 (讓蜜蜂不飛出容器)
        const safeMargin = 30; // 像素

        // 添加蜜蜂
        for (let i = 0; i < this.bees; i++) {
          const bee = document.createElement("div");
          bee.className = "bee";

          // 計算安全的隨機位置 (避開邊緣)
          // 使用百分比 20% - 80% 確保有足夠邊距
          let left = Math.random() * 60 + 20; // 20% to 80%
          let top = Math.random() * 60 + 20; // 20% to 80%

          bee.style.left = `${left}%`;
          bee.style.top = `${top}%`;

          // 隨機飛行動畫延遲，讓蜜蜂不同步移動
          bee.style.animationDelay = `${Math.random() * 5}s`;

          // 計算最大安全飛行距離 (像素)
          // 根據蜜蜂的初始位置計算安全飛行範圍
          const posX = (left / 100) * containerWidth; // 轉換為像素
          const posY = (top / 100) * containerHeight; // 轉換為像素

          // 計算到各邊界的距離
          const distToLeft = posX;
          const distToRight = containerWidth - posX;
          const distToTop = posY;
          const distToBottom = containerHeight - posY;

          // 安全飛行距離應該是到最近邊界距離的一半，再減去安全邊距
          const maxSafeDistance =
            Math.min(distToLeft, distToRight, distToTop, distToBottom) -
            safeMargin;

          // 確保最小值為 5px (避免負值)
          const flyDistance = Math.min(Math.max(maxSafeDistance * 0.7, 5), 15);

          // 設置 CSS 變數，定義隨機飛行軌跡
          // 現在使用較小的範圍，確保不會飛出
          bee.style.setProperty(
            "--x0",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty(
            "--y0",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty("--r0", `${Math.random() * 20 - 10}deg`);

          bee.style.setProperty(
            "--x25",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty(
            "--y25",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty("--r25", `${Math.random() * 20 - 10}deg`);

          bee.style.setProperty(
            "--x50",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty(
            "--y50",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty("--r50", `${Math.random() * 20 - 10}deg`);

          bee.style.setProperty(
            "--x75",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty(
            "--y75",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty("--r75", `${Math.random() * 20 - 10}deg`);

          bee.style.setProperty(
            "--x100",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty(
            "--y100",
            `${Math.random() * flyDistance - flyDistance / 2}px`
          );
          bee.style.setProperty("--r100", `${Math.random() * 20 - 10}deg`);

          // 根據蜜蜂位置調整動畫時間 (更靠近中心的蜜蜂飛得慢一些)
          const centerDistance = Math.sqrt(
            Math.pow((left - 50) / 50, 2) + Math.pow((top - 50) / 50, 2)
          );
          // 3-7秒，中心較慢，邊緣較快
          const animationDuration = 3 + (1 - centerDistance) * 4;
          bee.style.animationDuration = `${animationDuration}s`;

          hiveContainer.appendChild(bee);
        }
      },

      openHoneyStorage() {
        this.isHoneyStorageModalActive = true;
        this.isModalActive = true;
      },

      // 關閉蜂蜜倉庫
      closeHoneyStorageModal() {
        this.isHoneyStorageModalActive = false;
        this.isModalActive = false;
      },
    },
  };
</script>

<style>
  /* 匯入原始CSS樣式 */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "微軟正黑體", Arial, sans-serif;
  }

  body {
    background-color: #f5f0e5;
    color: #453018;
    line-height: 1.6;
  }

  .game-container {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 15px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #ffd24d;
  }

  h1 {
    color: #d4a017;
    font-size: 2.2rem;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  }

  h2 {
    color: #b38728;
    font-size: 1.5rem;
    margin-bottom: 10px;
    border-bottom: 1px solid #ffd24d;
    padding-bottom: 5px;
  }

  /* 天氣顯示 */
  .weather-display {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2rem;
    padding: 5px 15px;
    background-color: #e9f5ff;
    border-radius: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  #weather-icon {
    font-size: 2rem;
  }

  /* 資源面板 */
  .resources-panel {
    display: flex;
    justify-content: space-around;
    margin-bottom: 25px;
    padding: 15px;
    background-color: #fff8e6;
    border-radius: 10px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .resource {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .resource-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .resource-info {
    display: flex;
    flex-direction: column;
  }

  .resource-name {
    font-size: 0.9rem;
    color: #6a5a3e;
  }

  /* 蜂巢顯示區域 */
  .hive-display {
    margin-bottom: 25px;
    padding: 20px;
    background-color: #fefaf0;
    border-radius: 10px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .hive-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
    height: 150px;
    background-size: contain;
    position: relative;
  }

  .bee {
    position: absolute !important;
    width: 20px !important;
    height: 20px !important;
    background: url("@/assets/images/bee-sprite.png") no-repeat !important;
    background-size: contain !important;
    animation: fly 5s infinite alternate !important;
    z-index: 10;
  }

  @keyframes fly {
    0% {
      transform: translate(var(--x0, 0), var(--y0, 0)) rotate(var(--r0, 0deg));
    }
    20% {
      transform: translate(var(--x25, 5px), var(--y25, 5px))
        rotate(var(--r25, 5deg));
    }
    40% {
      transform: translate(var(--x50, -5px), var(--y50, 5px))
        rotate(var(--r50, -5deg));
    }
    60% {
      transform: translate(var(--x75, 5px), var(--y75, -5px))
        rotate(var(--r75, 5deg));
    }
    80% {
      transform: translate(var(--x100, -5px), var(--y100, -5px))
        rotate(var(--r100, -5deg));
    }
    100% {
      transform: translate(var(--x0, 0), var(--y0, 0)) rotate(var(--r0, 0deg)); /* 回到起點 */
    }
  }

  .hive-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 0.95rem;
  }

  .hive-stats span {
    font-weight: bold;
    color: #8c6d3c;
  }

  /* 操作按鈕區 */
  .action-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 25px;
    justify-content: center;
  }

  .game-button {
    padding: 12px 20px;
    border: none;
    border-radius: 25px;
    background-color: #ffc226;
    color: #5d4215;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .game-button:hover {
    background-color: #ffb300;
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
  }

  .game-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .game-button:disabled {
    background-color: #d6d6d6;
    color: #888;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 挑戰面板 */
  .challenges-panel {
    margin-bottom: 25px;
    padding: 15px;
    background-color: #fff8e6;
    border-radius: 10px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .challenge-card {
    background-color: #fff;
    border-radius: 12px;
    padding: 20px;
    margin-top: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-left: 5px solid #ff9800;
    transition: transform 0.2s ease;
  }

  .challenge-card.weather {
    border-left-color: #42a5f5;
  }

  .challenge-card.pest {
    border-left-color: #ef5350;
  }

  .challenge-card.environment {
    border-left-color: #66bb6a;
  }

  .challenge-card h3 {
    margin-bottom: 8px;
    color: #d46700;
  }

  .challenge-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .challenge-button {
    padding: 8px 15px;
    border: none;
    border-radius: 20px;
    background-color: #8c6d3c;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .challenge-button:hover {
    background-color: #6a512a;
  }

  .hidden {
    display: none;
  }

  /* 通知區域 */
  .notification-area {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 300px;
    z-index: 999;
  }

  .notification {
    padding: 12px 20px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s forwards;
    border-left: 5px solid #4caf50;
    font-size: 0.9rem;
  }

  .notification.danger {
    border-left-color: #f44336;
  }

  .notification.warning {
    border-left-color: #ff9800;
  }

  .notification.info {
    border-left-color: #2196f3;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  /* 知識面板 */
  .education-panel {
    padding: 15px;
    background-color: #e7f5e4;
    border-radius: 10px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }

  .honey-storage-button {
    background-color: #ffcc00 !important;
    color: #8b5a00 !important;
    position: relative;
  }

  .badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #e53935;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }

  /* 響應式設計 */
  @media (max-width: 768px) {
    .resources-panel {
      flex-direction: column;
      gap: 15px;
    }

    .action-panel {
      flex-direction: column;
    }

    .game-button {
      width: 100%;
    }
  }

  /* 模態框基本樣式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .modal-overlay.active {
    opacity: 1;
  }

  .modal {
    background-color: #fff;
    border-radius: 15px;
    width: 90%;
    max-width: 900px;
    max-height: 85vh;
    overflow: hidden;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    transform: translateY(50px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 1001;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(50px);
  }

  .modal.active {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }

  /* 特殊按鈕樣式 */
  .game-button.special {
    background-color: #63b3ed;
    color: #fff;
  }

  .game-button.special:hover {
    background-color: #4299e1;
  }
</style>
