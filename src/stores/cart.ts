import { defineStore } from "pinia";
import type { CartItem } from "@/types/business";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";
import * as cartApi from "@/api/cart";
import { useUserStore } from "@/stores/user";

export interface AddCartPayload {
  productId: string;
  skuId: string;
  name: string;
  image: string;
  summary: string;
  price: number;
  quantity: number;
  stock: number;
}

/** 服务端购物车行的 id 是数字；游客本地条目是 cart-时间戳 */
function isServerRow(id: string) {
  return /^\d+$/.test(id);
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    cartList: getStorage<CartItem[]>(STORAGE_KEYS.cart, []),
    syncing: false,
    resync: false,
  }),
  getters: {
    totalCount: (state) => state.cartList.reduce((s, i) => s + i.quantity, 0),
    selectedItems: (state) => state.cartList.filter((i) => i.selected && !i.invalid),
    selectedCount: (state) =>
      state.cartList
        .filter((i) => i.selected && !i.invalid)
        .reduce((s, i) => s + i.quantity, 0),
    selectedAmount: (state) =>
      state.cartList
        .filter((i) => i.selected && !i.invalid)
        .reduce((s, i) => s + i.price * i.quantity, 0),
    allSelected: (state) => {
      const valid = state.cartList.filter((i) => !i.invalid);
      return valid.length > 0 && valid.every((i) => i.selected);
    },
  },
  actions: {
    persist() {
      setStorage(STORAGE_KEYS.cart, this.cartList);
    },
    /** 登录后购物车以 cart_item 表为准；游客没有 token，只能留在本地 */
    isRemote() {
      return useUserStore().isLogin;
    },
    /**
     * 拉服务端购物车覆盖本地。
     * 失败时保留本地缓存，避免弱网一进购物车就变空。
     * 返回是否成功，供页面决定要不要提示。
     */
    async syncFromServer(): Promise<boolean> {
      if (!this.isRemote()) return false;
      // 同步进行中又来一次（登录后合并本地车与页面 onShow 可能撞在一起），
      // 记下待补跑，等当前这次结束后再拉一遍，避免漏掉刚写入的行
      if (this.syncing) {
        this.resync = true;
        return false;
      }
      this.syncing = true;
      try {
        const res = await cartApi.getCartList();
        this.cartList = res.data;
        this.persist();
        return true;
      } catch {
        return false;
      } finally {
        this.syncing = false;
        if (this.resync) {
          this.resync = false;
          this.syncFromServer();
        }
      }
    },
    /** 登录后把游客期间加购的本地条目补传到服务端，再整体对齐一次 */
    async mergeLocalIntoServer() {
      if (!this.isRemote()) return;
      const pending = this.cartList.filter((i) => !isServerRow(i.id));
      await Promise.all(
        pending.map((i) =>
          cartApi.addCartItem(i.productId, i.skuId, i.quantity).catch(() => null),
        ),
      );
      await this.syncFromServer();
    },
    /** 退出登录：本地那份是上一个账号的服务端购物车，必须清掉 */
    clearLocal() {
      this.cartList = [];
      removeStorage(STORAGE_KEYS.cart);
    },
    /** 加购成功返回 true；失败已回滚，提示由请求拦截器统一弹出 */
    async addCart(payload: AddCartPayload): Promise<boolean> {
      if (this.isRemote()) {
        try {
          await cartApi.addCartItem(payload.productId, payload.skuId, payload.quantity);
        } catch {
          return false;
        }
        return this.syncFromServer();
      }
      const exist = this.cartList.find((i) => i.skuId === payload.skuId && !i.invalid);
      if (exist) {
        exist.quantity = Math.min(exist.quantity + payload.quantity, exist.stock);
      } else {
        this.cartList.unshift({
          id: `cart-${Date.now()}`,
          selected: true,
          invalid: false,
          ...payload,
        });
      }
      this.persist();
      return true;
    },
    async removeCart(ids: string[]): Promise<boolean> {
      const before = this.cartList;
      this.cartList = before.filter((i) => !ids.includes(i.id));
      this.persist();
      if (!this.isRemote()) return true;
      const serverIds = ids.filter(isServerRow);
      if (!serverIds.length) return true;
      try {
        await cartApi.removeCartItems(serverIds);
        return true;
      } catch {
        this.cartList = before;
        this.persist();
        return false;
      }
    },
    async updateQuantity(id: string, quantity: number): Promise<boolean> {
      const item = this.cartList.find((i) => i.id === id);
      if (!item) return false;
      const next = Math.max(1, Math.min(quantity, item.stock));
      const before = item.quantity;
      item.quantity = next;
      this.persist();
      if (!this.isRemote() || !isServerRow(id)) return true;
      try {
        await cartApi.updateCartQuantity(id, next);
        return true;
      } catch {
        item.quantity = before;
        this.persist();
        return false;
      }
    },
    async toggleSelect(id: string): Promise<boolean> {
      const item = this.cartList.find((i) => i.id === id);
      if (!item) return false;
      const before = item.selected;
      item.selected = !before;
      this.persist();
      if (!this.isRemote() || !isServerRow(id)) return true;
      try {
        await cartApi.updateCartSelect(id, item.selected);
        return true;
      } catch {
        item.selected = before;
        this.persist();
        return false;
      }
    },
    async toggleSelectAll(checked: boolean): Promise<boolean> {
      const before = this.cartList.map((i) => i.selected);
      this.cartList.forEach((i) => {
        if (!i.invalid) i.selected = checked;
      });
      this.persist();
      if (!this.isRemote()) return true;
      try {
        await cartApi.updateCartSelectAll(checked);
        return true;
      } catch {
        this.cartList.forEach((i, idx) => {
          i.selected = before[idx];
        });
        this.persist();
        return false;
      }
    },
    async clearSelected(): Promise<boolean> {
      const before = this.cartList;
      this.cartList = before.filter((i) => !(i.selected && !i.invalid));
      this.persist();
      if (!this.isRemote()) return true;
      try {
        await cartApi.clearSelectedItems();
        return true;
      } catch {
        this.cartList = before;
        this.persist();
        return false;
      }
    },
    async clearCart(): Promise<boolean> {
      const before = this.cartList;
      this.cartList = [];
      this.persist();
      if (!this.isRemote()) return true;
      try {
        await cartApi.clearCartItems();
        return true;
      } catch {
        this.cartList = before;
        this.persist();
        return false;
      }
    },
  },
});
