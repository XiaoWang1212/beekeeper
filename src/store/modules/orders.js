export default {
    namespaced: true,
    
    state: {
      active: [],
      completed: 0,
      maxActive: 3
    },
    
    getters: {
      hasNewOrders(state) {
        return state.active.length > 0;
      }
    },
    
    mutations: {
      ADD_ORDER(state, order) {
        if (state.active.length < state.maxActive) {
          state.active.push(order);
        }
      },
      
      REMOVE_ORDER(state, index) {
        state.active.splice(index, 1);
      },
      
      COMPLETE_ORDER(state) {
        state.completed++;
      },
      
      SET_ORDERS(state, orders) {
        state.active = orders.active || [];
        state.completed = orders.completed || 0;
        state.maxActive = orders.maxActive || 3;
      }
    },
    
    actions: {
      // 初始化訂單系統
      initOrders({ dispatch }) {
        // 設置訂單系統
        setInterval(() => {
          dispatch('generateOrder');
          dispatch('checkExpiredOrders');
        }, 30 * 60 * 1000); // 30分鐘
        
        // 初始生成1-2個訂單
        const initialOrderCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < initialOrderCount; i++) {
          dispatch('generateOrder');
        }
      },
      
      // 檢查過期訂單
      checkExpiredOrders({ state, commit, dispatch }) {
        const now = Date.now();
        const expiredOrders = [];
        
        state.active.forEach((order, index) => {
          if (order.expiryTime < now) {
            expiredOrders.push(index);
          }
        });
        
        // 從後往前移除過期訂單
        for (let i = expiredOrders.length - 1; i >= 0; i--) {
          const orderIndex = expiredOrders[i];
          const order = state.active[orderIndex];
          
          dispatch('showNotification', {
            message: `${order.customer}的訂單已過期！`,
            type: 'warning'
          }, { root: true });
          
          commit('REMOVE_ORDER', orderIndex);
        }
      },
      
      // 生成新訂單
      generateOrder({ state, commit, dispatch, rootState }) {
        // 如果已達最大訂單數，不再生成
        if (state.active.length >= state.maxActive) {
          return;
        }
        
        // 訂單要求的蜂蜜類型
        const honeyTypes = Object.keys(rootState.honey.honeyTypes);
        const requiredTypes = [];
        
        // 選擇1-3種蜂蜜類型
        const typeCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < typeCount; i++) {
          // 選擇一個尚未選擇的類型
          let type;
          do {
            type = honeyTypes[Math.floor(Math.random() * honeyTypes.length)];
          } while (requiredTypes.some(item => item.type === type));
          
          // 確定需求量
          let amount;
          switch (type) {
            case 'common':
              amount = Math.floor(Math.random() * 5) + 3; // 3-7kg
              break;
            case 'wildflower':
              amount = Math.floor(Math.random() * 4) + 2; // 2-5kg
              break;
            case 'mountain':
              amount = Math.floor(Math.random() * 3) + 1; // 1-3kg
              break;
            case 'rare':
              amount = Math.random() < 0.7 ? 1 : 2; // 通常1kg，有時2kg
              break;
            default:
              amount = 1;
          }
          
          requiredTypes.push({ type, amount });
        }
        
        // 計算訂單的基本價值
        let baseValue = 0;
        for (const item of requiredTypes) {
          baseValue += item.amount * rootState.honey.honeyTypes[item.type].basePrice;
        }
        
        // 添加額外獎勵 (10%-30%)
        const bonusPercent = Math.floor(Math.random() * 21) + 10;
        const bonusValue = Math.floor(baseValue * bonusPercent / 100);
        const totalValue = baseValue + bonusValue;
        
        // 生成一個隨機客戶名稱
        const customers = [
          "王大廚", "張麵包師", "甜點工坊", "健康食品店", 
          "李醫師", "有機商店", "山田農場", "日式料理店",
          "五星飯店", "陳奶奶", "李爺爺", "美食博主"
        ];
        
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        // 生成過期時間 (12-36小時)
        const expiryHours = Math.floor(Math.random() * 25) + 12;
        const expiryTime = Date.now() + expiryHours * 60 * 60 * 1000;
        
        // 創建訂單對象
        const order = {
          id: Date.now(), // 唯一ID
          customer,
          requirements: requiredTypes,
          baseValue,
          bonusValue,
          totalValue,
          expiryTime,
          createdAt: Date.now()
        };
        
        // 添加訂單
        commit('ADD_ORDER', order);
        
        // 通知玩家
        dispatch('showNotification', {
          message: `收到來自${customer}的新訂單！`,
          type: 'info'
        }, { root: true });
      },
      
      // 完成訂單
      fulfillOrder({ state, commit, dispatch, rootState }, orderIndex) {
        const order = state.active[orderIndex];
        if (!order) return;
        
        // 檢查是否有足夠的蜂蜜
        let canFulfill = true;
        for (const req of order.requirements) {
          if (rootState.honey.inventory[req.type] < req.amount) {
            canFulfill = false;
            break;
          }
        }
        
        if (!canFulfill) {
          dispatch('showNotification', {
            message: '蜂蜜庫存不足，無法完成訂單！',
            type: 'warning'
          }, { root: true });
          return;
        }
        
        // 移除蜂蜜
        for (const req of order.requirements) {
          commit('honey/REMOVE_HONEY_BY_TYPE', { type: req.type, amount: req.amount }, { root: true });
        }
        
        // 添加金錢
        commit('ADD_MONEY', order.totalValue, { root: true });
        
        // 增加完成訂單數
        commit('COMPLETE_ORDER');
        
        // 移除訂單
        commit('REMOVE_ORDER', orderIndex);
        
        // 通知玩家
        dispatch('showNotification', {
          message: `成功完成${order.customer}的訂單！獲得${order.totalValue}元（含${order.bonusValue}元獎勵）`,
          type: 'success'
        }, { root: true });
        
        // 有機會獲得額外獎勵
        if (Math.random() < 0.2) { // 20%幾率獲得額外獎勵
          const extraRewards = [
            { type: 'money', amount: Math.floor(Math.random() * 100) + 50, text: '額外小費' },
            { type: 'bee', amount: 1, text: '贈送一隻蜜蜂' },
            { type: 'health', amount: 10, text: '蜂巢健康度提升' }
          ];
          
          const reward = extraRewards[Math.floor(Math.random() * extraRewards.length)];
          
          switch (reward.type) {
            case 'money':
              commit('ADD_MONEY', reward.amount, { root: true });
              break;
            case 'bee':
              commit('bees/ADD_BEES', reward.amount, { root: true });
              break;
            case 'health': {
              const newHealth = rootState.bees.hiveHealth + reward.amount;
              commit('bees/SET_HIVE_HEALTH', newHealth, { root: true });
              break;
            }
          }
          
          dispatch('showNotification', {
            message: `${order.customer}很滿意！${reward.text}`,
            type: 'success'
          }, { root: true });

          dispatch("tasks/trackFulfillOrder", null, { root: true });
          dispatch("achievements/checkAchievements", null, { root: true });
        }
      }
    }
  };