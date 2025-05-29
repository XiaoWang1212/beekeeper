export default {
  namespaced: true,

  state: {
    // 未收集的蜂蜜
    production: 0,

    // 已收集的蜂蜜
    inventory: {
      common: 0,
      wildflower: 0,
      mountain: 0,
      rare: 0,
    },
    capacity: 100,

    // 蜂蜜品種定義
    honeyTypes: {
      common: {
        name: "普通蜂蜜",
        basePrice: 10,
        color: "#ffcc00",
        description: "最常見的蜂蜜，微甜且口感溫和。",
      },
      wildflower: {
        name: "野花蜂蜜",
        basePrice: 15,
        color: "#ffa64d",
        description: "採自各種野花，口感豐富，帶有花香。",
      },
      mountain: {
        name: "山地蜂蜜",
        basePrice: 25,
        color: "#996633",
        description: "來自高山植物，味道濃郁，營養價值高。",
      },
      rare: {
        name: "稀有蜂蜜",
        basePrice: 50,
        color: "#e64d00",
        description: "極為罕見的特殊蜂蜜，具有獨特的風味和藥用價值。",
      },
    },
  },

  getters: {
    // 能否收集蜂蜜
    canCollectHoney(state) {
      return state.production > 0;
    },

    // 倉庫中的總蜂蜜量
    totalHoney(state) {
      return Object.values(state.inventory).reduce(
        (sum, amount) => sum + amount,
        0
      );
    },

    // 倉庫剩餘空間
    availableSpace(state, getters) {
      return Math.max(0, state.capacity - getters.totalHoney);
    },

    // 倉庫容量百分比
    capacityPercentage(state, getters) {
      return (getters.totalHoney / state.capacity) * 100;
    },

    // 升級倉庫的成本
    upgradeCost(state) {
      return Math.floor(state.capacity * 1.2);
    },
  },

  mutations: {
    // 添加特定類型的蜂蜜到倉庫
    ADD_HONEY_BY_TYPE(state, { type, amount }) {
      // 確保蜂蜜類型有效
      if (!state.inventory[type]) {
        state.inventory[type] = 0;
      }

      // 更新特定類型的蜂蜜
      state.inventory[type] += amount;
    },

    // 從倉庫移除特定類型的蜂蜜
    REMOVE_HONEY_BY_TYPE(state, { type, amount }) {
      // 確保不會減到負數
      const amountToRemove = Math.min(amount, state.inventory[type] || 0);

      // 更新特定類型的蜂蜜
      state.inventory[type] -= amountToRemove;

      return amountToRemove; // 返回實際減少的量
    },

    // 設置倉庫容量
    SET_HONEY_CAPACITY(state, capacity) {
      state.capacity = capacity;
    },

    // 設置蜂蜜產出
    SET_PRODUCTION(state, amount) {
      state.production = amount;
    },

    // 增加未收集的蜂蜜產出
    ADD_PRODUCTION(state, amount) {
      state.production += amount;
    },

    // 清除未收集的蜂蜜產出
    CLEAR_PRODUCTION(state) {
      state.production = 0;
    },
  },

  actions: {
    // 生產蜂蜜 (由主循環呼叫)
    produceHoney({ rootState, commit }) {
      const bees = rootState.bees.bees;
      const honeyPerBeePerMinute = rootState.bees.honeyPerBeePerMinute;
      const weatherMultiplier = rootState.weather.effectMultiplier || 1.0;

      const honeyProduction =
        (bees * honeyPerBeePerMinute * weatherMultiplier) / 60;

      // 只有當生產值大於0才添加
      if (honeyProduction > 0) {
        commit("ADD_PRODUCTION", honeyProduction);
      }
    },

    // 擴充蜂蜜倉庫
    upgradeHoneyStorage({ getters, rootState, commit, dispatch }) {
      const cost = getters.upgradeCost;

      if (rootState.money < cost) {
        dispatch(
          "showNotification",
          {
            message: `金錢不足！擴充倉庫需要${cost}元`,
            type: "warning",
          },
          { root: true }
        );
        return;
      }

      // 扣除費用
      commit("REMOVE_MONEY", cost, { root: true });

      // 增加50kg容量
      const newCapacity = Math.floor(getters.upgradeCost / 1.2) + 50;
      commit("SET_HONEY_CAPACITY", newCapacity);

      dispatch(
        "showNotification",
        {
          message: `倉庫已擴充！新容量: ${newCapacity}kg`,
          type: "success",
        },
        { root: true }
      );
    },

    // 直接出售特定類型的蜂蜜
    sellHoneyByType({ state, commit, dispatch }, { type, amount }) {
      // 檢查庫存
      if (state.inventory[type] < amount) {
        dispatch(
          "showNotification",
          {
            message: `${state.honeyTypes[type].name}庫存不足！`,
            type: "warning",
          },
          { root: true }
        );
        return;
      }

      // 計算價值 (直接賣出略低於訂單價格)
      const price = state.honeyTypes[type].basePrice * 0.9;
      const value = Math.floor(amount * price);

      // 減少蜂蜜
      commit("REMOVE_HONEY_BY_TYPE", { type, amount });

      // 增加金錢
      commit("ADD_MONEY", value, { root: true });

      dispatch(
        "showNotification",
        {
          message: `已出售${amount}kg ${state.honeyTypes[type].name}，獲得${value}元`,
          type: "success",
        },
        { root: true }
      );
      dispatch("tasks/trackSellHoney", amount, { root: true });
    },

    // 採集蜂蜜 (存入倉庫)
    collectHoney({ state, getters, commit, dispatch }) {
      if (state.production <= 0) {
        dispatch(
          "showNotification",
          {
            message: "沒有可收集的蜂蜜！",
            type: "info",
          },
          { root: true }
        );
        return;
      }

      // 檢查倉庫容量
      if (getters.availableSpace <= 0) {
        dispatch(
          "showNotification",
          {
            message: "蜂蜜倉庫已滿！請先出售一些蜂蜜或擴充倉庫。",
            type: "warning",
          },
          { root: true }
        );
        return;
      }

      // 使用勞力任務
      dispatch(
        "laborTasks/startLaborTask",
        {
          taskName: "採集蜂蜜",
          clicksNeeded: 5,
          onComplete: () => {
            // 先保存當前蜂蜜產出量
            const honeyToCollect = state.production;

            // 計算實際可收集的蜂蜜量
            const collectableAmount = Math.min(
              honeyToCollect,
              getters.availableSpace
            );

            // 隨機分配不同類型的蜂蜜
            const typeChances = {
              common: 0.7, // 70% 獲得普通蜂蜜
              wildflower: 0.2, // 20% 獲得野花蜂蜜
              mountain: 0.08, // 8% 獲得山地蜂蜜
              rare: 0.02, // 2% 獲得稀有蜂蜜
            };

            // 決定每種蜂蜜的數量
            const honeyDistribution = {};
            let remainingHoney = collectableAmount;
            let collectedAmount = 0;

            for (const [type, chance] of Object.entries(typeChances)) {
              if (remainingHoney <= 0) break;

              // 計算這種類型的蜂蜜數量
              const typeAmount = Math.min(
                remainingHoney * chance * (1 + Math.random() * 0.5), // 添加一些隨機變化
                remainingHoney
              );

              if (typeAmount > 0) {
                honeyDistribution[type] = typeAmount;
                remainingHoney -= typeAmount;
                collectedAmount += typeAmount;

                // 添加到倉庫
                commit("ADD_HONEY_BY_TYPE", {
                  type,
                  amount: typeAmount,
                });
              }
            }

            // 如果還有剩餘的蜂蜜（由於舍入或其他原因），添加到普通蜂蜜
            if (remainingHoney > 0) {
              commit("ADD_HONEY_BY_TYPE", {
                type: "common",
                amount: remainingHoney,
              });
              honeyDistribution.common =
                (honeyDistribution.common || 0) + remainingHoney;
              collectedAmount += remainingHoney;
            }

            // 生成消息文本
            let messageText = `成功收集了 ${collectedAmount.toFixed(
              1
            )}kg 蜂蜜到倉庫！`;
            if (honeyToCollect > collectableAmount) {
              messageText += ` (${(honeyToCollect - collectableAmount).toFixed(
                1
              )}kg 因倉庫空間不足而丟失)`;
            }

            // 更詳細的收集信息
            const details = Object.entries(honeyDistribution)
              .filter(([, amount]) => amount > 0)
              .map(
                ([type, amount]) =>
                  `${state.honeyTypes[type].name}: ${amount.toFixed(1)}kg`
              )
              .join(", ");

            if (details) {
              messageText += `\n收集明細: ${details}`;
            }

            dispatch(
              "showNotification",
              {
                message: messageText,
                type: "success",
              },
              { root: true }
            );

            // 清空蜂蜜產出
            commit("CLEAR_PRODUCTION");
            dispatch("tasks/trackCollectHoney", collectedAmount, {
              root: true,
            });
            dispatch("achievements/trackHoneyCollected", collectedAmount, {
              root: true,
            });
          },
        },
        { root: true }
      );
    },

    // 全部蜂蜜出售
    sellAllHoney({ state, getters, commit, dispatch }) {
      if (getters.totalHoney <= 0) {
        dispatch(
          "showNotification",
          {
            message: "倉庫中沒有蜂蜜可供出售！",
            type: "warning",
          },
          { root: true }
        );
        return;
      }

      let totalValue = 0;
      let totalAmount = 0;

      // 遍歷所有類型的蜂蜜
      for (const type in state.inventory) {
        const amount = state.inventory[type];
        if (amount > 0) {
          // 計算這種類型的價值
          const price = state.honeyTypes[type].basePrice * 0.9;
          const value = Math.floor(amount * price);

          totalValue += value;
          totalAmount += amount;

          // 清空這種類型的蜂蜜
          commit("REMOVE_HONEY_BY_TYPE", { type, amount });
        }
      }

      // 增加金錢
      commit("ADD_MONEY", totalValue, { root: true });

      dispatch(
        "showNotification",
        {
          message: `已出售所有蜂蜜 (${totalAmount.toFixed(
            1
          )}kg)，獲得${totalValue}元`,
          type: "success",
        },
        { root: true }
      );
    },
  },
};
