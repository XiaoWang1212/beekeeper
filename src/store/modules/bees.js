export default {
  namespaced: true,

  state: {
    bees: 0,
    hiveLevel: 1,
    hiveHealth: 100,
    hiveCapacity: 10,
    honeyPerBeePerMinute: 0.1,
    costs: {
      bee: 50,
      hiveUpgrade: 200,
    },
    assignedBees: 0,
  },

  getters: {
    healthColorStyle(state) {
      if (state.hiveHealth < 30) {
        return { color: "#e53935" };
      } else if (state.hiveHealth < 60) {
        return { color: "#ff9800" };
      } else {
        return { color: "#4caf50" };
      }
    },

    canBuyBee(state, getters, rootState) {
      return (
        rootState.money >= state.costs.bee && state.bees < state.hiveCapacity
      );
    },

    canUpgradeHive(state, getters, rootState) {
      return rootState.money >= state.costs.hiveUpgrade;
    },

    availableBees(state) {
      return state.bees - (state.assignedBees || 0);
    },
  },

  mutations: {
    SET_BEES(state, amount) {
      state.bees = amount;
    },

    ADD_BEES(state, amount) {
      state.bees += amount;
    },

    REMOVE_BEES(state, amount) {
      state.bees = Math.max(0, state.bees - amount);
    },

    // 派遣蜜蜂到採蜜任務
    ASSIGN_BEES(state, count) {
      state.assignedBees = (state.assignedBees || 0) + count;
    },

    // 從採蜜任務歸還蜜蜂
    RETURN_BEES(state, count) {
      state.assignedBees = Math.max(0, (state.assignedBees || 0) - count);
    },

    SET_HIVE_LEVEL(state, level) {
      state.hiveLevel = level;
    },

    SET_HIVE_CAPACITY(state, capacity) {
      state.hiveCapacity = capacity;
    },

    SET_HONEY_EFFICIENCY(state, efficiency) {
      state.honeyPerBeePerMinute = efficiency;
    },

    SET_COSTS(state, costs) {
      state.costs = costs;
    },

    SET_HIVE_HEALTH(state, amount) {
      state.hiveHealth = Math.min(100, Math.max(0, amount));
    },

    UPGRADE_HIVE(state) {
      state.hiveLevel += 1;
      state.hiveCapacity += 5;
      state.honeyPerBeePerMinute += 0.05;
      state.costs.hiveUpgrade = Math.floor(state.costs.hiveUpgrade * 1.5);
    },

    SET_ASSIGNED_BEES(state, count) {
      state.assignedBees = count;
    },
  },

  actions: {
    // 購買蜜蜂
    buyBee({ state, commit, rootGetters, dispatch }) {
      if (!rootGetters["bees/canBuyBee"]) return;

      commit("REMOVE_MONEY", state.costs.bee, { root: true });
      commit("ADD_BEES", 1);

      dispatch(
        "showNotification",
        {
          message: "購買了1隻新蜜蜂！",
          type: "success",
        },
        { root: true }
      );

      dispatch("tasks/trackBuyBee", null, { root: true });
      dispatch("achievements/checkAchievements", null, { root: true });
    },

    // 升級蜂巢
    upgradeHive({ state, commit, rootGetters, dispatch }) {
      if (!rootGetters["bees/canUpgradeHive"]) return;

      commit("REMOVE_MONEY", state.costs.hiveUpgrade, { root: true });
      commit("UPGRADE_HIVE");

      dispatch(
        "showNotification",
        {
          message: `蜂巢升級到等級 ${state.hiveLevel}！容量和效率提升了`,
          type: "success",
        },
        { root: true }
      );

      dispatch("tasks/trackUpgradeHive", null, { root: true });
      dispatch("achievements/checkAchievements", null, { root: true });
    },

    // 檢查蜂巢
    checkHive({ state, commit, dispatch }) {
      dispatch(
        "laborTasks/startLaborTask",
        {
          taskName: "檢查蜂巢",
          clicksNeeded: 8,
          onComplete: () => {
            // 檢查可以發現問題並略微提升蜂群健康
            commit("SET_HIVE_HEALTH", state.hiveHealth + 5);

            dispatch(
              "showNotification",
              {
                message: "檢查完成，蜂巢狀況良好！",
                type: "success",
              },
              { root: true }
            );
          },
        },
        { root: true }
      );
    },
  },
};
