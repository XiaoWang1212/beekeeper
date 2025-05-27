// 存檔插件
export const saveGamePlugin = (store) => {
  // 定期自動保存
  setInterval(() => {
    store.dispatch("persistence/saveGame");
  }, 1000); // 每1秒保存一次
};

export default {
  namespaced: true,

  actions: {
    // 保存遊戲
    saveGame({ rootState }) {
      try {
        const gameData = {
          money: rootState.money,

          // 蜜蜂模組
          bees: {
            bees: rootState.bees.bees,
            hiveLevel: rootState.bees.hiveLevel,
            hiveHealth: rootState.bees.hiveHealth,
            hiveCapacity: rootState.bees.hiveCapacity,
            honeyPerBeePerMinute: rootState.bees.honeyPerBeePerMinute,
            costs: rootState.bees.costs,
          },

          // 蜂蜜模組
          honey: {
            total: rootState.honey.total,
            inventory: rootState.honey.inventory,
            capacity: rootState.honey.capacity,
          },

          // 訂單模組
          orders: {
            active: rootState.orders.active,
            completed: rootState.orders.completed,
            maxActive: rootState.orders.maxActive,
          },

          // 採蜜模組
          foraging: {
            areas: rootState.foraging.areas,
            activeMissions: rootState.foraging.activeMissions,
            selectedArea: rootState.foraging.selectedArea,
            maxMissions: rootState.foraging.maxMissions,
            honeyCollected: rootState.foraging.honeyCollected,
            missionStats: rootState.foraging.missionStats,
            missionHistory: rootState.foraging.missionHistory
          },

          // 挑戰模組
          challenges: {
            currentChallenge: rootState.challenges.currentChallenge,
            lastChallengeTime: rootState.challenges.lastChallengeTime,
          },

          laborTasks: {
            currentTask: rootState.laborTasks.currentTask,
            clicksCompleted: rootState.laborTasks.clicksCompleted,
            clicksNeeded: rootState.laborTasks.clicksNeeded,
            taskName: rootState.laborTasks.taskName,
          },

          // 天氣模組
          weather: rootState.weather,

          savedAt: Date.now(),
        };

        localStorage.setItem("beekeeperGame", JSON.stringify(gameData));
        console.log("遊戲已保存");
      } catch (e) {
        console.error("保存遊戲時出錯:", e);
      }
    },

    // 載入遊戲
    loadGame({ commit }) {
      const savedGame = localStorage.getItem("beekeeperGame");
      if (!savedGame) {
        // 沒有存檔，初始化默認數據
        commit("bees/SET_BEES", 3, { root: true });
        return;
      }

      try {
        const gameData = JSON.parse(savedGame);

        // 載入金錢
        if (gameData.money !== undefined) {
          commit("SET_MONEY", gameData.money, { root: true });
        }

        // 載入蜜蜂模組數據
        if (gameData.bees) {
          const bees = gameData.bees;

          if (bees.bees !== undefined) {
            commit("bees/SET_BEES", bees.bees, { root: true });
          }

          if (bees.hiveLevel !== undefined) {
            commit("bees/SET_HIVE_LEVEL", bees.hiveLevel, { root: true });
          }

          if (bees.hiveHealth !== undefined) {
            commit("bees/SET_HIVE_HEALTH", bees.hiveHealth, { root: true });
          }

          if (bees.hiveCapacity !== undefined) {
            commit("bees/SET_HIVE_CAPACITY", bees.hiveCapacity, { root: true });
          }

          if (bees.honeyPerBeePerMinute !== undefined) {
            commit("bees/SET_HONEY_EFFICIENCY", bees.honeyPerBeePerMinute, {
              root: true,
            });
          }

          if (bees.costs) {
            commit("bees/SET_COSTS", bees.costs, { root: true });
          }
        }

        // 載入蜂蜜模組數據
        if (gameData.honey) {
          const honey = gameData.honey;

          // 檢查是新格式還是舊格式
          if (typeof honey === "object" && honey.inventory) {
            commit("honey/SET_HONEY_CAPACITY", honey.capacity || 100, {
              root: true,
            });

            // 清空現有蜂蜜
            commit("honey/SET_HONEY", 0, { root: true });

            // 按類型添加蜂蜜
            for (const type in honey.inventory) {
              if (honey.inventory[type] > 0) {
                commit(
                  "honey/ADD_HONEY_BY_TYPE",
                  {
                    type,
                    amount: honey.inventory[type],
                  },
                  { root: true }
                );
              }
            }
          } else {
            // 舊格式 - 轉換為新格式
            commit("honey/SET_HONEY", honey, { root: true });
          }
        }

        // 載入訂單模組數據
        if (gameData.orders) {
          commit("orders/SET_ORDERS", gameData.orders, { root: true });
        }

        // 載入採蜜模組數據
        if (gameData.foraging) {
          const foragingData = {
            activeMissions: gameData.foraging.activeMissions || [],
            selectedArea: gameData.foraging.selectedArea || null,
            honeyCollected: gameData.foraging.honeyCollected || { common: 0, wildflower: 0, mountain: 0, rare: 0 },
            maxMissions: gameData.foraging.maxMissions || 3,
            missionHistory: gameData.foraging.missionHistory || [],
            missionStats: gameData.foraging.missionStats || { totalMissions: 0, successMissions: 0, failedMissions: 0 }
          };
          
          commit("foraging/SET_FORAGING_DATA", foragingData, { root: true });
        }

        // 載入挑戰模組數據
        if (gameData.challenges) {
          if (gameData.challenges.currentChallenge) {
            commit(
              "challenges/SET_CHALLENGE",
              gameData.challenges.currentChallenge,
              { root: true }
            );
          }

          if (gameData.challenges.lastChallengeTime) {
            commit(
              "challenges/SET_LAST_CHALLENGE_TIME",
              gameData.challenges.lastChallengeTime,
              { root: true }
            );
          }
        }

        // 載入天氣模組數據
        if (gameData.weather) {
          commit("weather/SET_WEATHER", gameData.weather, { root: true });
        }

        console.log("遊戲數據已從本地存儲加載");
      } catch (e) {
        console.error("加載遊戲數據時出錯:", e);
        // 初始化默認數據
        commit("bees/ADD_BEES", 3, { root: true });
      }
    },
  },
};
