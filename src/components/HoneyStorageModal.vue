<template>
  <div class="modal" :class="{ active: isActive, hidden: !isActive }">
    <div class="modal-header">
      <h2>蜂蜜倉庫</h2>
      <button class="modal-close" @click="closeModal">&times;</button>
    </div>
    <div class="modal-content">
      <div class="storage-info">
        <div class="capacity-bar">
          <div
            class="capacity-fill"
            :style="{ width: capacityPercentage + '%' }"
          ></div>
        </div>
        <div class="capacity-text">
          {{ totalHoney.toFixed(1) }}kg / {{ honeyCapacity }}kg
        </div>
        <button
          @click="upgradeStorage"
          class="upgrade-button"
          :disabled="!canUpgradeStorage"
        >
          擴充倉庫 (¥{{ upgradeCost }})
        </button>
      </div>

      <h3>蜂蜜庫存</h3>
      <div class="honey-list">
        <div
          v-for="(amount, type) in inventory"
          :key="type"
          class="honey-item"
          v-show="amount > 0 || allHoneyTypes[type]"
        >
          <div class="honey-info">
            <div
              class="honey-color"
              :style="{ backgroundColor: honeyTypeColor(type) }"
            ></div>
            <div class="honey-details">
              <h3>{{ honeyTypeName(type) }}</h3>
              <p>{{ honeyTypeDescription(type) }}</p>
              <div class="honey-amount">{{ amount.toFixed(1) }}kg</div>
            </div>
          </div>
          <div class="honey-actions">
            <div class="sell-controls">
              <input
                type="number"
                min="0.1"
                :max="amount"
                step="0.1"
                v-model.number="sellAmounts[type]"
                :disabled="amount <= 0"
              />
              <button
                @click="sellHoney(type)"
                :disabled="!canSell(type)"
                class="sell-button"
              >
                出售 (¥{{ calculateSellValue(type) }})
              </button>
            </div>
          </div>
        </div>
      </div>

      <h3>客戶訂單</h3>
      <div class="orders-list">
        <div v-if="activeOrders.length === 0" class="no-orders">
          目前沒有訂單，請等待客戶下單。
        </div>
        <div
          v-for="(order, index) in activeOrders"
          :key="order.id"
          class="order-item"
        >
          <div class="order-header">
            <h3>{{ order.customer }}的訂單</h3>
            <div class="order-expiry">
              剩餘時間: {{ formatRemainingTime(order.expiryTime) }}
            </div>
          </div>
          <div class="order-requirements">
            <div
              v-for="(req, reqIndex) in order.requirements"
              :key="reqIndex"
              class="requirement-item"
            >
              <div
                class="honey-color"
                :style="{ backgroundColor: honeyTypeColor(req.type) }"
              ></div>
              <span>{{ honeyTypeName(req.type) }}</span>
              <span class="requirement-amount">
                {{ req.amount }}kg /
                {{ Math.min(req.amount, inventory[req.type]).toFixed(1) }}kg
              </span>
            </div>
          </div>
          <div class="order-value">
            <div class="base-value">基本價值: ¥{{ order.baseValue }}</div>
            <div class="bonus-value">獎勵: ¥{{ order.bonusValue }}</div>
            <div class="total-value">總價: ¥{{ order.totalValue }}</div>
          </div>
          <button
            @click="fulfillOrder(index)"
            :disabled="!canFulfillOrder(order)"
            class="fulfill-button"
          >
            完成訂單
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapState } from "vuex";

  export default {
    props: {
      isActive: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        sellAmounts: {
          common: 1.0,
          wildflower: 1.0,
          mountain: 1.0,
          rare: 1.0,
        },
      };
    },
    computed: {
      ...mapState({
        inventory: (state) => state.honey.inventory,
        honeyCapacity: (state) => state.honey.capacity,
        activeOrders: (state) => state.orders.active,
        allHoneyTypes: (state) => state.honey.honeyTypes,
        money: (state) => state.money,
      }),

      totalHoney() {
        return Object.values(this.inventory).reduce(
          (sum, amount) => sum + amount,
          0
        );
      },

      capacityPercentage() {
        return (this.totalHoney / this.honeyCapacity) * 100;
      },

      upgradeCost() {
        return Math.floor(this.honeyCapacity * 1.2);
      },

      canUpgradeStorage() {
        return this.money >= this.upgradeCost;
      },
    },
    methods: {
      closeModal() {
        this.$emit("close-modal");
      },

      honeyTypeName(type) {
        return this.allHoneyTypes[type]?.name || type;
      },

      honeyTypeDescription(type) {
        return this.allHoneyTypes[type]?.description || "";
      },

      honeyTypeColor(type) {
        return this.allHoneyTypes[type]?.color || "#cccccc";
      },

      calculateSellValue(type) {
        const amount = this.sellAmounts[type] || 0;
        const price = this.allHoneyTypes[type]?.basePrice * 0.9 || 0;
        return Math.floor(amount * price);
      },

      canSell(type) {
        const amount = this.sellAmounts[type] || 0;
        return amount > 0 && amount <= this.inventory[type];
      },

      sellHoney(type) {
        if (!this.canSell(type)) return;

        this.$store.dispatch("honey/sellHoneyByType", {
          type,
          amount: this.sellAmounts[type],
        });
      },

      upgradeStorage() {
        this.$store.dispatch("honey/upgradeHoneyStorage");
      },

      canFulfillOrder(order) {
        for (const req of order.requirements) {
          if (this.inventory[req.type] < req.amount) {
            return false;
          }
        }
        return true;
      },

      fulfillOrder(index) {
        this.$store.dispatch("orders/fulfillOrder", index);
      },

      formatRemainingTime(expiryTime) {
        const now = Date.now();
        const remainingMs = expiryTime - now;

        if (remainingMs <= 0) return "已過期";

        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.floor(
          (remainingMs % (60 * 60 * 1000)) / (60 * 1000)
        );

        return `${hours}小時${minutes}分鐘`;
      },
    },
  };
