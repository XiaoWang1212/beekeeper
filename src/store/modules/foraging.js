export default {
  namespaced: true,

  state: {
    activeMissions: [],
    selectedArea: null,
    maxMissions: 3,

    // 採蜜區域
    areas: {
      garden: {
        name: "花園",
        description: "接近蜂巢的花園，安全但花蜜較少",
        distance: 1,
        baseDuration: 30, // 秒
        reward: {
          common: { min: 1, max: 3 },
          wildflower: { min: 0, max: 1 },
          mountain: { min: 0, max: 0 },
          rare: { min: 0, max: 0 },
        },
        risk: 0.05, // 5% 失敗風險
        beeCount: 1,
      },
      meadow: {
        name: "草地",
        description: "附近的開闊草地，有更多品種的野花",
        distance: 2,
        baseDuration: 60, // 秒
        reward: {
          common: { min: 2, max: 4 },
          wildflower: { min: 1, max: 2 },
          mountain: { min: 0, max: 0.5 },
          rare: { min: 0, max: 0.1 },
        },
        risk: 0.1, // 10% 失敗風險
        beeCount: 2,
      },
      forest: {
        name: "森林",
        description: "距離較遠的森林，有許多獨特的花種",
        distance: 3,
        baseDuration: 120, // 秒
        reward: {
          common: { min: 1, max: 2 },
          wildflower: { min: 2, max: 4 },
          mountain: { min: 1, max: 2 },
          rare: { min: 0.1, max: 0.5 },
        },
        risk: 0.15, // 15% 失敗風險
        beeCount: 3,
      },
      mountain: {
        name: "山區",
        description: "遙遠的山區，有稀有的高海拔花種",
        distance: 5,
        baseDuration: 180, // 秒
        reward: {
          common: { min: 0, max: 1 },
          wildflower: { min: 1, max: 2 },
          mountain: { min: 2, max: 4 },
          rare: { min: 0.5, max: 1 },
        },
        risk: 0.25, // 25% 失敗風險
        beeCount: 4,
      },
    },

    // 已收集的蜂蜜記錄
    honeyCollected: {
      common: 0,
      wildflower: 0,
      mountain: 0,
      rare: 0,
    },

    missionStats: {
      totalMissions: 0,
      successMissions: 0,
      failedMissions: 0,
    },
    missionHistory: [], // 最近任務的歷史記錄
  },

  getters: {
    canStartMission(state, getters, rootState, rootGetters) {
      if (state.selectedArea === null) return false;

      const areaData = state.areas[state.selectedArea];
      const minBeesNeeded = areaData.beeCount;
      const availableBees = rootGetters["bees/availableBees"];

      return (
        availableBees >= minBeesNeeded &&
        state.activeMissions.length < state.maxMissions
      );
    },

    foragingStats(state) {
      return {
        totalMissions: state.activeMissions.length,
        maxMissions: state.maxMissions,
        totalHoneyCollected: Object.values(state.honeyCollected).reduce(
          (a, b) => a + b,
          0
        ),
      };
    },
  },

  mutations: {
    SET_SELECTED_AREA(state, area) {
      state.selectedArea = area;
    },

    START_MISSION(state, mission) {
      state.activeMissions.push(mission);
    },

    COMPLETE_MISSION(state, missionId) {
      const index = state.activeMissions.findIndex((m) => m.id === missionId);
      if (index !== -1) {
        state.activeMissions.splice(index, 1);
      }
    },

    ADD_COLLECTED_HONEY(state, { type, amount }) {
      state.honeyCollected[type] += amount;
    },

    SET_FORAGING_DATA(state, data) {
      if (data.activeMissions) state.activeMissions = data.activeMissions;
      if (data.selectedArea) state.selectedArea = data.selectedArea;
      if (data.honeyCollected) state.honeyCollected = data.honeyCollected;
      if (data.maxMissions) state.maxMissions = data.maxMissions;
      if (data.missionHistory) {
        console.log("設置任務歷史記錄:", data.missionHistory);
        state.missionHistory = data.missionHistory;
      }
      if (data.missionStats) {
        console.log("設置任務統計:", data.missionStats);
        state.missionStats = data.missionStats;
      }
    },

    ADD_MISSION_RECORD(state, record) {
      // 更新統計
      state.missionStats.totalMissions++;
      if (record.success) {
        state.missionStats.successMissions++;
      } else {
        state.missionStats.failedMissions++;
      }

      // 添加到歷史記錄（最多保留10條）
      state.missionHistory.unshift(record);
      if (state.missionHistory.length > 10) {
        state.missionHistory.pop();
      }
    },
  },

  actions: {
    // 選擇採蜜區域
    selectArea({ commit }, area) {
      commit("SET_SELECTED_AREA", area);
    },

    // 開始採蜜任務
    startForagingMission(
      { state, commit, rootState, rootGetters, dispatch },
      missionData
    ) {
      if (!rootGetters["foraging/canStartMission"]) {
        dispatch(
          "showNotification",
          {
            message: "無法開始採蜜任務！請確保有足夠的蜜蜂。",
            type: "warning",
          },
          { root: true }
        );
        return;
      }

      const area = missionData.area;
      const areaData = state.areas[area];

      const beesToAssign = missionData.bees;

      // 根據選擇的時間長度調整基礎持續時間
      let baseDuration = areaData.baseDuration;

      if (missionData.duration === "medium") {
        baseDuration = baseDuration * 2; // 中程任務時間加倍
      } else if (missionData.duration === "long") {
        baseDuration = baseDuration * 4; // 長程任務時間四倍
      }

      console.log(
        `任務時間計算: 基礎=${areaData.baseDuration}, 選擇=${missionData.duration}, 計算後=${baseDuration}`
      );

      // 計算任務持續時間，受天氣影響
      const weatherMultiplier = rootState.weather.effectMultiplier || 1.0;
      const duration = Math.ceil(baseDuration / weatherMultiplier);

      // 創建新任務
      const mission = {
        id: Date.now(), // 唯一ID
        area: area,
        bees: beesToAssign,
        risk: missionData.risk,
        duration: missionData.duration, // 保存時間類型，而不是秒數
        durationSeconds: duration, // 保存實際秒數
        startTime: Date.now(),
        endTime: Date.now() + duration * 1000,
        inProgress: true,
      };

      commit("START_MISSION", mission);

      commit("bees/ASSIGN_BEES", beesToAssign, { root: true });

      let timeDisplay;
      if (duration < 60) {
        timeDisplay = `${duration} 秒`;
      } else {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        timeDisplay =
          seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分鐘`;
      }

      dispatch(
        "showNotification",
        {
          message: `派出 ${missionData.bees} 隻蜜蜂去 ${areaData.name} 採蜜，預計需要 ${timeDisplay}`,
          type: "info",
        },
        { root: true }
      );

      // 設置完成計時器
      setTimeout(() => {
        dispatch("completeMission", mission.id);
      }, duration * 1000);
    },

    // 完成採蜜任務
    completeMission({ state, commit, dispatch }, missionId) {
      const missionIndex = state.activeMissions.findIndex(
        (m) => m.id === missionId
      );
      if (missionIndex === -1) return;

      const mission = state.activeMissions[missionIndex];
      const areaData = state.areas[mission.area];
      const beesToReturn = mission.bees;

      // 計算任務是否成功 (失敗率受天氣影響)
      const roll = Math.random();
      const success = roll > areaData.risk;

      // 準備記錄對象 - 使用任務中的蜜蜂數量，而非區域默認值
      const missionRecord = {
        id: mission.id,
        area: mission.area,
        date: Date.now(),
        bees: mission.bees, // 使用任務記錄的蜜蜂數量
        risk: areaData.risk, // 使用任務記錄的風險等級
        success: success,
        rewards: {},
        lostBees: 0,
      };

      if (success) {
        // 計算獲得的蜂蜜
        const rewards = {};
        // let totalHoney = 0;

        for (const [type, range] of Object.entries(areaData.reward)) {
          if (range.max <= 0) continue;

          const amount = Math.random() * (range.max - range.min) + range.min;
          if (amount > 0) {
            rewards[type] = Number(amount.toFixed(1));
            // totalHoney += rewards[type];

            // 添加到收集記錄
            commit("ADD_COLLECTED_HONEY", { type, amount: rewards[type] });

            // 添加到蜂蜜庫存
            commit(
              "honey/ADD_HONEY_BY_TYPE",
              { type, amount: rewards[type] },
              { root: true }
            );
          }
        }

        // 添加獎勵到記錄
        missionRecord.rewards = rewards;

        commit("bees/RETURN_BEES", beesToReturn, { root: true });

        // 通知玩家
        let rewardText = Object.entries(rewards)
          .map(
            ([type, amount]) =>
              `${amount}kg ${
                state.honeyTypes ? state.honeyTypes[type].name : type
              }`
          )
          .join("、");

        dispatch(
          "showNotification",
          {
            message: `採蜜成功！從 ${areaData.name} 收穫了 ${rewardText}，已存入蜂蜜倉庫`,
            type: "success",
          },
          { root: true }
        );
      } else {
        // 任務失敗 - 減輕懲罰

        // 修改這裡：降低蜜蜂損失機率，根據區域風險調整
        // 風險越高的區域，損失機率越高，但整體降低
        const lossChance = Math.min(0.1, areaData.risk / 5); // 最高只有10%機率損失蜜蜂

        // 如果派遣的蜜蜂超過最低需求，進一步降低損失風險
        const extraBees = Math.max(0, mission.bees - areaData.beeCount);
        const reducedLossChance =
          extraBees > 0 ? lossChance * (1 - extraBees * 0.1) : lossChance;

        // 最終損失機率不低於1%
        const finalLossChance = Math.max(0.01, reducedLossChance);

        // 決定是否損失蜜蜂
        const lostBees = Math.random() < finalLossChance ? 1 : 0;

        missionRecord.lostBees = lostBees;

        // 歸還未損失的蜜蜂
        const beesToReturn = mission.bees - lostBees;
        if (beesToReturn > 0) {
          commit("bees/RETURN_BEES", beesToReturn, { root: true });
        }

        // 如果有損失蜜蜂，更新蜜蜂數量
        if (lostBees > 0) {
          commit("bees/REMOVE_BEES", lostBees, { root: true });
        }

        // 任務失敗，但仍可能帶回一些蜂蜜 (約成功時的20%)
        if (Math.random() < 0.5) {
          // 50%機率帶回一些蜂蜜
          const rewards = {};

          for (const [type, range] of Object.entries(areaData.reward)) {
            if (range.max <= 0) continue;

            // 失敗時只能獲得20%的蜂蜜
            const amount =
              Math.random() * (range.max - range.min) * 0.2 + range.min * 0.2;
            if (amount > 0.1) {
              // 只有超過0.1kg才記錄，避免太小的數量
              rewards[type] = Number(amount.toFixed(1));

              // 添加到收集記錄
              commit("ADD_COLLECTED_HONEY", { type, amount: rewards[type] });

              // 添加到蜂蜜庫存
              commit(
                "honey/ADD_HONEY_BY_TYPE",
                { type, amount: rewards[type] },
                { root: true }
              );
            }
          }

          // 添加獎勵到記錄
          missionRecord.rewards = rewards;

          // 如果有收集到蜂蜜，在通知中說明
          const rewardText = Object.entries(rewards)
            .filter(([, amount]) => amount > 0)
            .map(
              ([type, amount]) =>
                `${amount}kg ${
                  state.honeyTypes ? state.honeyTypes[type].name : type
                }`
            )
            .join("、");

          dispatch(
            "showNotification",
            {
              message: `採蜜失敗！蜜蜂們在 ${areaData.name} 遇到了困難${
                lostBees > 0 ? `，損失了 ${lostBees} 隻蜜蜂` : ""
              }${rewardText ? `，但仍帶回了一些蜂蜜：${rewardText}` : ""}`,
              type: "warning",
            },
            { root: true }
          );
        } else {
          dispatch(
            "showNotification",
            {
              message: `採蜜失敗！蜜蜂們在 ${areaData.name} 遇到了困難${
                lostBees > 0 ? `，損失了 ${lostBees} 隻蜜蜂` : ""
              }`,
              type: "danger",
            },
            { root: true }
          );
        }
      }

      // 添加任務記錄
      commit("ADD_MISSION_RECORD", missionRecord);

      // 移除任務
      commit("COMPLETE_MISSION", missionId);

      dispatch("achievements/checkAchievements", null, { root: true });
    },
  },
};
