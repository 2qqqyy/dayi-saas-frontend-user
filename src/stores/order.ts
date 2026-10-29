import { defineStore } from "pinia";
import type { OrderItem, OrderStatus } from "@/types/business";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";
import { getOrderList, cancelOrder as apiCancelOrder, confirmOrder as apiConfirmOrder } from "@/api/order";

interface OrderState {
  orderList: OrderItem[];
  currentOrder: OrderItem | null;
  seeded: boolean;
}

export const useOrderStore = defineStore("order", {
  state: (): OrderState => ({
    orderList: getStorage<OrderItem[]>(STORAGE_KEYS.order, []),
    currentOrder: null,
    seeded: false,
  }),
  getters: {
    pendingCount: (state) =>
      state.orderList.filter(
        (o) =>
          o.status === "pending_payment" ||
          o.status === "pending_use" ||
          o.status === "pending_receive",
      ).length,
    /** 各状态的订单数量，供「我的」页角标使用 */
    countByStatus: (state) => (status: OrderStatus) =>
      state.orderList.filter((o) => o.status === status).length,
  },
  actions: {
    persist() {
      setStorage(STORAGE_KEYS.order, this.orderList);
    },
    /** 退出登录 / 清除缓存：本地那份是按账号缓存的，必须清掉 */
    clearLocal() {
      this.orderList = [];
      this.currentOrder = null;
      this.seeded = false;
      removeStorage(STORAGE_KEYS.order);
    },
    async ensureSeeded() {
      // 订单真身在 order 表，整体以服务端为准：
      // 之前的「本地合并」会把上一个账号缓存的订单一直带下去
      const res = await getOrderList();
      this.orderList = res.data;
      this.persist();
      this.seeded = true;
    },
    addOrder(order: OrderItem) {
      this.orderList.unshift(order);
      this.persist();
    },
    async fetchOrderList(status?: OrderStatus): Promise<OrderItem[]> {
      await this.ensureSeeded();
      if (!status || status === "all") return this.orderList;
      return this.orderList.filter((o) => o.status === status);
    },
    findOrder(id: string) {
      return this.orderList.find((o) => o.id === id) ?? null;
    },
    async fetchOrderDetail(id: string) {
      await this.ensureSeeded();
      this.currentOrder = this.findOrder(id);
      return this.currentOrder;
    },
    async cancelOrder(id: string) {
      await apiCancelOrder(id);
      const order = this.findOrder(id);
      if (order) order.status = "after_sale";
      this.persist();
    },
    payOrder(id: string) {
      const order = this.findOrder(id);
      if (order) {
        order.status = order.type === "product" ? "pending_delivery" : "pending_use";
      }
      this.persist();
    },
    async confirmReceive(id: string) {
      await apiConfirmOrder(id);
      const order = this.findOrder(id);
      if (order) order.status = "completed";
      this.persist();
    },
  },
});
