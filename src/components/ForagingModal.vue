<template>
  <div class="modal" :class="{ active: isActive, hidden: !isActive }">
    <div class="modal-header">
      <h2>採蜜任務中心</h2>
      <button class="modal-close" @click="$emit('close-modal')">&times;</button>
    </div>
    <div class="modal-content">
      <div class="modal-tabs">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 採蜜區域標籤頁 -->
        <div :class="['tab-pane', { active: activeTab === 'areas-tab' }]">
          <div class="area-selection">
            <h3>選擇採蜜區域</h3>
            <div class="area-grid">
              <div
                v-for="area in areas"
                :key="area.id"
                :class="[
                  'area-card',
                  {
                    locked: area.locked,
                    selected: selectedArea === area.id,
                  },
                ]"
                :data-area="area.id"
                @click="selectArea(area)"
              >
                <div :class="['area-image', area.id]"></div>
                <h4>{{ area.name }}</h4>
                <p>{{ area.description }}</p>
                <div v-if="!area.locked" class="area-stats">
                  <span class="area-stat"
                    >收益：<span class="yield">{{ area.yield }}</span></span
                  >
                  <span class="area-stat"
                    >風險：<span :class="['risk', area.riskLevel]">{{
                      area.risk
                    }}</span></span
                  >
                  <span class="area-stat"
                    >時間：<span class="time">{{ area.time }}</span></span
                  >
                </div>
                <div v-if="area.locked" class="lock-icon">🔒</div>
              </div>
            </div>
          </div>

          <div class="mission-setup">
            <h3>派遣採蜜隊伍</h3>
            <div class="mission-form">
              <div class="form-group">
                <label for="bees-assigned">指派蜜蜂數量：</label>
                <div class="slider-container">
                  <input
                    type="range"
                    id="bees-assigned"
                    :min="1"
                    :max="maxBeesAssignable"
                    v-model.number="beesAssigned"
                    class="slider"
                  />
                  <span>{{ beesAssigned }}</span> 隻
                </div>
              </div>
              <div class="form-group">
                <label>採集時間：</label>
                <div class="duration-buttons">
                  <button
                    type="button"
                    class="duration-button"
                    :class="{ active: missionDuration === 'short' }"
                    @click="missionDuration = 'short'"
                  >
                    短程
                  </button>
                  <button
                    type="button"
                    class="duration-button"
                    :class="{ active: missionDuration === 'medium' }"
                    @click="missionDuration = 'medium'"
                  >
                    中程
                  </button>
                  <button
                    type="button"
                    class="duration-button"
                    :class="{ active: missionDuration === 'long' }"
                    @click="missionDuration = 'long'"
                  >
                    長程
                  </button>
                </div>
              </div>
              <div class="form-info">
                <div>
                  預計收穫：<span>{{ expectedYield }}</span>
                </div>
                <div>
                  風險評估：<span>{{ missionRisk }}</span>
                </div>
              </div>
              <button
                @click="startMission"
                class="game-button mission-button"
                :disabled="!canStartMission"
              >
                開始採蜜任務
              </button>
            </div>
          </div>
        </div>

        <!-- 進行中任務標籤頁 -->
        <div :class="['tab-pane', { active: activeTab === 'missions-tab' }]">
          <h3>進行中的任務</h3>
          <div class="missions-container">
            <div v-if="activeMissions.length === 0" class="empty-missions">
              目前沒有進行中的採蜜任務
            </div>
            <div
              v-for="(mission, index) in localMissions"
              :key="mission.id || index"
              class="mission-card"
            >
              <div class="mission-header">
                <div>
                  <div class="mission-title">採蜜任務 #{{ index + 1 }}</div>
                  <div class="mission-area">
                    {{ getAreaName(mission.area) }}
                  </div>
                </div>
                <div class="mission-timer">
                  {{ formatTime(mission.timeRemaining) }}
                </div>
              </div>
              <div class="mission-details">
                <div>指派蜜蜂：{{ mission.bees }} 隻</div>
                <div>風險等級：{{ mission.risk }}</div>
              </div>
              <div class="mission-progress">
                <div
                  class="progress-bar"
                  :style="{ width: mission.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 替換花蜜收集標籤頁為戰損報告標籤頁 -->
        <div :class="['tab-pane', { active: activeTab === 'report-tab' }]">
          <h3>採蜜任務報告</h3>

          <div class="report-section">
            <h4>總體統計</h4>
            <div class="report-stats">
              <div class="stat-item">
                <div class="stat-label">總採蜜任務</div>
                <div class="stat-value">{{ missionStats.totalMissions }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">成功任務</div>
                <div class="stat-value">{{ missionStats.successMissions }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">失敗任務</div>
                <div class="stat-value">{{ missionStats.failedMissions }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">成功率</div>
                <div class="stat-value">{{ calculateSuccessRate() }}%</div>
              </div>
            </div>
          </div>

          <div class="report-section">
            <h4>蜂蜜收穫統計 (已存入倉庫)</h4>
            <div class="honey-stats">
              <div
                v-for="honey in honeyTypes"
                :key="honey.id"
                class="honey-stat"
              >
                <div
                  class="honey-icon"
                  :style="{ backgroundColor: getHoneyColor(honey.id) }"
                ></div>
                <div class="honey-name">{{ honey.name }}</div>
                <div class="honey-amount">
                  {{ getHoneyAmount(honey.id) }} kg
                </div>
                <div class="honey-value">
                  價值: {{ calculateHoneyValue(honey.id) }} 元
                </div>
              </div>
            </div>
            <div class="total-honey">
              <div>總收穫量: {{ calculateTotalHoney() }} kg</div>
              <div>總價值: {{ calculateTotalValue() }} 元</div>
              <div class="storage-status">
                <span class="status-icon">✓</span> 已存入倉庫
              </div>
            </div>
          </div>

          <div class="report-section">
            <h4>最近任務記錄</h4>
            <div class="mission-history">
              <div v-if="missionHistory.length === 0" class="empty-history">
                尚無任務記錄
              </div>
              <div
                v-for="(mission, index) in missionHistory"
                :key="index"
                class="mission-record"
              >
                <div class="mission-record-header">
                  <div
                    :class="[
                      'status-indicator',
                      mission.success ? 'success' : 'failure',
                    ]"
                  ></div>
                  <div class="mission-area-name">
                    {{ getAreaName(mission.area) }}
                  </div>
                  <div class="mission-date">{{ formatDate(mission.date) }}</div>
                </div>
                <div class="mission-record-details">
                  <div>蜜蜂數量: {{ mission.bees }} 隻</div>
                  <div>風險等級: {{ mission.risk }}</div>
                  <div v-if="mission.success" class="mission-harvest">
                    <div class="harvest-header">收穫:</div>
                    <div class="harvest-grid">
                      <div
                        v-for="item in formatHoneyGain(mission.rewards)"
                        :key="item.id"
                        class="harvest-item"
                      >
                        <div
                          class="honey-dot"
                          :style="{ backgroundColor: getHoneyColor(item.id) }"
                        ></div>
                        <div class="honey-info">
                          <span class="honey-name">{{ item.name }}</span>
                          <span
                            class="honey-amount"
                            :class="{ zero: item.amount === 0 }"
                          >
                            {{ item.amount.toFixed(1) }} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    損失:
                    {{
                      mission.lostBees > 0 ? `${mission.lostBees} 隻蜜蜂` : "無"
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState, mapActions } from "vuex";

  export default {
    name: "ForagingModal",
    props: {
      isActive: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        activeTab: "areas-tab",
        beesAssigned: 1,
        missionDuration: "short",
        selectedArea: null, // 本地追蹤選擇的區域
        tabs: [
          { id: "areas-tab", name: "採蜜區域" },
          { id: "missions-tab", name: "進行中任務" },
          { id: "report-tab", name: "採蜜報告" },
        ],
        missionStats: {
          totalMissions: 0,
          successMissions: 0,
          failedMissions: 0,
        },
        missionHistory: [], // 最近的任務記錄

        // 蜂蜜顏色
        honeyColors: {
          common: "#ffcc00",
          wildflower: "#ffa64d",
          mountain: "#996633",
          rare: "#e64d00",
        },
        areas: [
          {
            id: "meadow",
            name: "花草草地",
            description: "常見花蜜，安全性高",
            yield: "普通",
            risk: "低",
            riskLevel: "low",
            time: "短",
            locked: false,
          },
          {
            id: "forest",
            name: "深林山谷",
            description: "野花蜜源，品質較佳",
            yield: "良好",
            risk: "中",
            riskLevel: "medium",
            time: "中",
            locked: false,
          },
          {
            id: "mountain",
            name: "高山草原",
            description: "高海拔蜜源，稀有花種",
            yield: "優質",
            risk: "高",
            riskLevel: "high",
            time: "長",
            locked: false,
          },
          {
            id: "orchard",
            name: "果園花區",
            description: "需達到蜂巢3級解鎖",
            locked: true,
            minLevel: 3,
          },
          {
            id: "rare",
            name: "稀有花園",
            description: "需達到蜂巢5級解鎖",
            locked: true,
            minLevel: 5,
          },
        ],
        honeyTypes: [
          { id: "common", name: "普通花蜜", price: 10 },
          { id: "wildflower", name: "野花蜜", price: 15 },
          { id: "mountain", name: "高山花蜜", price: 25 },
          { id: "rare", name: "稀有花蜜", price: 50 },
        ],
        missionTimer: null, // 用於定時更新任務時間的計時器
        localMissions: [],
      };
    },
    computed: {
      ...mapState({
        bees: (state) => state.bees.bees,
        hiveLevel: (state) => state.bees.hiveLevel,
        storeSelectedArea: (state) => state.foraging.selectedArea,
        foragingAreas: (state) => state.foraging.areas,
        activeMissions: (state) => state.foraging.activeMissions,
        honeyCollected: (state) => state.foraging.honeyCollected,
        storedMissionStats: (state) => state.foraging.missionStats,
        storedMissionHistory: (state) => state.foraging.missionHistory,
      }),
      maxBeesAssignable() {
        // 考慮可用蜜蜂數量而不是總數
        const availableBees = this.bees - this.calculateAssignedBees();

        // 確保有足夠蜜蜂滿足所選區域的最低需求
        if (this.selectedArea) {
          const area = this.foragingAreas[this.selectedArea];
          if (area && availableBees < area.beeCount) {
            return 0; // 不夠滿足最低需求
          }
        }

        return Math.min(10, availableBees); // 最多可派遣10隻蜜蜂
      },
      expectedYield() {
        if (!this.selectedArea) return "請選擇區域";

        const area = this.areas.find((a) => a.id === this.selectedArea);
        let yieldValue = "";

        switch (area.id) {
          case "meadow":
            yieldValue =
              this.beesAssigned <= 2 ? "少量普通花蜜" : "中量普通花蜜";
            break;
          case "forest":
            yieldValue = this.beesAssigned <= 2 ? "少量野花蜜" : "中量野花蜜";
            break;
          case "mountain":
            yieldValue =
              this.beesAssigned <= 2 ? "少量高山花蜜" : "中量高山花蜜";
            break;
          default:
            yieldValue = "少量普通花蜜";
        }

        if (this.missionDuration === "medium") {
          yieldValue = yieldValue
            .replace("少量", "中量")
            .replace("中量", "大量");
        } else if (this.missionDuration === "long") {
          yieldValue = yieldValue
            .replace("少量", "大量")
            .replace("中量", "豐富");
        }

        return yieldValue;
      },
      missionRisk() {
        if (!this.selectedArea) return "未知";

        const area = this.areas.find((a) => a.id === this.selectedArea);
        let risk = "";

        switch (area.riskLevel) {
          case "low":
            risk = this.beesAssigned <= 2 ? "極低" : "低";
            break;
          case "medium":
            risk = this.beesAssigned <= 2 ? "低" : "中";
            break;
          case "high":
            risk = this.beesAssigned <= 2 ? "中" : "高";
            break;
          default:
            risk = "未知";
        }

        if (this.missionDuration === "medium") {
          if (risk === "極低") risk = "低";
          else if (risk === "低") risk = "中";
          else if (risk === "中") risk = "高";
        } else if (this.missionDuration === "long") {
          if (risk === "極低") risk = "中";
          else if (risk === "低") risk = "高";
          else if (risk === "中") risk = "極高";
        }

        return risk;
      },
      canStartMission() {
        return (
          this.selectedArea &&
          this.beesAssigned > 0 &&
          this.beesAssigned <= this.bees
        );
      },
    },
    watch: {
      // 當 store 中的 selectedArea 變化時同步到本地狀態
      storeSelectedArea(newVal) {
        this.selectedArea = newVal;
      },
      storedMissionStats: {
        handler(newVal) {
          this.missionStats = { ...newVal };
        },
        deep: true,
        immediate: true,
      },
      storedMissionHistory: {
        handler(newVal) {
          this.missionHistory = [...newVal];
        },
        deep: true,
        immediate: true,
      },
      activeMissions: {
        handler(missions) {
          console.log("活動任務更新:", missions.length);
          this.updateLocalMissions(missions);
        },
        deep: true,
        immediate: true,
      },
    },
    mounted() {
      // 更新區域解鎖狀態
      this.checkAndUnlockAreas();

      // 初始化本地區域選擇狀態
      this.selectedArea = this.storeSelectedArea;
      this.startMissionTimer();
    },
    updated() {
      // 如果是進行中任務標籤頁，確保計時器啟動
      if (
        this.activeTab === "missions-tab" &&
        this.activeMissions.length > 0 &&
        !this.missionTimer
      ) {
        this.startMissionTimer();
      }
    },
    beforeUnmount() {
      // 組件銷毀前清除計時器
      this.clearMissionTimer();
    },

    methods: {
      ...mapActions({
        updateSelectedArea: "foraging/selectArea",
        startForagingMission: "foraging/startForagingMission",
      }),
      selectArea(area) {
        if (area.locked) return;

        // 更新本地選擇狀態
        this.selectedArea = area.id;

        // 通過 Vuex action 更新全局狀態
        this.updateSelectedArea(area.id);
      },

      startMission() {
        if (!this.canStartMission) return;

        const area = this.foragingAreas[this.selectedArea];
        if (area) {
          console.log(`該區域基礎時間: ${area.baseDuration}秒`);
        }

        const missionData = {
          area: this.selectedArea,
          bees: parseInt(this.beesAssigned),
          duration: this.missionDuration,
          risk: this.missionRisk,
        };

        // 使用 Vuex action 啟動任務
        this.startForagingMission(missionData);

        // 重置表單
        this.beesAssigned = 1;
        this.missionDuration = "short";

        // 切換到進行中任務標籤
        this.activeTab = "missions-tab";

        // 可選：平滑滾動到頂部
        this.$nextTick(() => {
          const modalContent = document.querySelector(".modal-content");
          if (modalContent) {
            modalContent.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
        });
      },

      checkAndUnlockAreas() {
        // 根據蜂巢等級解鎖區域，但只更新本地數據
        this.areas.forEach((area) => {
          if (area.minLevel && this.hiveLevel >= area.minLevel) {
            area.locked = false;
          }
        });
      },

      getAreaName(areaId) {
        const area = this.areas.find((a) => a.id === areaId);
        return area ? area.name : "未知區域";
      },

      formatTime(seconds) {
        if (!seconds && seconds !== 0) return "--:--";

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs
          .toString()
          .padStart(2, "0")}`;
      },

      getHoneyAmount(honeyType) {
        // 安全地獲取蜂蜜數量，避免未定義錯誤
        if (
          this.honeyCollected &&
          this.honeyCollected[honeyType] !== undefined
        ) {
          return this.honeyCollected[honeyType].toFixed(1);
        }
        return "0.0";
      },

      // 計算成功率
      calculateSuccessRate() {
        if (this.missionStats.totalMissions === 0) return "0.0";
        const rate =
          (this.missionStats.successMissions /
            this.missionStats.totalMissions) *
          100;
        return rate.toFixed(1);
      },

      // 獲取蜂蜜顏色
      getHoneyColor(type) {
        return this.honeyColors[type] || "#ffcc00";
      },

      // 計算蜂蜜價值
      calculateHoneyValue(type) {
        const honey = this.honeyTypes.find((h) => h.id === type);
        const amount = this.getHoneyAmount(type);
        return (honey.price * parseFloat(amount)).toFixed(0);
      },

      // 計算總蜂蜜量
      calculateTotalHoney() {
        if (!this.honeyCollected) return "0.0";

        const total = Object.values(this.honeyCollected).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        return total.toFixed(1);
      },

      // 計算總價值
      calculateTotalValue() {
        if (!this.honeyCollected) return "0";

        let total = 0;
        this.honeyTypes.forEach((honey) => {
          const amount = this.honeyCollected[honey.id] || 0;
          total += amount * honey.price;
        });

        return total.toFixed(0);
      },

      calculateAssignedBees() {
        return this.activeMissions.reduce((total, mission) => {
          return total + mission.bees;
        }, 0);
      },

      // 格式化日期
      formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${
          date.getMonth() + 1
        }/${date.getDate()} ${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      },

      // 格式化蜂蜜獲取
      formatHoneyGain(rewards) {
        if (!rewards) return "無收穫";

        // 列出所有蜂蜜類型
        const allTypes = this.honeyTypes.map((h) => h.id);

        // 使用表格格式顯示所有蜂蜜類型的收穫
        return allTypes.map((type) => {
          const honey = this.honeyTypes.find((h) => h.id === type);
          const amount = rewards[type] || 0;
          return {
            id: type,
            name: honey ? honey.name : type,
            amount: amount,
          };
        });
      },

      updateLocalMissions(missions) {
        this.localMissions = missions.map((mission) => {
          // 計算剩餘時間（毫秒）
          const now = Date.now();
          const timeRemaining = Math.max(0, mission.endTime - now);

          // 計算進度百分比
          const totalDuration = mission.endTime - mission.startTime;
          const elapsed = now - mission.startTime;
          const progress = Math.min(
            100,
            Math.max(0, (elapsed / totalDuration) * 100)
          );

          return {
            ...mission,
            timeRemaining: Math.floor(timeRemaining / 1000), // 轉換為秒
            progress: progress.toFixed(1),
          };
        });
      },

      // 開始計時器，定期更新任務時間
      startMissionTimer() {
        // 先清除現有計時器
        this.clearMissionTimer();

        // 設置新計時器，每秒更新一次
        this.missionTimer = setInterval(() => {
          if (this.activeMissions.length > 0) {
            this.updateLocalMissions(this.activeMissions);
          } else {
            this.clearMissionTimer();
          }
        }, 1000);
      },

      // 清除計時器
      clearMissionTimer() {
        if (this.missionTimer) {
          clearInterval(this.missionTimer);
          this.missionTimer = null;
        }
      },
    },
  };
</script>

<style scoped>
  /* 這裡可以放置組件特定樣式，但大部分樣式已在全局CSS中定義 */
  .modal-tabs {
    display: flex;
    background-color: #f5f0e5;
    border-bottom: 1px solid #e0d8c8;
  }

  .tab-button {
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 1rem;
    color: #8c6d3c;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    background-color: #f8f5ee;
    color: #5d4215;
  }

  .tab-button.active {
    border-bottom-color: #ffc226;
    color: #5d4215;
    font-weight: bold;
  }

  .tab-content {
    padding: 20px;
  }

  .tab-pane {
    display: none;
  }

  .tab-pane.active {
    display: block;
  }

  .honey-types {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
    margin: 15px 0;
  }

  .area-card.selected {
    background-color: #fff0c8;
    box-shadow: 0 0 0 2px #ffb300, 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .report-section {
    margin-bottom: 25px;
    background-color: #fff;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .report-section h4 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #5d4215;
    border-bottom: 1px solid #e0d8c8;
    padding-bottom: 8px;
  }

  .report-stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }

  .stat-item {
    text-align: center;
    padding: 10px;
    background-color: #f9f5ea;
    border-radius: 6px;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #8c6d3c;
    margin-bottom: 5px;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #5d4215;
  }

  .honey-stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 15px;
  }

  .honey-stat {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background-color: #f9f5ea;
    border-radius: 6px;
  }

  .honey-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-bottom: 8px;
  }

  .honey-name {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .honey-amount {
    color: #8c6d3c;
  }

  .honey-value {
    color: #5d4215;
    font-size: 0.9rem;
  }

  .duration-buttons {
    display: flex;
    gap: 8px;
    margin-top: 5px;
  }

  .duration-button {
    flex: 1;
    padding: 8px 0;
    background-color: #f9f5ea;
    border: 1px solid #e0d8c8;
    border-radius: 4px;
    color: #8c6d3c;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .duration-button:hover {
    background-color: #f5efe0;
    border-color: #d5c9b0;
  }

  .duration-button.active {
    background-color: #ffc226;
    border-color: #ffb300;
    color: #5d4215;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .total-honey {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background-color: #fff0c8;
    border-radius: 6px;
    font-weight: bold;
    color: #5d4215;
  }

  .mission-harvest {
    grid-column: 1 / -1;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e0d8c8;
  }

  .harvest-header {
    font-weight: bold;
    margin-bottom: 5px;
    color: #5d4215;
  }

  .harvest-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .harvest-item {
    display: flex;
    align-items: center;
  }

  .honey-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .honey-info {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
    font-size: 0.85rem;
  }

  .honey-name {
    color: #8c6d3c;
  }

  .honey-amount {
    font-weight: bold;
    color: #5d4215;
  }

  .honey-amount.zero {
    color: #aaa;
    font-weight: normal;
  }

  .storage-status {
    margin-top: 8px;
    font-size: 0.9rem;
    color: #4caf50;
    display: flex;
    align-items: center;
  }

  .status-icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
    background-color: #4caf50;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    margin-right: 5px;
  }

  /* 當螢幕較小時改為單欄顯示 */
  @media (max-width: 500px) {
    .harvest-grid {
      grid-template-columns: 1fr;
    }
  }

  .mission-history {
    max-height: 300px;
    overflow-y: auto;
  }

  .mission-record {
    padding: 10px;
    background-color: #f9f5ea;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .mission-record-header {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
  }

  .status-indicator.success {
    background-color: #4caf50;
  }

  .status-indicator.failure {
    background-color: #f44336;
  }

  .mission-area-name {
    font-weight: bold;
    margin-right: auto;
  }

  .mission-date {
    font-size: 0.8rem;
    color: #8c6d3c;
  }

  .mission-record-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    font-size: 0.9rem;
    color: #5d4215;
  }

  .empty-history {
    text-align: center;
    padding: 20px;
    color: #8c6d3c;
    font-style: italic;
  }
</style>
