export default {
    namespaced: true,
    
    state: {
      tasks: [
        {
          id: 'daily-collect-honey',
          title: '蜜蜂勤勞家',
          description: '今日收集蜂蜜',
          type: 'daily',
          currentValue: 0,
          targetValue: 10,
          unit: 'kg',
          rewards: {
            money: 100
          },
          canClaim: false,
          completed: false,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000 // 24小時後過期
        },
        {
          id: 'daily-sell-honey',
          title: '養蜂商人',
          description: '今日出售蜂蜜',
          type: 'daily',
          currentValue: 0,
          targetValue: 5,
          unit: 'kg',
          rewards: {
            money: 150
          },
          canClaim: false,
          completed: false,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000 // 24小時後過期
        },
        {
          id: 'weekly-fulfill-orders',
          title: '訂單達人',
          description: '完成客戶訂單',
          type: 'weekly',
          currentValue: 0,
          targetValue: 5,
          unit: '筆',
          rewards: {
            money: 500,
            honey: 5
          },
          canClaim: false,
          completed: false,
          createdAt: Date.now(),
          expiresAt: Date.now() + 604800000 // 7天後過期
        },
        {
          id: 'main-buy-bees',
          title: '蜂巢擴張',
          description: '購買蜜蜂',
          type: 'main',
          currentValue: 0,
          targetValue: 10,
          unit: '隻',
          rewards: {
            money: 200,
            bees: 1
          },
          canClaim: false,
          completed: false,
          createdAt: Date.now()
        },
        {
          id: 'main-upgrade-hive',
          title: '蜂巢升級',
          description: '升級你的蜂巢',
          type: 'main',
          currentValue: 0,
          targetValue: 3,
          unit: '次',
          rewards: {
            money: 300,
            honey: 10
          },
          canClaim: false,
          completed: false,
          createdAt: Date.now()
        }
      ],
      newTaskNotification: false
    },
    
    getters: {
      dailyTasks: state => state.tasks.filter(task => task.type === 'daily'),
      weeklyTasks: state => state.tasks.filter(task => task.type === 'weekly'),
      mainTasks: state => state.tasks.filter(task => task.type === 'main'),
      
      // 檢查是否有新任務可以領取
      hasNewTasks: state => {
        return state.tasks.some(task => task.canClaim && !task.completed);
      }
    },
    
    mutations: {
      UPDATE_TASK_PROGRESS(state, { taskId, progress }) {
        const task = state.tasks.find(task => task.id === taskId);
        if (task) {
          task.currentValue = Math.min(task.currentValue + progress, task.targetValue);
          task.canClaim = task.currentValue >= task.targetValue && !task.completed;
        }
      },
      
      CLAIM_TASK_REWARD(state, taskId) {
        const task = state.tasks.find(task => task.id === taskId);
        if (task && task.canClaim) {
          task.completed = true;
          task.canClaim = false;
        }
      },
      
      REFRESH_TASKS(state) {
        // 檢查過期任務並重新生成
        const now = Date.now();
        
        // 處理每日任務
        state.tasks = state.tasks.filter(task => {
          // 保留未過期或已完成的主線任務
          if (task.type === 'main') {
            return true;
          }
          
          // 保留未過期的每日/每週任務
          if (!task.expiresAt || task.expiresAt > now) {
            return true;
          }
          
          // 過期任務不保留
          return false;
        });
        
        // 添加新的每日任務（如果需要）
        if (state.tasks.filter(t => t.type === 'daily').length < 3) {
          // 生成新的每日任務
          // 這裡可以添加更多隨機任務
        }
        
        // 添加新的每週任務（如果需要）
        if (state.tasks.filter(t => t.type === 'weekly').length < 2) {
          // 生成新的每週任務
        }
      },
      
      SET_NEW_TASK_NOTIFICATION(state, value) {
        state.newTaskNotification = value;
      },

      SET_TASKS_DATA(state, tasksData) {
        if (tasksData.tasks) {
          state.tasks = tasksData.tasks;
        }
        if (tasksData.newTaskNotification !== undefined) {
          state.newTaskNotification = tasksData.newTaskNotification;
        }
      },
      
      // 設置任務列表
      SET_TASKS(state, tasks) {
        state.tasks = tasks;
      },
    },
    
    actions: {
      // 初始化任務系統
      initTasks({ commit }) {
        commit('REFRESH_TASKS');
      },
      
      // 更新任務進度
      updateProgress({ commit }, { taskId, progress }) {
        commit('UPDATE_TASK_PROGRESS', { taskId, progress });
      },
      
      // 領取任務獎勵
      claimReward({ commit, state, dispatch }, taskId) {
        const task = state.tasks.find(task => task.id === taskId);
        if (!task || !task.canClaim) return;
        
        // 發放獎勵
        if (task.rewards.money) {
          dispatch('ADD_MONEY', task.rewards.money, { root: true });
        }
        
        if (task.rewards.honey) {
          // 添加蜂蜜到倉庫
          dispatch('honey/ADD_HONEY_BY_TYPE', { 
            type: 'common', 
            amount: task.rewards.honey 
          }, { root: true });
        }
        
        if (task.rewards.bees) {
          dispatch('bees/ADD_BEES', task.rewards.bees, { root: true });
        }
        
        // 標記任務為已完成
        commit('CLAIM_TASK_REWARD', taskId);
        
        // 顯示通知
        dispatch('showNotification', {
          message: `已完成任務：${task.title}，獲得獎勵！`,
          type: 'success'
        }, { root: true });
      },
      
      // 刷新任務
      refreshTasks({ commit }) {
        commit('REFRESH_TASKS');
      },
      
      // 監聽各種遊戲事件並更新對應任務
      trackCollectHoney({ commit }, amount) {
        // 更新收集蜂蜜相關任務
        commit('UPDATE_TASK_PROGRESS', { 
          taskId: 'daily-collect-honey', 
          progress: amount 
        });
      },
      
      trackSellHoney({ commit }, amount) {
        // 更新出售蜂蜜相關任務
        commit('UPDATE_TASK_PROGRESS', { 
          taskId: 'daily-sell-honey', 
          progress: amount 
        });
      },
      
      trackFulfillOrder({ commit }) {
        // 更新完成訂單相關任務
        commit('UPDATE_TASK_PROGRESS', { 
          taskId: 'weekly-fulfill-orders', 
          progress: 1 
        });
      },
      
      trackBuyBee({ commit }) {
        // 更新購買蜜蜂相關任務
        commit('UPDATE_TASK_PROGRESS', { 
          taskId: 'main-buy-bees', 
          progress: 1 
        });
      },
      
      trackUpgradeHive({ commit }) {
        // 更新升級蜂巢相關任務
        commit('UPDATE_TASK_PROGRESS', { 
          taskId: 'main-upgrade-hive', 
          progress: 1 
        });
      }
    }
  };