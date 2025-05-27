export default {
    namespaced: true,
  
    state: {
      currentChallenge: null,
      challengeHidden: false,
      lastChallengeTime: null
    },
  
    getters: {
      hasChallengeActive(state) {
        return state.currentChallenge !== null && !state.challengeHidden;
      }
    },
  
    mutations: {
      SET_CHALLENGE(state, challenge) {
        state.currentChallenge = challenge;
        state.challengeHidden = false;
      },
      
      CLEAR_CHALLENGE(state) {
        state.currentChallenge = null;
      },
      
      HIDE_CHALLENGE(state) {
        state.challengeHidden = true;
      },
      
      SET_LAST_CHALLENGE_TIME(state, time) {
        state.lastChallengeTime = time;
      }
    },
  
    actions: {
      // 檢查是否可以觸發挑戰
      maybeStartChallenge({ state, commit, dispatch, rootState }) {
        // 如果已有挑戰，不再觸發
        if (state.currentChallenge) {
          return;
        }
        
        // 記錄上次挑戰的時間
        const lastChallengeTime = state.lastChallengeTime || 0;
        const now = Date.now();
        
        // 確保至少間隔15分鐘才能觸發新挑戰
        if (now - lastChallengeTime < 15 * 60 * 1000) {
          return;
        }
        
        // 根據蜜蜂數量調整挑戰機率 - 蜜蜂越多，挑戰越頻繁
        // 基礎機率：5%，最高可達20%
        let baseChance = 0.05;
        
        // 如果蜜蜂超過5隻，每多5隻增加5%機率，最高20%
        if (rootState.bees.bees > 5) {
          const additionalChance = Math.min(0.15, (rootState.bees.bees - 5) / 5 * 0.05);
          baseChance += additionalChance;
        }
        
        // 隨機決定是否觸發
        if (Math.random() > baseChance) {
          return;
        }
        
        // 記錄此次挑戰時間
        commit('SET_LAST_CHALLENGE_TIME', now);
        
        // 隨機選擇挑戰類型
        const challengeTypes = ["pest", "environmental", "weather"];
        const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
        
        // 創建對應類型的挑戰
        switch (type) {
          case "pest":
            dispatch('createPestChallenge');
            break;
          case "environmental":
            dispatch('createEnvironmentalChallenge');
            break;
          case "weather":
            dispatch('createWeatherChallenge', { weatherType: rootState.weather.current });
            break;
        }
      },
      
      // 創建蜂螨挑戰
      createPestChallenge({ commit, dispatch }) {
        // 蜂螨爆發挑戰
        const pestChallenge = {
          id: "mite",
          title: "蜂螨爆發",
          description: "蜂螨正在侵擾你的蜂群，可能導致蜜蜂生病或死亡！",
          severity: "high",
          solutions: [
            {
              name: "購買藥劑治療 (¥150)",
              cost: 150,
              effectText: "蜂群已被治療，健康恢復中",
              action: "treatWithMedicine"
            },
            {
              name: "自然療法 (¥50，風險更高)",
              cost: 50,
              effectText: "自然療法效果有限，蜂群仍有風險",
              action: "treatNaturally"
            }
          ]
        };
  
        commit("SET_CHALLENGE", {
          type: "pest",
          data: pestChallenge
        });
  
        dispatch("showNotification", {
          message: `警告：${pestChallenge.title}！`,
          type: "warning"
        }, { root: true });
      },
      
      // 創建環境挑戰
      createEnvironmentalChallenge({ commit, dispatch }) {
        // 環境問題挑戰
        const envChallenges = [
          {
            id: "pollution",
            title: "環境污染",
            description: "附近的工廠排放污染物，影響了蜜蜂的健康！",
            solutions: [
              {
                name: "安裝過濾裝置 (¥200)",
                cost: 200,
                effectText: "過濾裝置有效阻擋了污染物",
                action: "installFilter"
              },
              {
                name: "遷移蜂巢 (¥100)",
                cost: 100,
                effectText: "蜂巢遷移到了更安全的地方",
                action: "relocateHive"
              }
            ]
          },
          {
            id: "pesticide",
            title: "農藥噴灑",
            description: "附近農田噴灑農藥，對蜜蜂造成傷害！",
            solutions: [
              {
                name: "與農民協商 (¥120)",
                cost: 120,
                effectText: "成功說服農民使用有機方法",
                action: "negotiateWithFarmers"
              },
              {
                name: "加強蜂巢防護 (¥80)",
                cost: 80,
                effectText: "簡單的防護措施，效果有限",
                action: "enhanceProtection"
              }
            ]
          }
        ];
  
        // 隨機選擇一個環境挑戰
        const envChallenge = envChallenges[Math.floor(Math.random() * envChallenges.length)];
  
        commit("SET_CHALLENGE", {
          type: "environmental",
          data: envChallenge
        });
  
        dispatch("showNotification", {
          message: `警告：${envChallenge.title}！`,
          type: "warning"
        }, { root: true });
      },
      
      // 創建天氣挑戰
      createWeatherChallenge({ commit, dispatch, rootState }, { weatherType }) {
        // 天氣挑戰 - 可以使用傳入的天氣類型或隨機選擇一種惡劣天氣
        if (!weatherType || rootState.weather.weatherTypes[weatherType].effect > 0.7) {
          // 如果未指定天氣類型或當前天氣不是惡劣天氣，隨機選擇一種惡劣天氣
          const badWeatherTypes = ["rainy", "drought", "cold"];
          weatherType = badWeatherTypes[Math.floor(Math.random() * badWeatherTypes.length)];
        }
  
        let weatherChallenge = {
          id: weatherType,
          title: rootState.weather.weatherTypes[weatherType].name,
          description: `${rootState.weather.weatherTypes[weatherType].description}，蜂蜜產量降低到${rootState.weather.weatherTypes[weatherType].effect * 100}%！`,
          solutions: []
        };
        
        // 根據天氣類型添加解決方案
        switch (weatherType) {
          case "rainy":
            weatherChallenge.solutions = [
              {
                name: "安裝雨棚 (¥100)",
                cost: 100,
                effectText: "雨棚保護了蜂巢，產量恢復正常",
                action: "installShelter"
              },
              {
                name: "提供額外食物 (¥50)",
                cost: 50,
                effectText: "蜜蜂不需要飛行就能獲得食物",
                action: "provideExtraFood"
              }
            ];
            break;
          case "drought":
            weatherChallenge.solutions = [
              {
                name: "安裝灌溉系統 (¥150)",
                cost: 150,
                effectText: "花朵得到水分，花蜜產量回升",
                action: "installIrrigation"
              },
              {
                name: "種植耐旱植物 (¥80)",
                cost: 80,
                effectText: "新植物提供了穩定但有限的花蜜來源",
                action: "plantDroughtResistant"
              }
            ];
            break;
          case "cold":
            weatherChallenge.solutions = [
              {
                name: "安裝保溫設備 (¥120)",
                cost: 120,
                effectText: "蜂巢溫度升高，蜜蜂活動恢復正常",
                action: "installHeater"
              },
              {
                name: "提供高能量食物 (¥70)",
                cost: 70,
                effectText: "蜜蜂獲得額外能量抵抗寒冷",
                action: "provideEnergyFood"
              }
            ];
            break;
          default:
            weatherChallenge.solutions = [
              {
                name: "一般應對措施 (¥100)",
                cost: 100,
                effectText: "基本措施，有助於緩解問題",
                action: "generalMeasures"
              }
            ];
        }
  
        commit("SET_CHALLENGE", {
          type: "weather",
          data: weatherChallenge
        });
  
        dispatch("showNotification", {
          message: `警告：${weatherChallenge.title}天氣挑戰！`,
          type: "warning"
        }, { root: true });
      },
      
      // 應用挑戰解決方案
      applySolution({ state, commit, dispatch, rootState }, solution) {
        if (!state.currentChallenge) return;
        
        // 檢查是否有足夠的金錢
        if (rootState.money < solution.cost) {
          dispatch('showNotification', {
            message: '金錢不足，無法應用此解決方案！',
            type: 'warning'
          }, { root: true });
          return;
        }
        
        // 扣除費用
        commit('REMOVE_MONEY', solution.cost, { root: true });
        
        // 根據挑戰類型和解決方案執行相應操作
        const challenge = state.currentChallenge;
        console.log(`Applying solution for challenge: ${challenge.type}`, solution);
        
        // 根據解決方案的 action 執行不同效果
        switch (solution.action) {
          // 蜂螨挑戰解決方案
          case "treatWithMedicine":
            // 高效藥物治療，健康恢復更多
            commit('bees/SET_HIVE_HEALTH', rootState.bees.hiveHealth + 20, { root: true });
            break;
          case "treatNaturally":
            // 自然療法，健康恢復有限
            commit('bees/SET_HIVE_HEALTH', rootState.bees.hiveHealth + 5, { root: true });
            // 自然療法有機會失敗
            if (Math.random() < 0.3) {
              dispatch('showNotification', {
                message: '自然療法效果有限，一些蜜蜂受到影響！',
                type: 'warning'
              }, { root: true });
              commit('bees/REMOVE_BEES', 1, { root: true });
            }
            break;
            
          // 環境挑戰解決方案
          case "installFilter":
          case "negotiateWithFarmers":
            // 高效解決方案，恢復健康並增加效率
            commit('bees/SET_HIVE_HEALTH', rootState.bees.hiveHealth + 15, { root: true });
            commit('bees/SET_HONEY_EFFICIENCY', rootState.bees.honeyPerBeePerMinute * 1.1, { root: true });
            break;
          case "relocateHive":
          case "enhanceProtection":
            // 基本解決方案，只恢復健康
            commit('bees/SET_HIVE_HEALTH', rootState.bees.hiveHealth + 10, { root: true });
            break;
            
          // 天氣挑戰解決方案
          case "installShelter":
          case "installIrrigation":
          case "installHeater":
            // 高效天氣解決方案，改善天氣效果
            dispatch('weather/improveWeather', null, { root: true });
            break;
          case "provideExtraFood":
          case "plantDroughtResistant":
          case "provideEnergyFood":
          case "generalMeasures": {
            // 基本天氣解決方案，小幅改善效果
            const currentWeather = rootState.weather.current;
            const currentEffect = rootState.weather.effectMultiplier;
            commit('weather/SET_WEATHER', {
              current: currentWeather,
              effectMultiplier: Math.min(1.0, currentEffect * 1.3), // 提高30%效果，但不超過1.0
              daysRemaining: 1
            }, { root: true });
            break;
          }
        }
        
        // 通知玩家
        dispatch('showNotification', {
          message: `已應用解決方案：${solution.effectText}`,
          type: 'success'
        }, { root: true });
        
        // 清除挑戰
        commit('CLEAR_CHALLENGE');
      },
      
      // 強制觸發挑戰 (測試用)
      forceStartChallenge({ dispatch }) {
        // 隨機選擇挑戰類型
        const challengeTypes = ["pest", "environmental", "weather"];
        const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
        
        // 創建對應類型的挑戰
        switch (type) {
          case "pest":
            dispatch('createPestChallenge');
            break;
          case "environmental":
            dispatch('createEnvironmentalChallenge');
            break;
          case "weather":
            dispatch('createWeatherChallenge', { weatherType: null });
            break;
        }
      },
      
      // 隱藏挑戰
      hideChallenge({ commit }) {
        commit('HIDE_CHALLENGE');
      }
    }
  };