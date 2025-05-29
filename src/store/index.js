import { createStore } from "vuex";

// 導入各模組
import beesModule from "./modules/bees";
import honeyModule from "./modules/honey";
import ordersModule from "./modules/orders";
import foragingModule from "./modules/foraging";
import challengesModule from "./modules/challenges";
import weatherModule from "./modules/weather";
import laborTasksModule from "./modules/laborTasks";
import tasks from "./modules/tasks";
import achievements from "./modules/achievements";

// 導入存檔系統
import persistenceModule from "./helpers/persistence";
import { saveGamePlugin } from "./helpers/persistence";

export default createStore({
  // 根 state
  state: {
    currentBeeFact:
      "蜜蜂是地球上最重要的授粉者之一，對全球農業生產和生態系統至關重要。",
    money: 100,
  },

  // 根 mutations
  mutations: {
    SET_BEE_FACT(state, fact) {
      state.currentBeeFact = fact;
    },

    SET_MONEY(state, amount) {
      state.money = amount;
    },

    ADD_MONEY(state, amount) {
      state.money += amount;
    },

    REMOVE_MONEY(state, amount) {
      state.money = Math.max(0, state.money - amount);
    },
  },

  // 根 actions
  actions: {
    // 顯示通知 (全局可用)
    showNotification(context, { message, type = "info" }) {
      const notificationArea = document.querySelector(".notification-area");
      if (!notificationArea) {
        console.error("無法找到通知區域元素");
        return;
      }

      const notification = document.createElement("div");
      notification.className = `notification ${type}`;
      notification.textContent = message;

      notificationArea.appendChild(notification);

      // 3秒後自動消失
      setTimeout(() => {
        notification.style.animation = "slideOut 0.3s forwards";
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    },

    // 初始化遊戲
    setupGame({ commit, dispatch }) {
      console.log("設置遊戲邏輯...");

      // 設置遊戲循環
      setInterval(() => {
        // 生產蜂蜜
        dispatch("honey/produceHoney");

        // 自動保存遊戲 (每分鐘保存一次)
        if (Date.now() % 60000 < 1000) {
          dispatch("persistence/saveGame");
          dispatch("achievements/checkAchievements");
        }

        // 隨機觸發挑戰 (每3分鐘有機率)
        if (Date.now() % 180000 < 1000) {
          dispatch("challenges/maybeStartChallenge");
        }
      }, 1000);

      // 訂單系統初始化
      dispatch("orders/initOrders");
      dispatch("tasks/initTasks");
      dispatch("achievements/initAchievements");

      // 更新養蜂知識
      const beeFacts = [
        "一隻工蜂一生中只能生產約1茶匙的蜂蜜。",
        "蜂后一天可以產下多達2000顆蛋，是自己體重兩倍的蛋量。",
        "蜜蜂會跳舞來告訴其他蜜蜂花蜜的位置。",
        "蜜蜂翅膀每秒鐘可以拍打200次。",
        "一個健康的蜂巢在夏季可以有高達80,000隻蜜蜂。",
      ];

      commit(
        "SET_BEE_FACT",
        beeFacts[Math.floor(Math.random() * beeFacts.length)]
      );

      // 設置定時更新養蜂知識
      setInterval(() => {
        commit(
          "SET_BEE_FACT",
          beeFacts[Math.floor(Math.random() * beeFacts.length)]
        );
      }, 60000);
    },

    // 初始化遊戲 (先載入數據，再設置邏輯)
    initGame({ dispatch }) {
      console.log("初始化遊戲...");
      return dispatch("loadGame").then(() => {
        dispatch("setupGame");
      });
    },

    // 保存遊戲 (委派給 persistence 模組)
    saveGame({ dispatch }) {
      dispatch("persistence/saveGame");
    },

    // 載入遊戲 (委派給 persistence 模組)
    loadGame({ dispatch }) {
      dispatch("persistence/loadGame");
    },
  },

  // 註冊模組
  modules: {
    bees: beesModule,
    honey: honeyModule,
    orders: ordersModule,
    foraging: foragingModule,
    challenges: challengesModule,
    weather: weatherModule,
    laborTasks: laborTasksModule,
    persistence: persistenceModule,
    tasks: tasks,
    achievements: achievements,
  },

  // 插件
  plugins: [saveGamePlugin],
});
