export default {
    namespaced: true,
  
    state: {
      currentTask: null,
      clicksCompleted: 0,
      clicksNeeded: 0,
      taskProgress: 0,
      taskName: '',
      onComplete: null
    },
  
    getters: {
      isTaskActive(state) {
        return state.currentTask !== null;
      },
      
      taskProgressPercentage(state) {
        if (state.clicksNeeded === 0) return 0;
        return (state.clicksCompleted / state.clicksNeeded) * 100;
      }
    },
  
    mutations: {
      SET_TASK(state, { taskName, clicksNeeded, onComplete }) {
        state.currentTask = true;
        state.clicksCompleted = 0;
        state.clicksNeeded = clicksNeeded;
        state.taskProgress = 0;
        state.taskName = taskName;
        state.onComplete = onComplete;
      },
      
      CLEAR_TASK(state) {
        state.currentTask = null;
        state.clicksCompleted = 0;
        state.clicksNeeded = 0;
        state.taskProgress = 0;
        state.taskName = '';
        state.onComplete = null;
      },
      
      PROGRESS_TASK(state) {
        state.clicksCompleted++;
        state.taskProgress = (state.clicksCompleted / state.clicksNeeded) * 100;
      }
    },
  
    actions: {
      // 開始一個勞力任務
      startLaborTask({ state, commit }, { taskName, clicksNeeded, onComplete }) {
        // 如果已有進行中的任務，拒絕新任務
        if (state.currentTask !== null) {
          return;
        }
        
        // 設置新任務
        commit('SET_TASK', { taskName, clicksNeeded, onComplete });
      },
      
      // 完成勞力任務的一次點擊
      progressTask({ state, commit }) {
        if (state.currentTask === null) return;
        
        commit('PROGRESS_TASK');
        
        // 檢查是否完成任務
        if (state.clicksCompleted >= state.clicksNeeded) {
          // 執行完成回調
          if (typeof state.onComplete === 'function') {
            state.onComplete();
          }
          
          // 清除任務
          commit('CLEAR_TASK');
        }
      },
      
      // 取消當前任務
      cancelTask({ state, commit, dispatch }) {
        if (state.currentTask === null) return;
        
        const taskName = state.taskName;
        commit('CLEAR_TASK');
        
        dispatch('showNotification', {
          message: `取消任務: ${taskName}`,
          type: 'warning'
        }, { root: true });
      }
    }
  };