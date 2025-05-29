export default {
    namespaced: true,
    
    state: {
      achievements: [
        // 蜜蜂相關成就
        {
          id: 'bees-10',
          title: '小型蜂場',
          description: '擁有10隻蜜蜂',
          hint: '擴大你的蜂場規模',
          icon: '🐝',
          category: 'bees',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 10
        },
        {
          id: 'bees-50',
          title: '中型蜂場',
          description: '擁有50隻蜜蜂',
          hint: '繼續擴大你的蜂場',
          icon: '🐝',
          category: 'bees',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 50
        },
        {
          id: 'bees-100',
          title: '大型蜂場',
          description: '擁有100隻蜜蜂',
          hint: '建立一個龐大的蜂群',
          icon: '🐝',
          category: 'bees',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 100
        },
        {
          id: 'hive-level-5',
          title: '高級蜂巢',
          description: '將蜂巢升級到5級',
          hint: '提升你的蜂巢等級',
          icon: '🏠',
          category: 'bees',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 5
        },
        
        // 蜂蜜相關成就
        {
          id: 'honey-100',
          title: '蜂蜜初學者',
          description: '累計收集100kg蜂蜜',
          hint: '收集更多蜂蜜',
          icon: '🍯',
          category: 'honey',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 100
        },
        {
          id: 'honey-1000',
          title: '蜂蜜專家',
          description: '累計收集1000kg蜂蜜',
          hint: '成為蜂蜜生產專家',
          icon: '🍯',
          category: 'honey',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 1000
        },
        {
          id: 'honey-storage-200',
          title: '擴充倉庫',
          description: '將蜂蜜倉庫容量擴充到200kg',
          hint: '擴大你的儲存空間',
          icon: '📦',
          category: 'honey',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 200
        },
        
        // 採集相關成就
        {
          id: 'foraging-10',
          title: '探險家',
          description: '完成10次採蜜任務',
          hint: '派遣蜜蜂出去採集',
          icon: '🌿',
          category: 'foraging',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 10
        },
        {
          id: 'rare-honey-5',
          title: '稀有蜂蜜收藏家',
          description: '收集5kg稀有蜂蜜',
          hint: '尋找珍貴的花蜜來源',
          icon: '🌸',
          category: 'foraging',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 5
        },
        
        // 訂單相關成就
        {
          id: 'orders-10',
          title: '可靠供應商',
          description: '完成10筆訂單',
          hint: '滿足客戶的需求',
          icon: '📝',
          category: 'orders',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 10
        },
        {
          id: 'orders-50',
          title: '蜂蜜企業家',
          description: '完成50筆訂單',
          hint: '經營一個成功的蜂蜜生意',
          icon: '💼',
          category: 'orders',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 50
        },
        
        // 挑戰相關成就
        {
          id: 'challenges-5',
          title: '問題解決者',
          description: '成功應對5次養蜂挑戰',
          hint: '解決蜂場遇到的各種挑戰',
          icon: '⚔️',
          category: 'challenges',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 5
        },
        {
          id: 'challenges-health-100',
          title: '健康蜂場',
          description: '保持蜂巢健康度在100%持續一週',
          hint: '關注蜂巢的健康狀況',
          icon: '❤️',
          category: 'challenges',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          target: 7
        }
      ],
      newAchievementNotification: false,
      totalHoneyCollected: 0,
      totalOrdersFulfilled: 0,
      totalChallengesSolved: 0,
      healthyDaysCount: 0
    },
    
    getters: {
      unlockedAchievements: state => state.achievements.filter(a => a.unlocked),
      
      hasNewAchievements: state => state.newAchievementNotification
    },
    
    mutations: {
      UPDATE_ACHIEVEMENT_PROGRESS(state, { achievementId, progress }) {
        const achievement = state.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
          achievement.progress = Math.min(achievement.progress + progress, achievement.target);
          
          // 檢查是否解鎖
          if (achievement.progress >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_BEES_COUNT(state, count) {
        // 更新蜜蜂數量相關成就
        state.achievements.forEach(achievement => {
          if (['bees-10', 'bees-50', 'bees-100'].includes(achievement.id) && !achievement.unlocked) {
            achievement.progress = count;
            if (count >= achievement.target) {
              achievement.unlocked = true;
              achievement.unlockedAt = Date.now();
              state.newAchievementNotification = true;
            }
          }
        });
      },
      
      UPDATE_HIVE_LEVEL(state, level) {
        const achievement = state.achievements.find(a => a.id === 'hive-level-5');
        if (achievement && !achievement.unlocked) {
          achievement.progress = level;
          if (level >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_HONEY_COLLECTED(state, amount) {
        state.totalHoneyCollected += amount;
        
        // 更新蜂蜜收集相關成就
        state.achievements.forEach(achievement => {
          if (['honey-100', 'honey-1000'].includes(achievement.id) && !achievement.unlocked) {
            achievement.progress = state.totalHoneyCollected;
            if (state.totalHoneyCollected >= achievement.target) {
              achievement.unlocked = true;
              achievement.unlockedAt = Date.now();
              state.newAchievementNotification = true;
            }
          }
        });
      },
      
      UPDATE_HONEY_STORAGE_CAPACITY(state, capacity) {
        const achievement = state.achievements.find(a => a.id === 'honey-storage-200');
        if (achievement && !achievement.unlocked) {
          achievement.progress = capacity;
          if (capacity >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_FORAGING_MISSIONS(state, count) {
        const achievement = state.achievements.find(a => a.id === 'foraging-10');
        if (achievement && !achievement.unlocked) {
          achievement.progress = count;
          if (count >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_RARE_HONEY(state, amount) {
        const achievement = state.achievements.find(a => a.id === 'rare-honey-5');
        if (achievement && !achievement.unlocked) {
          achievement.progress = amount;
          if (amount >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_ORDERS_FULFILLED(state, count) {
        state.totalOrdersFulfilled = count;
        
        // 更新訂單相關成就
        state.achievements.forEach(achievement => {
          if (['orders-10', 'orders-50'].includes(achievement.id) && !achievement.unlocked) {
            achievement.progress = state.totalOrdersFulfilled;
            if (state.totalOrdersFulfilled >= achievement.target) {
              achievement.unlocked = true;
              achievement.unlockedAt = Date.now();
              state.newAchievementNotification = true;
            }
          }
        });
      },
      
      UPDATE_CHALLENGES_SOLVED(state, count) {
        state.totalChallengesSolved = count;
        
        const achievement = state.achievements.find(a => a.id === 'challenges-5');
        if (achievement && !achievement.unlocked) {
          achievement.progress = count;
          if (count >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      UPDATE_HEALTHY_DAYS(state, health) {
        // 如果健康度是100%，增加天數
        if (health === 100) {
          state.healthyDaysCount++;
        } else {
          // 否則重置計數
          state.healthyDaysCount = 0;
        }
        
        const achievement = state.achievements.find(a => a.id === 'challenges-health-100');
        if (achievement && !achievement.unlocked) {
          achievement.progress = state.healthyDaysCount;
          if (state.healthyDaysCount >= achievement.target) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            state.newAchievementNotification = true;
          }
        }
      },
      
      CLEAR_NEW_ACHIEVEMENT_NOTIFICATION(state) {
        state.newAchievementNotification = false;
      }
    },
    
    actions: {
      // 初始化成就系統
      initAchievements({ commit, rootState }) {
        // 初始化時更新成就進度
        if (rootState.bees) {
          commit('UPDATE_BEES_COUNT', rootState.bees.bees);
          commit('UPDATE_HIVE_LEVEL', rootState.bees.hiveLevel);
        }
        
        if (rootState.honey) {
          commit('UPDATE_HONEY_STORAGE_CAPACITY', rootState.honey.capacity);
        }
        
        if (rootState.orders) {
          commit('UPDATE_ORDERS_FULFILLED', rootState.orders.completed.length);
        }
      },
      
      // 檢查和更新成就
      checkAchievements({ commit, rootState }) {
        // 這個方法可以定期調用，檢查遊戲狀態並更新相應的成就進度
        if (rootState.bees) {
          commit('UPDATE_BEES_COUNT', rootState.bees.bees);
          commit('UPDATE_HIVE_LEVEL', rootState.bees.hiveLevel);
          commit('UPDATE_HEALTHY_DAYS', rootState.bees.hiveHealth);
        }
        
        if (rootState.honey) {
          commit('UPDATE_HONEY_STORAGE_CAPACITY', rootState.honey.capacity);
          
          // 檢查稀有蜂蜜數量
          if (rootState.honey.inventory && rootState.honey.inventory.rare) {
            commit('UPDATE_RARE_HONEY', rootState.honey.inventory.rare);
          }
        }
        
        if (rootState.foraging && rootState.foraging.missionStats) {
          commit('UPDATE_FORAGING_MISSIONS', rootState.foraging.missionStats.totalMissions);
        }
        
        if (rootState.orders) {
          commit('UPDATE_ORDERS_FULFILLED', rootState.orders.completed.length);
        }
        
        if (rootState.challenges) {
          commit('UPDATE_CHALLENGES_SOLVED', rootState.challenges.solvedChallenges || 0);
        }
      },
      
      // 清除新成就通知
      clearNewAchievementNotification({ commit }) {
        commit('CLEAR_NEW_ACHIEVEMENT_NOTIFICATION');
      },
      
      // 記錄收集的蜂蜜
      trackHoneyCollected({ commit }, amount) {
        commit('UPDATE_HONEY_COLLECTED', amount);
      }
    }
  };