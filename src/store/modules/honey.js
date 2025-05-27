export default {
    namespaced: true,
    
    state: {
      total: 0,
      inventory: {
        common: 0,
        wildflower: 0,
        mountain: 0,
        rare: 0
      },
      capacity: 100,
      
      // 蜂蜜品種定義
      honeyTypes: {
        common: {
          name: "普通蜂蜜",
          basePrice: 10,
          color: "#ffcc00",
          description: "最常見的蜂蜜，微甜且口感溫和。"
        },
        wildflower: {
          name: "野花蜂蜜",
          basePrice: 15,
          color: "#ffa64d",
          description: "採自各種野花，口感豐富，帶有花香。"
        },
        mountain: {
          name: "山地蜂蜜",
          basePrice: 25,
          color: "#996633",
          description: "來自高山植物，味道濃郁，營養價值高。"
        },
        rare: {
          name: "稀有蜂蜜",
          basePrice: 50,
          color: "#e64d00",
          description: "極為罕見的特殊蜂蜜，具有獨特的風味和藥用價值。"
        }
      }
    },
    
    getters: {
      canCollectHoney(state) {
        return state.total > 0;
      },
      
      totalHoney(state) {
        return Object.values(state.inventory).reduce((sum, amount) => sum + amount, 0);
      },
      
      capacityPercentage(state, getters) {
        return (getters.totalHoney / state.capacity) * 100;
      },
      
      upgradeCost(state) {
        return Math.floor(state.capacity * 1.2);
      }
    },
    
    mutations: {
      ADD_HONEY_BY_TYPE(state, { type, amount }) {
        // 檢查倉庫容量
        const currentTotal = Object.values(state.inventory).reduce((a, b) => a + b, 0);
        const availableSpace = state.capacity - currentTotal;
        
        // 如果空間不足，只添加能容納的部分
        const amountToAdd = Math.min(amount, availableSpace);
        
        if (amountToAdd <= 0) return;
        
        // 更新特定類型的蜂蜜
        state.inventory[type] += amountToAdd;
        
        // 同時更新總量以兼容舊代碼
        state.total += amountToAdd;
      },
      
      REMOVE_HONEY_BY_TYPE(state, { type, amount }) {
        // 確保不會減到負數
        const amountToRemove = Math.min(amount, state.inventory[type]);
        
        // 更新特定類型的蜂蜜
        state.inventory[type] -= amountToRemove;
        
        // 同時更新總量以兼容舊代碼
        state.total -= amountToRemove;
        
        return amountToRemove; // 返回實際減少的量
      },
      
      SET_HONEY_CAPACITY(state, capacity) {
        state.capacity = capacity;
      },
      
      ADD_HONEY(state, amount) {
        // 隨機分配到不同類型的蜂蜜
        const typeChances = {
          common: 0.7,      // 70% 獲得普通蜂蜜
          wildflower: 0.2,  // 20% 獲得野花蜂蜜
          mountain: 0.08,   // 8% 獲得山地蜂蜜
          rare: 0.02        // 2% 獲得稀有蜂蜜
        };
        
        const roll = Math.random();
        let selectedType = "common";
        let cumulativeChance = 0;
        
        for (const [type, chance] of Object.entries(typeChances)) {
          cumulativeChance += chance;
          if (roll < cumulativeChance) {
            selectedType = type;
            break;
          }
        }
        
        // 使用 ADD_HONEY_BY_TYPE
        state.inventory[selectedType] += amount;
        state.total += amount;
      },
      
      SET_HONEY(state, amount) {
        // 重置所有蜂蜜
        for (const type in state.inventory) {
          state.inventory[type] = 0;
        }
        
        // 設置普通蜂蜜為指定量
        state.inventory.common = amount;
        state.total = amount;
      }
    },
    
    actions: {
      // 生產蜂蜜 (由主循環呼叫)
      produceHoney({ rootState, commit }) {
        const bees = rootState.bees.bees;
        const honeyPerBeePerMinute = rootState.bees.honeyPerBeePerMinute;
        const weatherMultiplier = rootState.weather.effectMultiplier || 1.0;
        
        const honeyProduction = (bees * honeyPerBeePerMinute * weatherMultiplier) / 60;
        
        // 只有當生產值大於0才添加
        if (honeyProduction > 0) {
          commit("ADD_HONEY", honeyProduction);
        }
      },
      
      // 擴充蜂蜜倉庫
      upgradeHoneyStorage({ state, getters, rootState, commit, dispatch }) {
        const cost = getters.upgradeCost;
        
        if (rootState.money < cost) {
          dispatch("showNotification", {
            message: `金錢不足！擴充倉庫需要${cost}元`,
            type: "warning"
          }, { root: true });
          return;
        }
        
        // 扣除費用
        commit("REMOVE_MONEY", cost, { root: true });
        
        // 增加50kg容量
        const newCapacity = state.capacity + 50;
        commit("SET_HONEY_CAPACITY", newCapacity);
        
        dispatch("showNotification", {
          message: `倉庫已擴充！新容量: ${newCapacity}kg`,
          type: "success"
        }, { root: true });
      },
      
      // 直接出售特定類型的蜂蜜
      sellHoneyByType({ state, commit, dispatch }, { type, amount }) {
        // 檢查庫存
        if (state.inventory[type] < amount) {
          dispatch("showNotification", {
            message: `${state.honeyTypes[type].name}庫存不足！`,
            type: "warning"
          }, { root: true });
          return;
        }
        
        // 計算價值 (直接賣出略低於訂單價格)
        const price = state.honeyTypes[type].basePrice * 0.9;
        const value = Math.floor(amount * price);
        
        // 減少蜂蜜
        commit("REMOVE_HONEY_BY_TYPE", { type, amount });
        
        // 增加金錢
        commit("ADD_MONEY", value, { root: true });
        
        dispatch("showNotification", {
          message: `已出售${amount}kg ${state.honeyTypes[type].name}，獲得${value}元`,
          type: "success"
        }, { root: true });
      },
      
      // 採集蜂蜜 (舊版直接銷售功能)
      collectHoney({ state, commit, dispatch }) {
        if (state.total <= 0) {
          dispatch("showNotification", {
            message: "沒有可收集的蜂蜜！",
            type: "info"
          }, { root: true });
          return;
        }
        
        // 使用 root: true 參數確保可以訪問命名空間模組
        dispatch("laborTasks/startLaborTask", {
          taskName: "採集蜂蜜",
          clicksNeeded: 5,
          onComplete: () => {
            const honeyValue = Math.round(state.total * 10);
            commit("ADD_MONEY", honeyValue, { root: true });
            
            dispatch("showNotification", {
              message: `成功收穫了 ${state.total.toFixed(1)}kg 蜂蜜，賣出獲得 ${honeyValue} 元！`,
              type: "success"
            }, { root: true });
            
            commit("SET_HONEY", 0);
          }
        }, { root: true });
      }
    }
  };