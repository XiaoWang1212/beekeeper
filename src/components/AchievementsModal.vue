<template>
    <div class="modal" :class="{ active: isActive, hidden: !isActive }">
      <div class="modal-header">
        <h2>成就殿堂</h2>
        <button class="modal-close" @click="$emit('close-modal')">&times;</button>
      </div>
      <div class="modal-content">
        <div class="achievements-container">
          <div class="achievements-stats">
            <div class="stat-item">
              <span class="stat-value">{{ unlockedCount }}</span>
              <span class="stat-label">已解鎖</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalAchievements }}</span>
              <span class="stat-label">總成就數</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ completionPercentage }}%</span>
              <span class="stat-label">完成度</span>
            </div>
          </div>
          
          <div class="achievements-categories">
            <button 
              v-for="category in categories" 
              :key="category.id"
              :class="['category-button', { active: activeCategory === category.id }]"
              @click="activeCategory = category.id"
            >
              {{ category.name }}
            </button>
          </div>
          
          <div class="achievements-list">
            <div v-for="achievement in filteredAchievements" :key="achievement.id" 
              :class="['achievement-item', { 'unlocked': achievement.unlocked }]">
              <div class="achievement-icon">
                <span v-if="achievement.unlocked">{{ achievement.icon }}</span>
                <span v-else>🔒</span>
              </div>
              <div class="achievement-content">
                <h3 class="achievement-title">{{ achievement.title }}</h3>
                <p class="achievement-description">
                  {{ achievement.unlocked ? achievement.description : achievement.hint || '???' }}
                </p>
                <div v-if="!achievement.unlocked && achievement.progress > 0" class="achievement-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                    ></div>
                  </div>
                  <div class="progress-text">
                    {{ achievement.progress }} / {{ achievement.target }}
                  </div>
                </div>
                <div v-if="achievement.unlocked" class="unlock-date">
                  解鎖於: {{ formatDate(achievement.unlockedAt) }}
                </div>
              </div>
            </div>
            
            <div v-if="filteredAchievements.length === 0" class="no-achievements">
              這個類別還沒有成就，繼續努力探索吧！
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapState, mapGetters } from 'vuex';
  
  export default {
    props: {
      isActive: {
        type: Boolean,
        default: false
      }
    },
    
    data() {
      return {
        activeCategory: 'all'
      };
    },
    
    computed: {
      ...mapState({
        achievements: state => state.achievements.achievements
      }),
      
      ...mapGetters({
        unlockedAchievements: 'achievements/unlockedAchievements'
      }),
      
      categories() {
        return [
          { id: 'all', name: '全部' },
          { id: 'bees', name: '蜜蜂' },
          { id: 'honey', name: '蜂蜜' },
          { id: 'foraging', name: '採集' },
          { id: 'orders', name: '訂單' },
          { id: 'challenges', name: '挑戰' }
        ];
      },
      
      filteredAchievements() {
        if (this.activeCategory === 'all') {
          return this.achievements;
        }
        return this.achievements.filter(a => a.category === this.activeCategory);
      },
      
      unlockedCount() {
        return this.unlockedAchievements.length;
      },
      
      totalAchievements() {
        return this.achievements.length;
      },
      
      completionPercentage() {
        if (this.totalAchievements === 0) return 0;
        return Math.round((this.unlockedCount / this.totalAchievements) * 100);
      }
    },
    
    methods: {
      formatDate(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-TW');
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
    color: #7b1fa2;
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
  
  .achievements-container {
    padding: 20px;
  }
  
  .achievements-stats {
    display: flex;
    justify-content: space-around;
    padding: 15px;
    background-color: #f3e5f5;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #7b1fa2;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #6a1b9a;
  }
  
  .achievements-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .category-button {
    padding: 8px 15px;
    background-color: #e1bee7;
    border: none;
    border-radius: 20px;
    color: #6a1b9a;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .category-button.active {
    background-color: #7b1fa2;
    color: white;
  }
  
  .category-button:hover:not(.active) {
    background-color: #ce93d8;
  }
  
  .achievements-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .achievement-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    background-color: #f9f5ea;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    opacity: 0.7;
    transition: all 0.2s;
  }
  
  .achievement-item.unlocked {
    background-color: #f3e5f5;
    opacity: 1;
    border-left: 5px solid #7b1fa2;
  }
  
  .achievement-icon {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    background-color: #e1bee7;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .achievement-item.unlocked .achievement-icon {
    background-color: #9c27b0;
    color: white;
  }
  
  .achievement-content {
    flex: 1;
  }
  
  .achievement-title {
    margin: 0 0 5px 0;
    font-size: 1.1rem;
    color: #5d4215;
  }
  
  .achievement-item.unlocked .achievement-title {
    color: #7b1fa2;
  }
  
  .achievement-description {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 0.95rem;
  }
  
  .achievement-progress {
    margin-top: 10px;
  }
  
  .progress-bar {
    height: 6px;
    background-color: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 5px;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #9c27b0;
    transition: width 0.3s;
  }
  
  .progress-text {
    font-size: 0.85rem;
    text-align: right;
    color: #666;
  }
  
  .unlock-date {
    font-size: 0.85rem;
    color: #7b1fa2;
    margin-top: 5px;
  }
  
  .no-achievements {
    padding: 30px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  </style>