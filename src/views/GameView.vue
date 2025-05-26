<template>
  <div class="game-container">
    <header>
      <h1>養蜂達人</h1>
      <div class="weather-display">
        <span id="weather-icon">{{
          weatherTypes[gameState.weather.current].icon
        }}</span>
        <span id="weather-status">{{
          weatherTypes[gameState.weather.current].name
        }}</span>
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
          <span>{{ gameState.bees }}</span>
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
          <span>{{ gameState.honey.toFixed(1) }}</span>
        </div>
      </div>
      <div class="resource">
        <img src="@/assets/images/coin.png" alt="金錢" class="resource-icon" />
        <div class="resource-info">
          <span class="resource-name">金錢</span>
          <span>{{ gameState.money }}</span>
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
          健康度:
          <span :style="healthColorStyle">{{ gameState.hiveHealth }}%</span>
        </div>
        <div>
          等級: <span>{{ gameState.hiveLevel }}</span>
        </div>
        <div>
          產蜜效率:
          <span
            >{{ gameState.honeyPerBeePerMinute.toFixed(2) }} kg/分鐘/蜂</span
          >
        </div>
        <div>
          蜂箱容量: <span>{{ gameState.hiveCapacity }} 隻</span>
        </div>
      </div>
    </div>

    <div class="action-panel">
      <button
        @click="collectHoney"
        :disabled="gameState.honey <= 0"
        class="game-button"
      >
        採集蜂蜜
      </button>
      <button
        @click="buyBee"
        :disabled="
          gameState.money < gameState.costs.bee ||
          gameState.bees >= gameState.hiveCapacity
        "
        class="game-button"
      >
        購買蜜蜂 (¥{{ gameState.costs.bee }})
      </button>
      <button
        @click="upgradeHive"
        :disabled="gameState.money < gameState.costs.hiveUpgrade"
        class="game-button"
      >
        升級蜂巢 (¥{{ gameState.costs.hiveUpgrade }})
      </button>
      <button @click="checkHive" class="game-button">檢查蜂巢</button>
      <button @click="openForagingModal" class="game-button special">
        採蜜任務
      </button>
    </div>

    <div class="challenges-panel">
      <h2>養蜂挑戰</h2>
      <div
        :class="['challenge-card', gameState.currentChallenge?.type]"
        v-if="gameState.currentChallenge"
        v-show="!challengeHidden"
      >
        <h3>{{ gameState.currentChallenge.data.title }}</h3>
        <p>{{ gameState.currentChallenge.data.description }}</p>
        <div class="challenge-actions">
          <button
            v-for="(solution, index) in gameState.currentChallenge.data
              .solutions"
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
      :game-state="gameState"
      :is-active="isForagingModalActive"
      @close-modal="closeForagingModal"
      @start-mission="startForagingMission"
      @sell-all-honey="sellAllHoney"
      @update-selected-area="updateSelectedArea"
    >
    </foraging-modal>

    <!-- 勞力任務模態框 -->
    <labor-task-modal
      v-if="laborTask.isActive"
      :task="laborTask"
      @complete="completeLaborTask"
    >
    </labor-task-modal>
  </div>
</template>

