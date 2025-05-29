<template>
    <div class="modal" :class="{ active: isActive, hidden: !isActive }">
      <div class="modal-header">
        <h2>任務版</h2>
        <button class="modal-close" @click="$emit('close-modal')">&times;</button>
      </div>
      <div class="modal-content">
        <div class="tasks-container">
          <div class="tasks-tabs">
            <button 
              :class="['tab-button', { active: activeTab === 'daily' }]" 
              @click="activeTab = 'daily'"
            >
              每日任務
            </button>
            <button 
              :class="['tab-button', { active: activeTab === 'weekly' }]" 
              @click="activeTab = 'weekly'"
            >
              每週任務
            </button>
            <button 
              :class="['tab-button', { active: activeTab === 'main' }]" 
              @click="activeTab = 'main'"
            >
              主線任務
            </button>
          </div>
          
          <div class="tasks-list">
            <div v-if="filteredTasks.length === 0" class="no-tasks">
              目前沒有可用的任務，請稍後再來！
            </div>
            
            <div v-for="task in filteredTasks" :key="task.id" class="task-item">
              <div class="task-content">
                <div class="task-header">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <div class="task-reward">
                    <span>獎勵: </span>
                    <span v-if="task.rewards.money">¥{{ task.rewards.money }}</span>
                    <span v-if="task.rewards.honey"> + {{ task.rewards.honey }}kg 蜂蜜</span>
                    <span v-if="task.rewards.bees"> + {{ task.rewards.bees }} 隻蜜蜂</span>
                  </div>
                </div>
                
                <p class="task-description">{{ task.description }}</p>
                
                <div class="task-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${calculateProgress(task)}%` }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ task.currentValue || 0 }} / {{ task.targetValue }} {{ task.unit || '' }}
                  </div>
                </div>
              </div>
              
              <button 
                @click="claimReward(task)" 
                class="claim-button" 
                :disabled="!task.canClaim"
                :class="{ completed: task.completed }"
              >
                {{ task.completed ? '已完成' : (task.canClaim ? '領取獎勵' : '進行中') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapState, mapActions } from 'vuex';
  
  export default {
    props: {
      isActive: {
        type: Boolean,
        default: false
      }
    },
    
    data() {
      return {
        activeTab: 'daily',
      };
    },
    
    computed: {
      ...mapState({
        tasks: state => state.tasks.tasks
      }),
      
      filteredTasks() {
        return this.tasks.filter(task => task.type === this.activeTab);
      }
    },
    
    methods: {
      ...mapActions({
        claimTaskReward: 'tasks/claimReward',
        refreshTasks: 'tasks/refreshTasks'
      }),
      
      calculateProgress(task) {
        if (task.targetValue <= 0) return 0;
        const progress = Math.min(100, (task.currentValue / task.targetValue) * 100);
        return progress;
      },
      
      claimReward(task) {
        if (task.canClaim && !task.completed) {
          this.claimTaskReward(task.id);
        }
      }
    },
    
    mounted() {
      // 當任務版開啟時，刷新任務
      if (this.isActive) {
        this.refreshTasks();
      }
    },
    
    watch: {
      isActive(newValue) {
        if (newValue) {
          this.refreshTasks();
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e0d8c8;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #d4a017;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #8c6d3c;
  }
  
  .modal-close:hover {
    color: #5d4215;
  }
  
  .tasks-container {
    padding: 20px;
  }
  
  .tasks-tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 2px solid #f0e8d6;
  }
  
  .tab-button {
    padding: 10px 15px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 1rem;
    font-weight: bold;
    color: #8c6d3c;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .tab-button.active {
    color: #d4a017;
    border-bottom-color: #d4a017;
  }
  
  .tab-button:hover {
    background-color: #f9f5ea;
  }
  
  .tasks-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #f9f5ea;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .task-content {
    flex: 1;
  }
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .task-title {
    margin: 0;
    font-size: 1.1rem;
    color: #5d4215;
  }
  
  .task-reward {
    font-size: 0.9rem;
    font-weight: bold;
    color: #d4a017;
  }
  
  .task-description {
    margin-bottom: 15px;
    color: #666;
    font-size: 0.95rem;
  }
  
  .task-progress {
    margin-top: 10px;
  }
  
  .progress-bar {
    height: 8px;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 5px;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s;
  }
  
  .progress-text {
    font-size: 0.85rem;
    text-align: right;
    color: #666;
  }
  
  .claim-button {
    min-width: 100px;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .claim-button:hover:not(:disabled) {
    background-color: #388e3c;
  }
  
  .claim-button:disabled {
    background-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
  
  .claim-button.completed {
    background-color: #9e9e9e;
  }
  
  .no-tasks {
    padding: 30px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  </style>