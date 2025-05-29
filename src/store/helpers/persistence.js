// 修改導入，使用 Realtime Database 的 API
import { ref, set, get, child } from "firebase/database";

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
    // 保存遊戲 - 修改為使用 Realtime Database
    async saveGame({ rootState }) {
      try {
        // 獲取當前登入的用戶
        const currentUser = rootState.firebase.currentUser;
        const localUser = localStorage.getItem("beekeeper_current_user");

        if (!currentUser && !localUser) {
          console.error("沒有登入用戶，無法保存遊戲");
          return;
        }

        const userId = currentUser ? currentUser.uid : localUser;

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
          `beekeeperGame_${userId}`,
          JSON.stringify(gameData)
        );

        // Firebase Realtime Database 保存
        if (rootState.firebase.database && currentUser) {
          try {
            // 獲取 Realtime Database 實例
            const database = rootState.firebase.database;
            
            // 保存到 Realtime Database
            const gameRef = ref(database, `gameData/${userId}`);
            await set(gameRef, {
              ...gameData,
              lastSaved: new Date().toISOString()
            });
          } catch (firebaseError) {
            console.error("Firebase 保存失敗:", firebaseError);
          }
        }
      } catch (e) {
        console.error("保存遊戲時出錯:", e);
      }
    },

    // 載入遊戲 - 修改為使用 Realtime Database
    async loadGame({ commit, rootState, dispatch }) {
      try {
        // 獲取當前登入的用戶
        const currentUser = rootState.firebase.currentUser;
        const localUser = localStorage.getItem("beekeeper_current_user");
        
        if (!currentUser && !localUser) {
          console.error("沒有登入用戶，無法載入遊戲");
          return false;
        }
        
        const userId = currentUser ? currentUser.uid : localUser;
        let gameData = null;
        
        // 嘗試從 Firebase Realtime Database 載入
        if (rootState.firebase.database && currentUser) {
          try {
            // 獲取 Realtime Database 實例
            const database = rootState.firebase.database;
            
            // 從 Realtime Database 讀取
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, `gameData/${userId}`));
            
            if (snapshot.exists()) {
              gameData = snapshot.val();
            } else {
              console.log(`Firebase 中沒有找到用戶 ${userId} 的遊戲數據`);
            }
          } catch (firebaseError) {
            console.error("Firebase 載入失敗:", firebaseError);
            console.error("詳細錯誤:", firebaseError.message);
          }
        }
        
        // 如果 Firebase 載入失敗，嘗試從 localStorage 載入
        if (!gameData) {
          const savedGame = localStorage.getItem(`beekeeperGame_${userId}`);
          
          if (savedGame) {
            try {
              gameData = JSON.parse(savedGame);
            } catch (parseError) {
              console.error("解析本地存儲數據失敗:", parseError);
            }
          }
        }
        
        if (!gameData) {
          console.log(`沒有找到保存的遊戲數據，初始化新遊戲`);
          
          // 初始化新遊戲
          commit("bees/ADD_BEES", 3, { root: true });
          commit("bees/SET_HIVE_LEVEL", 1, { root: true });
          commit("bees/SET_HIVE_HEALTH", 100, { root: true });
          commit("honey/SET_HONEY_CAPACITY", 100, { root: true });
          commit("SET_MONEY", 100, { root: true });
          
          // 如果有 Firebase 實例，也保存這個初始狀態
          if (rootState.firebase.database && currentUser) {
            dispatch("saveGame");
          }
          
          return true;
        }
        
        // 數據驗證
        if (!validateGameData(gameData)) {
          console.error("遊戲數據無效，初始化新遊戲");
          commit("bees/ADD_BEES", 3, { root: true });
          return false;
        }

        // 載入遊戲數據到 store
        // 金錢
        if (typeof gameData.money === 'number') {
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
        return true;
      } catch (e) {
        console.error("加載遊戲數據時出錯:", e);
        console.error("詳細錯誤:", e.stack);
        // 初始化默認數據
        commit("bees/ADD_BEES", 3, { root: true });
        return false;
      } finally {
        // 檢查成就
        dispatch("achievements/checkAchievements", null, { root: true });
      }
    },

    // 刪除存檔 (可選) - 同時刪除本地和 Firebase 中的數據
    async deleteGameSave({ rootState }, username) {
      if (!username) {
        console.error("沒有指定用戶名，無法刪除存檔");
        return;
      }

      // 刪除本地存檔
      localStorage.removeItem(`beekeeperGame_${username}`);
      console.log(`已刪除本地用戶 ${username} 的遊戲存檔`);

      // 刪除 Firebase 存檔
      const currentUser = rootState.firebase.currentUser;
      if (rootState.firebase.database && currentUser && currentUser.uid === username) {
        try {
          const database = rootState.firebase.database;
          const gameRef = ref(database, `gameData/${username}`);
          await set(gameRef, null); // 設置為 null 來刪除數據
          console.log(`已刪除 Firebase 中用戶 ${username} 的遊戲存檔`);
        } catch (error) {
          console.error("刪除 Firebase 存檔失敗:", error);
        }
      }
    },
  },
};

// 保持驗證函數不變
function validateGameData(data) {
  if (!data) return false;
  
  // 檢查必要字段
  return (
    typeof data.money === 'number' &&
    data.bees && 
    typeof data.bees.bees === 'number' &&
    data.honey
  );
}
