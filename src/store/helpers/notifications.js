export default {
    namespaced: true,
    
    state: {
      notifications: [],
      maxNotifications: 5,
      notificationDuration: 3000 // 默認通知顯示時間 (毫秒)
    },
    
    mutations: {
      ADD_NOTIFICATION(state, notification) {
        // 如果超過最大數量，移除最早的通知
        if (state.notifications.length >= state.maxNotifications) {
          state.notifications.shift();
        }
        
        state.notifications.push(notification);
      },
      
      REMOVE_NOTIFICATION(state, id) {
        const index = state.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          state.notifications.splice(index, 1);
        }
      }
    },
    
    actions: {
      // 顯示通知
      showNotification({ state, commit }, { message, type = 'info', duration = null }) {
        // 創建通知對象
        const notification = {
          id: Date.now(), // 唯一ID
          message,
          type,
          timestamp: new Date()
        };
        
        // 添加通知
        commit('ADD_NOTIFICATION', notification);
        
        // 設置自動移除計時器
        setTimeout(() => {
          commit('REMOVE_NOTIFICATION', notification.id);
        }, duration || state.notificationDuration);
        
        return notification.id;
      },
      
      // 手動移除通知
      dismissNotification({ commit }, id) {
        commit('REMOVE_NOTIFICATION', id);
      }
    }
  };