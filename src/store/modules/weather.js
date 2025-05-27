export default {
    namespaced: true,
  
    state: {
      current: 'sunny',
      effectMultiplier: 1.0,
      daysRemaining: 0,
      
      // 天氣類型定義
      weatherTypes: {
        sunny: {
          name: '晴朗',
          description: '陽光明媚，蜜蜂活動頻繁',
          icon: '☀️',
          effect: 1.0
        },
        cloudy: {
          name: '多雲',
          description: '天空多雲，蜜蜂活動略受影響',
          icon: '☁️',
          effect: 0.9
        },
        rainy: {
          name: '下雨',
          description: '雨水阻礙了蜜蜂採集花蜜',
          icon: '🌧️',
          effect: 0.6
        },
        windy: {
          name: '大風',
          description: '強風使蜜蜂難以飛行',
          icon: '🌬️',
          effect: 0.7
        },
        drought: {
          name: '乾旱',
          description: '乾旱使花朵缺乏花蜜',
          icon: '🏜️',
          effect: 0.5
        },
        cold: {
          name: '寒冷',
          description: '低溫使蜜蜂活動減緩',
          icon: '❄️',
          effect: 0.4
        },
        perfect: {
          name: '完美天氣',
          description: '理想的蜜蜂採集天氣，花朵盛開',
          icon: '🌈',
          effect: 1.2
        }
      }
    },
  
    getters: {
      // 獲取當前天氣數據
      currentWeather(state) {
        return {
          type: state.current,
          name: state.weatherTypes[state.current].name,
          description: state.weatherTypes[state.current].description,
          icon: state.weatherTypes[state.current].icon,
          effect: state.effectMultiplier
        };
      },
      
      // 檢查是否為惡劣天氣
      isBadWeather(state) {
        return state.effectMultiplier < 0.8;
      },
      
      // 天氣效果顏色
      weatherEffectColor(state) {
        if (state.effectMultiplier > 1.0) {
          return '#4caf50'; // 綠色 (好)
        } else if (state.effectMultiplier > 0.7) {
          return '#ff9800'; // 橙色 (一般)
        } else {
          return '#e53935'; // 紅色 (差)
        }
      }
    },
  
    mutations: {
      SET_WEATHER(state, { current, effectMultiplier, daysRemaining }) {
        state.current = current;
        state.effectMultiplier = effectMultiplier;
        state.daysRemaining = daysRemaining || 0;
      },
      
      DECREASE_WEATHER_DAYS(state) {
        if (state.daysRemaining > 0) {
          state.daysRemaining--;
        }
      },
      
      RESET_WEATHER(state) {
        state.current = 'sunny';
        state.effectMultiplier = 1.0;
        state.daysRemaining = 0;
      }
    },
  
    actions: {
      // 隨機更換天氣
      changeWeather({ state, commit, dispatch }) {
        // 如果當前天氣還有剩餘天數，不更換
        if (state.daysRemaining > 0) {
          commit('DECREASE_WEATHER_DAYS');
          return;
        }
        
        // 天氣類型概率分佈 (加權隨機)
        const weatherChances = {
          sunny: 0.3,    // 30% 機率
          cloudy: 0.25,  // 25% 機率
          rainy: 0.15,   // 15% 機率
          windy: 0.15,   // 15% 機率
          drought: 0.05, // 5% 機率
          cold: 0.05,    // 5% 機率
          perfect: 0.05  // 5% 機率
        };
        
        // 隨機選擇天氣
        const roll = Math.random();
        let selectedWeather = 'sunny'; // 默認晴天
        let cumulativeChance = 0;
        
        for (const [weather, chance] of Object.entries(weatherChances)) {
          cumulativeChance += chance;
          if (roll < cumulativeChance) {
            selectedWeather = weather;
            break;
          }
        }
        
        // 設置新天氣，持續1-3天
        const duration = Math.floor(Math.random() * 3) + 1;
        
        commit('SET_WEATHER', {
          current: selectedWeather,
          effectMultiplier: state.weatherTypes[selectedWeather].effect,
          daysRemaining: duration
        });
        
        // 通知玩家
        dispatch('showNotification', {
          message: `天氣變化: ${state.weatherTypes[selectedWeather].name} - ${state.weatherTypes[selectedWeather].description}`,
          type: 'info'
        }, { root: true });
        
        // 如果是惡劣天氣，可能觸發天氣挑戰
        if (state.weatherTypes[selectedWeather].effect < 0.7 && Math.random() < 0.3) {
          dispatch('challenges/createWeatherChallenge', {
            weatherType: selectedWeather
          }, { root: true });
        }
      },
      
      // 通過特殊能力改善天氣
      improveWeather({ state, commit, dispatch }) {
        // 如果已經是最佳天氣，不改變
        if (state.current === 'perfect') {
          dispatch('showNotification', {
            message: '天氣已經是最佳狀態！',
            type: 'info'
          }, { root: true });
          return;
        }
        
        // 設置為完美天氣，持續1天
        commit('SET_WEATHER', {
          current: 'perfect',
          effectMultiplier: state.weatherTypes['perfect'].effect,
          daysRemaining: 1
        });
        
        dispatch('showNotification', {
          message: '使用了天氣改善技術！現在是完美的採蜜天氣',
          type: 'success'
        }, { root: true });
      }
    }
  };