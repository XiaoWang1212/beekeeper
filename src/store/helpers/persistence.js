// 存檔插件
export const saveGamePlugin = (store) => {
  // 定期自動保存
  setInterval(() => {
    store.dispatch("persistence/saveGame");
  }, 60000); // 每分鐘保存一次
};

export default {
  namespaced: true,

  actions: {
    // 保存遊戲
    saveGame({ rootState }) {
      try {
        // 獲取當前登入的用戶
        const currentUser = localStorage.getItem("beekeeper_current_user");
        if (!currentUser) {
          console.error("沒有登入用戶，無法保存遊戲");
          return;
        }

        const gameData = {
          money: rootState.money,

          // 蜜蜂模組
          bees: {
            bees: rootState.bees.bees,
            assignedBees: rootState.bees.assignedBees || 0, // 添加這行
            hiveLevel: rootState.bees.hiveLevel,
            hiveHealth: rootState.bees.hiveHealth,
            hiveCapacity: rootState.bees.hiveCapacity,
            honeyPerBeePerMinute: rootState.bees.honeyPerBeePerMinute,
            costs: rootState.bees.costs,
          },

          // 蜂蜜模組
          honey: {
            production: rootState.honey.production,
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
            missionHistory: rootState.foraging.missionHistory,
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

          tasks: {
            tasks: rootState.tasks.tasks,
            newTaskNotification: rootState.tasks.newTaskNotification,
          },

          // 天氣模組
          weather: rootState.weather,

          savedAt: Date.now(),
        };

        // 使用用戶名作為存檔的key，每個用戶有自己的存檔
        localStorage.setItem(
          `beekeeperGame_${currentUser}`,
          JSON.stringify(gameData)
        );
        console.log(`遊戲已保存到帳號: ${currentUser}`);
      } catch (e) {
        console.error("保存遊戲時出錯:", e);
      }
    },

    // 載入遊戲
    loadGame({ commit, dispatch }) {
      // 獲取當前登入的用戶
      const currentUser = localStorage.getItem("beekeeper_current_user");
      if (!currentUser) {
        console.error("沒有登入用戶，無法載入遊戲");
        return;
      }

      // 檢查是否是新遊戲
      const isNewGame = localStorage.getItem("beekeeper_new_game") === "true";
      if (isNewGame) {
        // 新遊戲，初始化默認數據
        commit("bees/SET_BEES", 3, { root: true });
        // 移除新遊戲標記
        localStorage.removeItem("beekeeper_new_game");
        return;
      }

      // 載入該用戶的存檔
      const savedGame = localStorage.getItem(`beekeeperGame_${currentUser}`);
      if (!savedGame) {
        // 該用戶沒有存檔，初始化默認數據
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

          if (bees.assignedBees !== undefined) {
            commit("bees/SET_ASSIGNED_BEES", bees.assignedBees, { root: true });
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

            // 設置蜂蜜產出
            if (honey.production !== undefined) {
              commit("honey/SET_PRODUCTION", honey.production, { root: true });
            } else if (honey.total !== undefined) {
              // 兼容舊格式
              commit("honey/SET_PRODUCTION", honey.total, { root: true });
            }

            // 按類型添加蜂蜜到庫存
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
            commit("honey/SET_PRODUCTION", honey, { root: true });
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
            honeyCollected: gameData.foraging.honeyCollected || {
              common: 0,
              wildflower: 0,
              mountain: 0,
              rare: 0,
            },
            maxMissions: gameData.foraging.maxMissions || 3,
            missionHistory: gameData.foraging.missionHistory || [],
            missionStats: gameData.foraging.missionStats || {
              totalMissions: 0,
              successMissions: 0,
              failedMissions: 0,
            },
          };

          commit("foraging/SET_FORAGING_DATA", foragingData, { root: true });
        }

        // 載入任務模組數據
        if (gameData.tasks) {
          // 直接設置整個任務狀態
          commit("tasks/SET_TASKS_DATA", gameData.tasks, { root: true });

          // 可選：分別設置任務列表和通知狀態
          if (gameData.tasks.tasks) {
            commit("tasks/SET_TASKS", gameData.tasks.tasks, { root: true });
          }

          if (gameData.tasks.newTaskNotification !== undefined) {
            commit(
              "tasks/SET_NEW_TASK_NOTIFICATION",
              gameData.tasks.newTaskNotification,
              { root: true }
            );
          }
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

        console.log(`已載入帳號 ${currentUser} 的遊戲數據`);
      } catch (e) {
        console.error("加載遊戲數據時出錯:", e);
        // 初始化默認數據
        commit("bees/ADD_BEES", 3, { root: true });
      }
      dispatch("achievements/checkAchievements", null, { root: true });
    },

    // 刪除存檔 (可選)
    deleteGameSave(_, username) {
      if (!username) {
        console.error("沒有指定用戶名，無法刪除存檔");
        return;
      }

      localStorage.removeItem(`beekeeperGame_${username}`);
      console.log(`已刪除用戶 ${username} 的遊戲存檔`);
    },
  },
};