<script>
  import ForagingModal from "@/components/ForagingModal.vue";
  import LaborTaskModal from "@/components/LaborTaskModal.vue";

  export default {
    name: "App",
    components: {
      ForagingModal,
      LaborTaskModal,
    },
    data() {
      return {
        // 遊戲狀態
        gameState: {
          // 資源
          bees: 0,
          honey: 0,
          money: 100,

          // 蜂巢屬性
          hiveLevel: 1,
          hiveHealth: 100,
          hiveCapacity: 10,
          honeyPerBeePerMinute: 0.1, // 每隻蜜蜂每分鐘產蜜量

          // 遊戲內時間計數器
          gameTime: 0,
          lastSaveTime: Date.now(),

          // 天氣系統
          weather: {
            current: "sunny", // sunny, rainy, drought, cold
            effectMultiplier: 1.0, // 天氣對產蜜影響的乘數
            daysRemaining: 0, // 當前天氣持續的天數
          },

          // 當前挑戰
          currentChallenge: null,

          // 統計數據
          totalHoneyCollected: 0,
          challengesSolved: 0,

          // 升級費用
          costs: {
            bee: 50,
            hiveUpgrade: 200,
          },

          // 採蜜任務
          foraging: {
            activeMissions: [],
            selectedArea: null,
            beesAssigned: 1,
            honeyCollected: {
              common: 0,
              wildflower: 0,
              mountain: 0,
              rare: 0,
            },
          },
        },

        // 天氣類型及其影響
        weatherTypes: {
          sunny: {
            icon: "☀️",
            name: "晴天",
            effect: 1.0,
            description: "陽光充足，蜜蜂出勤率高",
          },
          rainy: {
            icon: "🌧️",
            name: "連續大雨",
            effect: 0.3,
            description: "雨天，蜜蜂難以飛行採蜜",
          },
          drought: {
            icon: "🏜️",
            name: "乾旱",
            effect: 0.5,
            description: "蜜源植物枯萎，花蜜減少",
          },
          cold: {
            icon: "❄️",
            name: "寒流來襲",
            effect: 0.2,
            description: "蜜蜂活動減緩，需要額外供暖",
          },
        },

        // 蜂蜜市場價格波動
        honeyMarketPrice: 10, // 初始價格：10元/kg

        // 養蜂知識庫
        beeFacts: [
          "一隻工蜂一生中只能生產約1茶匙的蜂蜜。",
          "蜂后一天可以產下多達2000顆蛋，是自己體重兩倍的蛋量。",
          "工蜂的壽命僅約為6週，但在冬季可以存活數月。",
          "蜜蜂需要採集約2百萬朵花，才能製造出1公斤的蜂蜜。",
          "蜜蜂是唯一會產生人類可以食用的昆蟲。",
          "蜜蜂的飛行速度可達每小時24公里。",
          "蜂巢內溫度恆定在35°C左右，冬季蜜蜂會聚集成團維持溫度。",
          "一個健康的蜂群可有50,000到60,000隻蜜蜂。",
          "蜜蜂透過「搖擺舞」告訴其他蜜蜂食物來源的方向與距離。",
          "全球約75%的農作物在某種程度上依賴蜜蜂授粉。",
          "現代養蜂人面臨的最大挑戰之一是「蜂群崩潰失調症」，造成大量蜜蜂神秘消失。",
          "蜂蜜永遠不會變質，考古學家在古埃及古墓中發現的蜂蜜，數千年後仍可食用。",
        ],
        currentBeeFact: "",

        // 模態框狀態
        isModalActive: false,
        isForagingModalActive: false,

        // 勞力任務
        laborTask: {
          isActive: false,
          name: "",
          clicksNeeded: 0,
          clicksDone: 0,
          onComplete: null,
        },

        // 挑戰顯示狀態
        challengeHidden: false,

        // 病蟲害類型和環境影響類型將在mounted中定義
        pestTypes: [],
        environmentalEvents: [],

        // 遊戲循環計時器
        gameLoopInterval: null,
        saveGameInterval: null,
      };
    },
    computed: {
      healthColorStyle() {
        if (this.gameState.hiveHealth < 30) {
          return { color: "#e53935" }; // 紅色警告
        } else if (this.gameState.hiveHealth < 60) {
          return { color: "#ff9800" }; // 橙色提示
        } else {
          return { color: "#4caf50" }; // 綠色正常
        }
      },
    },
    mounted() {
      this.initGame();
    },
    beforeUnmount() {
      // 清除所有計時器
      clearInterval(this.gameLoopInterval);
      clearInterval(this.saveGameInterval);
    },
    methods: {
      initGame() {
        // 初始化病蟲害類型
        this.initPestTypes();
        // 初始化環境影響類型
        this.initEnvironmentalEvents();

        // 載入已保存的遊戲數據
        this.loadGame();

        // 設置遊戲循環
        this.gameLoopInterval = setInterval(this.gameLoop, 1000);

        // 設置自動保存
        this.saveGameInterval = setInterval(this.saveGame, 30000);

        // 初始化隨機事件
        setInterval(this.maybeStartChallenge, 120000);

        // 初始化養蜂知識
        this.currentBeeFact =
          this.beeFacts[Math.floor(Math.random() * this.beeFacts.length)];
        setInterval(this.updateBeeFact, 60000);

        // 渲染蜜蜂
        this.$nextTick(() => {
          this.renderBees();
        });

        // 顯示歡迎訊息
        this.showNotification(
          "歡迎來到養蜂達人！開始經營你的第一個蜂場吧！",
          "info"
        );

        // 為了示範，立即觸發一個簡單的天氣變化
        setTimeout(() => {
          this.changeWeather("rainy");
        }, 10000);
      },

      // 遊戲循環
      gameLoop() {
        // 計算經過的遊戲時間
        this.gameState.gameTime++;

        // 生產蜂蜜 (每秒執行一次，所以除以60來得到每分鐘的蜂蜜量)
        let honeyProduction =
          (this.gameState.bees *
            this.gameState.honeyPerBeePerMinute *
            this.gameState.weather.effectMultiplier) /
          60;
        this.gameState.honey += honeyProduction;
        this.gameState.totalHoneyCollected += honeyProduction;

        // 天氣系統更新
        if (this.gameState.weather.daysRemaining > 0) {
          this.gameState.weather.daysRemaining--;
          if (this.gameState.weather.daysRemaining === 0) {
            this.changeWeather("sunny"); // 默認恢復晴天
          }
        }

        // 當蜂群健康度低時，可能會損失蜜蜂
        if (
          this.gameState.hiveHealth < 30 &&
          this.gameState.bees > 0 &&
          Math.random() < 0.05
        ) {
          this.gameState.bees--;
          this.showNotification("蜂群健康狀況不佳，失去了1隻蜜蜂！", "warning");
          this.renderBees();
        }
      },

      // 採集蜂蜜
      collectHoney() {
        if (this.gameState.honey <= 0) return;

        // 採集蜂蜜需要付出勞力 (點擊次數)
        this.startLaborTask("採集蜂蜜", 5, () => {
          // 計算蜂蜜價值
          const honeyValue = Math.round(
            this.gameState.honey * this.honeyMarketPrice
          );
          this.gameState.money += honeyValue;

          this.showNotification(
            `成功收穫了 ${this.gameState.honey.toFixed(
              1
            )}kg 蜂蜜，賣出獲得 ${honeyValue} 元！`,
            "success"
          );

          // 每次收穫會更新市場價格
          this.updateHoneyMarketPrice();

          this.gameState.honey = 0;
        });
      },

      // 購買蜜蜂
      buyBee() {
        if (
          this.gameState.money < this.gameState.costs.bee ||
          this.gameState.bees >= this.gameState.hiveCapacity
        )
          return;

        this.gameState.money -= this.gameState.costs.bee;
        this.gameState.bees += 1;

        this.showNotification("購買了1隻新蜜蜂！", "success");
        this.renderBees();
      },

      // 升級蜂巢
      upgradeHive() {
        if (this.gameState.money < this.gameState.costs.hiveUpgrade) return;

        this.gameState.money -= this.gameState.costs.hiveUpgrade;
        this.gameState.hiveLevel += 1;
        this.gameState.hiveCapacity += 5;
        this.gameState.honeyPerBeePerMinute += 0.05;

        // 升級後增加成本
        this.gameState.costs.hiveUpgrade = Math.floor(
          this.gameState.costs.hiveUpgrade * 1.5
        );

        this.showNotification(
          `蜂巢升級到等級 ${this.gameState.hiveLevel}！容量和效率提升了`,
          "success"
        );
      },

      // 檢查蜂巢
      checkHive() {
        // 檢查蜂巢需要付出勞力 (更長的點擊時間)
        this.startLaborTask("檢查蜂巢", 8, () => {
          // 檢查可以發現問題並略微提升蜂群健康
          this.gameState.hiveHealth = Math.min(
            100,
            this.gameState.hiveHealth + 5
          );

          // 隨機發現問題
          if (Math.random() < 0.3 && !this.gameState.currentChallenge) {
            let problemFound = false;

            if (Math.random() < 0.5) {
              // 發現病蟲害問題
              let pest =
                this.pestTypes[
                  Math.floor(Math.random() * this.pestTypes.length)
                ];
              this.startChallenge("pest", pest);
              problemFound = true;
            }

            if (!problemFound) {
              this.showNotification("檢查完成，蜂巢狀況良好！", "success");
            }
          } else {
            this.showNotification("檢查完成，蜂巢狀況良好！", "success");
          }
        });
      },

      // 開始採蜜任務
      startForagingMission(missionData) {
        // 這個方法將由ForagingModal組件調用
        console.log("Starting foraging mission:", missionData);
        // 實現任務邏輯...
      },

      // 出售所有花蜜
      sellAllHoney() {
        // 這個方法將由ForagingModal組件調用
        console.log("Selling all honey");
        // 實現出售邏輯...
      },

      updateSelectedArea(areaId) {
        this.gameState.foraging.selectedArea = areaId;
      },

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
        }
      },

      // 開始勞力任務
      startLaborTask(taskName, clicksNeeded, onComplete) {
        this.laborTask = {
          isActive: true,
          name: taskName,
          clicksNeeded: clicksNeeded,
          clicksDone: 0,
          onComplete: onComplete,
        };
      },

      // 完成勞力任務
      completeLaborTask(clicksDone) {
        // 更新任務狀態
        this.laborTask.clicksDone += clicksDone;
        this.laborTask.isActive = false;

        // 執行任務完成後的邏輯
        if (this.laborTask.onComplete) {
          this.laborTask.onComplete();
        }
      },

      // 顯示通知
      showNotification(message, type = "info") {
        const notificationArea = document.querySelector(".notification-area");
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notificationArea.appendChild(notification);

        // 3秒後自動消失
        setTimeout(() => {
          notification.style.animation = "slideOut 0.3s forwards";
          setTimeout(() => {
            notification.remove();
          }, 300);
        }, 3000);
      },

      // 變更天氣
      changeWeather(weatherType) {
        this.gameState.weather.current = weatherType;
        this.gameState.weather.effectMultiplier =
          this.weatherTypes[weatherType].effect;

        // 天氣持續3-7天
        this.gameState.weather.daysRemaining =
          Math.floor(Math.random() * 5) + 3;

        // 如果天氣不是晴天，則可能觸發天氣挑戰
        if (weatherType !== "sunny") {
          this.startWeatherChallenge(weatherType);
        }

        this.showNotification(
          `天氣變化：${this.weatherTypes[weatherType].name}！${this.weatherTypes[weatherType].description}`,
          "info"
        );
      },

      // 啟動天氣挑戰
      startWeatherChallenge(weatherType) {
        if (this.gameState.currentChallenge) return; // 如果已有挑戰，不再觸發新挑戰

        let challenge = {
          id: weatherType,
          title: this.weatherTypes[weatherType].name,
          description: `${
            this.weatherTypes[weatherType].description
          }，蜂蜜產量降低到${this.weatherTypes[weatherType].effect * 100}%！`,
          solutions: [],
        };

        switch (weatherType) {
          case "rainy":
            challenge.solutions = [
              {
                name: "準備糖水餵食 (¥50)",
                cost: 50,
                effectText: "蜜蜂獲得額外糖水，保持了活力",
                effect: () => {
                  this.gameState.money -= 50;
                  this.gameState.weather.effectMultiplier += 0.2; // 略微提升效率
                  return true;
                },
              },
              {
                name: "等待天氣好轉",
                cost: 0,
                effectText: "只能等待雨停...",
                effect: () => {
                  return true;
                },
              },
            ];
            break;

          case "drought":
            challenge.solutions = [
              {
                name: "遷移蜂箱 (¥100)",
                cost: 100,
                effectText: "蜂箱遷移到有更多蜜源的地方",
                effect: () => {
                  this.gameState.money -= 100;
                  this.gameState.weather.effectMultiplier += 0.3;
                  return true;
                },
              },
              {
                name: "自行種植蜜源植物 (¥70)",
                cost: 70,
                effectText: "種植的花朵提供了部分蜜源",
                effect: () => {
                  this.gameState.money -= 70;
                  this.gameState.weather.effectMultiplier += 0.2;
                  return true;
                },
              },
            ];
            break;

          case "cold":
            challenge.solutions = [
              {
                name: "加固蜂箱保溫 (¥80)",
                cost: 80,
                effectText: "蜂箱保溫效果提升，蜜蜂活動增加",
                effect: () => {
                  this.gameState.money -= 80;
                  this.gameState.weather.effectMultiplier += 0.3;
                  return true;
                },
              },
              {
                name: "購買糖漿餵食 (¥60)",
                cost: 60,
                effectText: "糖漿提供能量，幫助蜜蜂度過寒冷",
                effect: () => {
                  this.gameState.money -= 60;
                  this.gameState.weather.effectMultiplier += 0.2;
                  return true;
                },
              },
            ];
            break;
        }

        this.startChallenge("weather", challenge);
      },

      // 隨機可能觸發挑戰
      maybeStartChallenge() {
        if (this.gameState.currentChallenge || Math.random() > 0.3) return; // 30%機率觸發

        let challengeTypes = ["pest", "environmental"];
        let type =
          challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

        if (type === "pest") {
          let pest =
            this.pestTypes[Math.floor(Math.random() * this.pestTypes.length)];
          this.startChallenge("pest", pest);
        } else if (type === "environmental") {
          let envEvent =
            this.environmentalEvents[
              Math.floor(Math.random() * this.environmentalEvents.length)
            ];
          this.startChallenge("environment", envEvent);
        }
      },

      // 啟動挑戰
      startChallenge(type, challenge) {
        this.gameState.currentChallenge = {
          type: type,
          data: challenge,
          startTime: Date.now(),
        };

        this.challengeHidden = false;

        // 顯示通知
        this.showNotification(`警告：${challenge.title}！`, "warning");

        // 設定計時器，如果沒解決則觸發後果
        setTimeout(() => {
          if (
            this.gameState.currentChallenge &&
            this.gameState.currentChallenge.type === type &&
            this.gameState.currentChallenge.data.id === challenge.id
          ) {
            // 執行後果
            if (challenge.consequence) {
              challenge.consequence();
            }

            // 移除挑戰
            this.challengeHidden = true;
            this.gameState.currentChallenge = null;
          }
        }, 120000); // 2分鐘後觸發後果
      },

      // 應用解決方案
      applySolution(solution) {
        // 檢查是否有足夠金錢
        if (solution.cost > this.gameState.money) {
          this.showNotification(
            `金錢不足！需要 ${solution.cost} 元`,
            "warning"
          );
          return;
        }

        // 執行解決方案
        let result = solution.effect();
        if (result) {
          // 解決方案生效
          this.showNotification(solution.effectText, "success");
          this.gameState.challengesSolved++;

          // 移除挑戰
          this.challengeHidden = true;
          this.gameState.currentChallenge = null;
        }
      },

      // 更新蜂蜜市場價格
      updateHoneyMarketPrice() {
        // 隨機波動，但保持在7-13元/kg之間
        let change = (Math.random() - 0.5) * 3;
        this.honeyMarketPrice = Math.min(
          13,
          Math.max(7, this.honeyMarketPrice + change)
        );
        this.showNotification(
          `蜂蜜市場價格更新：${this.honeyMarketPrice.toFixed(1)}元/kg`,
          "info"
        );
      },

      // 渲染蜜蜂動畫
      renderBees() {
        const hiveContainer = this.$refs.hiveContainer;
        if (!hiveContainer) return;

        // 清空現有蜜蜂
        while (hiveContainer.firstChild) {
          hiveContainer.removeChild(hiveContainer.firstChild);
        }

        // 添加蜜蜂
        for (let i = 0; i < this.gameState.bees; i++) {
          const bee = document.createElement("div");
          bee.className = "bee";

          // 隨機位置
          let left = Math.random() * 80 + 10; // 10% to 90%
          let top = Math.random() * 80 + 10; // 10% to 90%

          bee.style.left = `${left}%`;
          bee.style.top = `${top}%`;

          // 隨機飛行動畫延遲，讓蜜蜂不同步移動
          bee.style.animationDelay = `${Math.random() * 5}s`;

          hiveContainer.appendChild(bee);
        }
      },

      // 更新養蜂知識
      updateBeeFact() {
        this.currentBeeFact =
          this.beeFacts[Math.floor(Math.random() * this.beeFacts.length)];
      },

      // 保存遊戲
      saveGame() {
        localStorage.setItem("beekeeperGame", JSON.stringify(this.gameState));
        this.gameState.lastSaveTime = Date.now();
      },

      // 加載遊戲
      loadGame() {
        const savedGame = localStorage.getItem("beekeeperGame");
        if (savedGame) {
          try {
            const parsed = JSON.parse(savedGame);
            // 只讀取需要的數據，避免版本問題
            this.gameState.bees = parsed.bees || 0;
            this.gameState.honey = parsed.honey || 0;
            this.gameState.money = parsed.money || 100;
            this.gameState.hiveLevel = parsed.hiveLevel || 1;
            this.gameState.hiveHealth = parsed.hiveHealth || 100;
            this.gameState.hiveCapacity = parsed.hiveCapacity || 10;
            this.gameState.honeyPerBeePerMinute =
              parsed.honeyPerBeePerMinute || 0.1;
            this.gameState.totalHoneyCollected =
              parsed.totalHoneyCollected || 0;
            this.gameState.challengesSolved = parsed.challengesSolved || 0;
            this.gameState.costs = parsed.costs || {
              bee: 50,
              hiveUpgrade: 200,
            };

            // 檢測離線時間並計算資源
            const currentTime = Date.now();
            const offlineTimeMinutes =
              (currentTime - (parsed.lastSaveTime || currentTime)) /
              (1000 * 60);

            if (offlineTimeMinutes > 5) {
              // 如果離線超過5分鐘
              // 計算離線時的蜂蜜生產（考慮效率降低）
              const offlineHoney =
                this.gameState.bees *
                this.gameState.honeyPerBeePerMinute *
                offlineTimeMinutes *
                0.5; // 效率降為50%
              this.gameState.honey += offlineHoney;

              // 顯示離線收益
              setTimeout(() => {
                this.showNotification(
                  `你離開了${Math.floor(
                    offlineTimeMinutes
                  )}分鐘，蜜蜂在此期間產出了${offlineHoney.toFixed(1)}kg蜂蜜！`,
                  "success"
                );
              }, 1000);
            }
          } catch (e) {
            console.error("Error loading saved game", e);
            // 如果讀取出錯，使用默認值
          }
        }
      },

      // 初始化病蟲害類型
      initPestTypes() {
        this.pestTypes = [
          {
            id: "mite",
            title: "蜂螨爆發",
            description: "蜂螨正在侵擾你的蜂群，可能導致蜜蜂生病或死亡！",
            severity: "high",
            solutions: [
              {
                name: "購買藥劑治療",
                cost: 150,
                effectText: "蜂群已被治療，健康恢復中",
                effect: () => {
                  this.gameState.money -= 150;
                  this.gameState.hiveHealth = Math.min(
                    100,
                    this.gameState.hiveHealth + 30
                  );
                  return true;
                },
              },
              {
                name: "自然療法 (風險更高)",
                cost: 50,
                effectText: "自然療法效果有限，蜂群仍有風險",
                effect: () => {
                  this.gameState.money -= 50;
                  let success = Math.random() > 0.4; // 60%成功率
                  if (success) {
                    this.gameState.hiveHealth = Math.min(
                      100,
                      this.gameState.hiveHealth + 15
                    );
                    return true;
                  } else {
                    this.gameState.hiveHealth -= 10;
                    this.showNotification(
                      "自然療法失敗，蜂群健康度下降！",
                      "warning"
                    );
                    return false;
                  }
                },
              },
            ],
            consequence: () => {
              this.gameState.hiveHealth -= 20;
              if (this.gameState.bees > 0) this.gameState.bees--;
              this.showNotification("蜂螨危機惡化！蜜蜂數量減少", "danger");
              this.renderBees();
            },
          },
          {
            id: "hornet",
            title: "胡蜂入侵",
            description: "一群胡蜂正在攻擊你的蜂巢，蜜蜂恐慌中！",
            severity: "medium",
            solutions: [
              {
                name: "設置胡蜂陷阱",
                cost: 100,
                effectText: "陷阱成功捕獲胡蜂，威脅解除",
                effect: () => {
                  this.gameState.money -= 100;
                  return true;
                },
              },
              {
                name: "手動驅趕 (需要勞力)",
                cost: 0,
                effectText: "經過辛苦驅趕，胡蜂暫時離開了",
                effect: () => {
                  // 模擬需要重複點擊才能成功的勞動過程
                  this.startLaborTask("驅趕胡蜂", 10, () => {
                    return true;
                  });
                  return false; // 返回false因為任務尚未完成
                },
              },
            ],
            consequence: () => {
              let lossBees = Math.max(1, Math.floor(this.gameState.bees * 0.2));
              this.gameState.bees -= lossBees;
              this.showNotification(
                `胡蜂攻擊造成${lossBees}隻蜜蜂損失！`,
                "danger"
              );
              this.renderBees();
            },
          },
        ];
      },

      // 初始化環境影響類型
      initEnvironmentalEvents() {
        this.environmentalEvents = [
          {
            id: "pesticide",
            title: "周圍農田噴灑農藥",
            description: "鄰近農田正大量噴灑農藥，你的蜜蜂可能會中毒！",
            severity: "high",
            solutions: [
              {
                name: "緊急遷移蜂箱",
                cost: 200,
                effectText: "蜂箱已遷移至安全地點，但過程中損失了一些蜂蜜",
                effect: () => {
                  this.gameState.money -= 200;
                  this.gameState.honey *= 0.7; // 損失30%蜂蜜
                  return true;
                },
              },
              {
                name: "關閉蜂箱入口 (暫停生產)",
                cost: 0,
                effectText: "蜂箱入口已關閉，蜜蜂安全但無法生產",
                effect: () => {
                  // 暫停產蜜1分鐘
                  const originalMultiplier =
                    this.gameState.weather.effectMultiplier;
                  this.gameState.weather.effectMultiplier = 0;
                  this.showNotification("蜂箱入口關閉，產蜜暫停1分鐘", "info");
                  setTimeout(() => {
                    this.gameState.weather.effectMultiplier =
                      originalMultiplier;
                    this.showNotification("蜂箱入口已重新開啟", "info");
                  }, 60000);
                  return true;
                },
              },
            ],
            consequence: () => {
              let lossBees = Math.max(2, Math.floor(this.gameState.bees * 0.3));
              this.gameState.bees -= lossBees;
              this.gameState.hiveHealth -= 15;
              this.showNotification(
                `${lossBees}隻蜜蜂因農藥中毒死亡！蜂群健康受損`,
                "danger"
              );
              this.renderBees();
            },
          },
        ];
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
    position: absolute;
    width: 20px;
    height: 20px;
    background: url("@/assets/images/bee-sprite.png") no-repeat;
    animation: fly 5s infinite alternate;
  }

  @keyframes fly {
    0% {
      transform: translate(0, 0) rotate(10deg);
    }
    25% {
      transform: translate(10px, 15px) rotate(-5deg);
    }
    50% {
      transform: translate(-5px, 10px) rotate(15deg);
    }
    75% {
      transform: translate(15px, -10px) rotate(-10deg);
    }
    100% {
      transform: translate(-10px, -15px) rotate(5deg);
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