</script>

<style scoped>

  .modal-background {
    display: none;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e0d8c8;
  }

  .modal-header h2 {
    margin: 0;
    color: #8b5a00;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #8c6d3c;
  }

  .modal-close:hover {
    color: #5d4215;
  }

  .modal-content {
    position: relative;
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
    margin: 0;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .storage-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    background-color: #f9f5ea;
    padding: 15px;
    border-radius: 8px;
  }

  .capacity-bar {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
  }

  .capacity-fill {
    height: 100%;
    background-color: #ffcc00;
    transition: width 0.3s;
  }

  .capacity-text {
    font-weight: bold;
    color: #5d4215;
  }

  .upgrade-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 5px;
  }

  .upgrade-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  /* 蜂蜜列表樣式 */
  .honey-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }

  .honey-item {
    display: flex;
    justify-content: space-between;
    background-color: #f9f5ea;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .honey-info {
    display: flex;
    gap: 15px;
    flex: 1;
  }

  .honey-color {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    align-self: center;
  }

  .honey-details {
    flex: 1;
  }

  .honey-details h3 {
    margin: 0 0 5px 0;
    color: #8b5a00;
    font-size: 1rem;
  }

  .honey-details p {
    margin: 0 0 10px 0;
    font-size: 0.9em;
    color: #666;
  }

  .honey-amount {
    font-weight: bold;
    font-size: 1.1em;
    color: #5d4215;
  }

  .honey-actions {
    display: flex;
    align-items: center;
  }

  .sell-controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .sell-controls input {
    width: 60px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .sell-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
  }

  .sell-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  /* 訂單列表樣式 */
  h3 {
    margin-top: 20px;
    margin-bottom: 15px;
    color: #5d4215;
    border-bottom: 1px solid #e0d8c8;
    padding-bottom: 8px;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .order-item {
    background-color: #f9f5ea;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .order-header h3 {
    margin: 0;
    color: #8b5a00;
    border-bottom: none;
    padding-bottom: 0;
    font-size: 1rem;
  }

  .order-expiry {
    color: #e53935;
    font-weight: bold;
    font-size: 0.9em;
  }

  .order-requirements {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }

  .requirement-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .requirement-amount {
    margin-left: auto;
    font-weight: bold;
  }

  .order-value {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 15px;
    background-color: rgba(255, 255, 255, 0.5);
    padding: 10px;
    border-radius: 6px;
  }

  .base-value,
  .bonus-value {
    flex: 1;
    min-width: 120px;
  }

  .total-value {
    font-weight: bold;
    font-size: 1.1em;
    flex: 100%;
    color: #5d4215;
  }

  .fulfill-button {
    background-color: #8b5a00;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }

  .fulfill-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .no-orders {
    text-align: center;
    padding: 20px;
    color: #8c6d3c;
    font-style: italic;
  }
</style>
