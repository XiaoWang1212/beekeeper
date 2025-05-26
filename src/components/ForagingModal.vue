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
            @click="activeTab = tab.id">
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
                  :class="['area-card', { 
                    locked: area.locked, 
                    selected: selectedArea === area.id 
                  }]"
                  :data-area="area.id"
                  @click="selectArea(area)">
                  <div :class="['area-image', area.id]"></div>
                  <h4>{{ area.name }}</h4>
                  <p>{{ area.description }}</p>
                  <div v-if="!area.locked" class="area-stats">
                    <span class="area-stat">收益：<span class="yield">{{ area.yield }}</span></span>
                    <span class="area-stat">風險：<span :class="['risk', area.riskLevel]">{{ area.risk }}</span></span>
                    <span class="area-stat">時間：<span class="time">{{ area.time }}</span></span>
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
                      v-model="beesAssigned"
                      class="slider"
                    />
                    <span>{{ beesAssigned }}</span> 隻
                  </div>
                </div>
                <div class="form-group">
                  <label for="mission-duration">採集時間：</label>
                  <select id="mission-duration" v-model="missionDuration">
                    <option value="short">短程(30秒)</option>
                    <option value="medium">中程(60秒)</option>
                    <option value="long">長程(120秒)</option>
                  </select>
                </div>
                <div class="form-info">
                  <div>預計收穫：<span>{{ expectedYield }}</span></div>
                  <div>風險評估：<span>{{ missionRisk }}</span></div>
                </div>
                <button
                  @click="startMission"
                  class="game-button mission-button"
                  :disabled="!canStartMission">
                  開始採蜜任務
                </button>
              </div>
            </div>
          </div>
  
          <!-- 進行中任務標籤頁 -->
          <div :class="['tab-pane', { active: activeTab === 'missions-tab' }]">
            <h3>進行中的任務</h3>
            <div class="missions-container">
              <div v-if="gameState.foraging.activeMissions.length === 0" class="empty-missions">
                目前沒有進行中的採蜜任務
              </div>
              <div 
                v-for="(mission, index) in gameState.foraging.activeMissions" 
                :key="index"
                class="mission-card">
                <div class="mission-header">
                  <div>
                    <div class="mission-title">採蜜任務 #{{ index + 1 }}</div>
                    <div class="mission-area">{{ getAreaName(mission.area) }}</div>
                  </div>
                  <div class="mission-timer">{{ formatTime(mission.timeRemaining) }}</div>
                </div>
                <div class="mission-details">
                  <div>指派蜜蜂：{{ mission.bees }} 隻</div>
                  <div>風險等級：{{ mission.risk }}</div>
                </div>
                <div class="mission-progress">
                  <div class="progress-bar" :style="{ width: mission.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- 花蜜收集標籤頁 -->
          <div :class="['tab-pane', { active: activeTab === 'honey-tab' }]">
            <h3>採集到的花蜜</h3>
            <div class="honey-types">
              <div v-for="honey in honeyTypes" :key="honey.id" class="honey-type">
                <div :class="['honey-image', honey.id]"></div>
                <div class="honey-info">
                  <h4>{{ honey.name }}</h4>
                  <div>數量: <span>{{ getHoneyAmount(honey.id) }}</span> kg</div>
                  <div>市價: <span>{{ honey.price }}</span> 元/kg</div>
                </div>
              </div>
            </div>
            <button @click="$emit('sell-all-honey')" class="game-button">
              出售所有花蜜
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ForagingModal',
    props: {
      gameState: {
        type: Object,
        required: true
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        activeTab: 'areas-tab',
        beesAssigned: 1,
        missionDuration: 'short',
        selectedArea: null, // 本地追蹤選擇的區域，而不是直接修改prop
        tabs: [
          { id: 'areas-tab', name: '採蜜區域' },
          { id: 'missions-tab', name: '進行中任務' },
          { id: 'honey-tab', name: '花蜜收集' }
        ],
        areas: [
          { 
            id: 'meadow', 
            name: '花草草地', 
            description: '常見花蜜，安全性高',
            yield: '普通',
            risk: '低',
            riskLevel: 'low',
            time: '短',
            locked: false
          },
          { 
            id: 'forest', 
            name: '深林山谷', 
            description: '野花蜜源，品質較佳',
            yield: '良好',
            risk: '中',
            riskLevel: 'medium',
            time: '中',
            locked: false
          },
          { 
            id: 'mountain', 
            name: '高山草原', 
            description: '高海拔蜜源，稀有花種',
            yield: '優質',
            risk: '高',
            riskLevel: 'high',
            time: '長',
            locked: false
          },
          { 
            id: 'orchard', 
            name: '果園花區', 
            description: '需達到蜂巢3級解鎖',
            locked: true,
            minLevel: 3
          },
          { 
            id: 'rare', 
            name: '稀有花園', 
            description: '需達到蜂巢5級解鎖',
            locked: true,
            minLevel: 5
          }
        ],
        honeyTypes: [
          { id: 'common', name: '普通花蜜', price: 10 },
          { id: 'wildflower', name: '野花蜜', price: 15 },
          { id: 'mountain', name: '高山花蜜', price: 25 },
          { id: 'rare', name: '稀有花蜜', price: 50 }
        ]
      };
    },
    computed: {
      maxBeesAssignable() {
        // 最多可指派的蜜蜂數量不能超過玩家擁有的蜜蜂數量
        return Math.min(5, this.gameState.bees);
      },
      expectedYield() {
        if (!this.selectedArea) return '請選擇區域';
        
        const area = this.areas.find(a => a.id === this.selectedArea);
        let yieldValue = '';
        
        switch (area.id) {
          case 'meadow':
            yieldValue = this.beesAssigned <= 2 ? '少量普通花蜜' : '中量普通花蜜';
            break;
          case 'forest':
            yieldValue = this.beesAssigned <= 2 ? '少量野花蜜' : '中量野花蜜';
            break;
          case 'mountain':
            yieldValue = this.beesAssigned <= 2 ? '少量高山花蜜' : '中量高山花蜜';
            break;
          default:
            yieldValue = '少量普通花蜜';
        }
        
        if (this.missionDuration === 'medium') {
          yieldValue = yieldValue.replace('少量', '中量').replace('中量', '大量');
        } else if (this.missionDuration === 'long') {
          yieldValue = yieldValue.replace('少量', '大量').replace('中量', '豐富');
        }
        
        return yieldValue;
      },
      missionRisk() {
        if (!this.selectedArea) return '未知';
        
        const area = this.areas.find(a => a.id === this.selectedArea);
        let risk = '';
        
        switch (area.riskLevel) {
          case 'low':
            risk = this.beesAssigned <= 2 ? '極低' : '低';
            break;
          case 'medium':
            risk = this.beesAssigned <= 2 ? '低' : '中';
            break;
          case 'high':
            risk = this.beesAssigned <= 2 ? '中' : '高';
            break;
          default:
            risk = '未知';
        }
        
        if (this.missionDuration === 'medium') {
          if (risk === '極低') risk = '低';
          else if (risk === '低') risk = '中';
          else if (risk === '中') risk = '高';
        } else if (this.missionDuration === 'long') {
          if (risk === '極低') risk = '中';
          else if (risk === '低') risk = '高';
          else if (risk === '中') risk = '極高';
        }
        
        return risk;
      },
      canStartMission() {
        return (
          this.selectedArea &&
          this.beesAssigned > 0 &&
          this.beesAssigned <= this.gameState.bees
        );
      }
    },
    mounted() {
      // 更新區域解鎖狀態
      this.checkAndUnlockAreas();
      
      // 初始化本地區域選擇狀態，與 gameState 保持同步
      this.selectedArea = this.gameState.foraging.selectedArea;
    },
    watch: {
      // 當 gameState.foraging.selectedArea 變化時同步到本地狀態
      'gameState.foraging.selectedArea'(newVal) {
        this.selectedArea = newVal;
      }
    },
    methods: {
      selectArea(area) {
        if (area.locked) return;
        
        // 更新本地選擇狀態，而不是直接修改 prop
        this.selectedArea = area.id;
        
        // 通知父組件區域選擇已更改
        this.$emit('update-selected-area', area.id);
      },
      
      startMission() {
        if (!this.canStartMission) return;
        
        const missionData = {
          area: this.selectedArea,
          bees: parseInt(this.beesAssigned),
          duration: this.missionDuration,
          risk: this.missionRisk
        };
        
        this.$emit('start-mission', missionData);
      },
      
      checkAndUnlockAreas() {
        // 根據蜂巢等級解鎖區域，但只更新本地數據
        this.areas.forEach(area => {
          if (area.minLevel && this.gameState.hiveLevel >= area.minLevel) {
            area.locked = false;
          }
        });
      },
      
      getAreaName(areaId) {
        const area = this.areas.find(a => a.id === areaId);
        return area ? area.name : '未知區域';
      },
      
      formatTime(seconds) {
        if (!seconds && seconds !== 0) return '--:--';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      },
      
      getHoneyAmount(honeyType) {
        // 安全地獲取蜂蜜數量，避免未定義錯誤
        if (this.gameState && 
            this.gameState.foraging && 
            this.gameState.foraging.honeyCollected && 
            this.gameState.foraging.honeyCollected[honeyType] !== undefined) {
          return this.gameState.foraging.honeyCollected[honeyType].toFixed(1);
        }
        return '0.0';
      }
    }
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
  </style>