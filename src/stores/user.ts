import { defineStore } from "pinia";
import type { AddressItem, FavoriteItem, UserInfo } from "@/types/business";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";
import * as userApi from "@/api/user";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: getStorage<string>(STORAGE_KEYS.token, ""),
    userInfo: getStorage<UserInfo | null>(STORAGE_KEYS.user, null),
    // 收藏/地址本地留一份是为了弱网和秒开，真身始终在服务端
    favorites: getStorage<FavoriteItem[]>(STORAGE_KEYS.favorite, []),
    addresses: getStorage<AddressItem[]>(STORAGE_KEYS.address, []),
    /** 本次会话是否已成功拉取过收藏/地址 */
    personalLoaded: false,
  }),
  getters: {
    isLogin: (state) => Boolean(state.token),
    favoriteIds: (state) => state.favorites.map((f) => f.id),
    defaultAddress: (state) =>
      state.addresses.find((a) => a.isDefault) ?? state.addresses[0] ?? null,
  },
  actions: {
    persistFavorites() {
      setStorage(STORAGE_KEYS.favorite, this.favorites);
    },
    /**
     * 拉取收藏与地址。
     * force=true 时无视会话缓存重新拉，页面 onShow 用它保证后台改数据后游客端不用刷新也可见。
     */
    async ensureSeeded(force = false) {
      // 未登录游客没有收藏/地址，直接跳过，避免无 token 请求 401 被拦截器踢到登录页
      if (!this.isLogin) return;
      if (this.personalLoaded && !force) return;
      const [favRes, addrRes] = await Promise.allSettled([
        userApi.getFavorites(),
        userApi.getAddresses(),
      ]);
      if (favRes.status === "fulfilled") {
        this.favorites = favRes.value.data;
        setStorage(STORAGE_KEYS.favorite, this.favorites);
      }
      if (addrRes.status === "fulfilled") {
        this.addresses = addrRes.value.data;
        setStorage(STORAGE_KEYS.address, this.addresses);
      }
      this.personalLoaded =
        favRes.status === "fulfilled" && addrRes.status === "fulfilled";
    },
    async login(mobile: string, code: string) {
      const res = await userApi.login({ mobile, code });
      this.token = res.data.token;
      this.userInfo = res.data.userInfo;
      setStorage(STORAGE_KEYS.token, this.token);
      setStorage(STORAGE_KEYS.user, this.userInfo);
      await this.ensureSeeded(true);
    },
    /** 注册：走 /auth/register，会被后台「允许新用户注册」开关拦截 */
    async register(mobile: string, code: string, nickname: string) {
      const res = await userApi.register({ mobile, code, nickname });
      this.token = res.data.token;
      this.userInfo = res.data.userInfo;
      setStorage(STORAGE_KEYS.token, this.token);
      setStorage(STORAGE_KEYS.user, this.userInfo);
      await this.ensureSeeded(true);
    },
    logout() {
      this.token = "";
      this.userInfo = null;
      // 收藏/地址是按账号缓存的，不清会导致换号登录后看到上个账号的数据
      this.favorites = [];
      this.addresses = [];
      this.personalLoaded = false;
      removeStorage(STORAGE_KEYS.token);
      removeStorage(STORAGE_KEYS.user);
      removeStorage(STORAGE_KEYS.favorite);
      removeStorage(STORAGE_KEYS.address);
    },
    async fetchUserInfo() {
      const res = await userApi.getUserInfo();
      this.userInfo = res.data;
      setStorage(STORAGE_KEYS.user, this.userInfo);
    },
    async updateProfile(patch: { nickname?: string; avatar?: string }) {
      const res = await userApi.updateUserInfo(patch);
      this.userInfo = res.data;
      setStorage(STORAGE_KEYS.user, this.userInfo);
      return res.data;
    },
    /**
     * 收藏开关：先落本地保证点击立即有反馈，再写服务端，失败回滚并抛错给页面提示。
     * 返回切换后是否为已收藏。
     */
    async toggleFavorite(item: FavoriteItem): Promise<boolean> {
      const idx = this.favorites.findIndex((f) => f.id === item.id);
      if (idx >= 0) {
        const [removed] = this.favorites.splice(idx, 1);
        this.persistFavorites();
        if (removed.rowId) {
          try {
            await userApi.removeFavorite(removed.rowId);
          } catch (e) {
            this.favorites.splice(idx, 0, removed);
            this.persistFavorites();
            throw e;
          }
        }
        return false;
      }

      this.favorites.unshift(item);
      this.persistFavorites();
      try {
        const res = await userApi.addFavorite({
          targetId: item.targetId ?? "",
          type: item.type,
          title: item.title,
          subtitle: item.subtitle,
          image: item.image,
        });
        const at = this.favorites.findIndex((f) => f.id === item.id);
        if (at >= 0) this.favorites.splice(at, 1, { ...item, rowId: res.data.rowId });
      } catch (e) {
        const at = this.favorites.findIndex((f) => f.id === item.id);
        if (at >= 0) this.favorites.splice(at, 1);
        this.persistFavorites();
        throw e;
      }
      this.persistFavorites();
      return true;
    },
    async removeFavorite(id: string) {
      const idx = this.favorites.findIndex((f) => f.id === id);
      if (idx < 0) return;
      const [removed] = this.favorites.splice(idx, 1);
      this.persistFavorites();
      if (!removed.rowId) return;
      try {
        await userApi.removeFavorite(removed.rowId);
      } catch (e) {
        this.favorites.splice(idx, 0, removed);
        this.persistFavorites();
        throw e;
      }
    },
    saveAddress(address: AddressItem) {
      const idx = this.addresses.findIndex((a) => a.id === address.id);
      if (idx >= 0) {
        this.addresses.splice(idx, 1, address);
      } else {
        this.addresses.push(address);
      }
      if (address.isDefault) {
        this.addresses.forEach((a) => {
          if (a.id !== address.id) a.isDefault = false;
        });
      }
      setStorage(STORAGE_KEYS.address, this.addresses);
    },
    removeAddress(id: string) {
      this.addresses = this.addresses.filter((a) => a.id !== id);
      setStorage(STORAGE_KEYS.address, this.addresses);
    },
    setDefaultAddress(id: string) {
      this.addresses.forEach((a) => {
        a.isDefault = a.id === id;
      });
      setStorage(STORAGE_KEYS.address, this.addresses);
    },
    /** 设置页「清除缓存」：只清易失数据，保留登录态 */
    clearCaches() {
      this.favorites = [];
      this.addresses = [];
      this.personalLoaded = false;
      removeStorage(STORAGE_KEYS.favorite);
      removeStorage(STORAGE_KEYS.address);
    },
  },
});
