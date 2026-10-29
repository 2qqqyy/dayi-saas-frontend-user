import { defineStore } from "pinia";
import { APP_CITY } from "@/utils/constants";

interface AppState {
  city: string;
  safeAreaTop: number;
  safeAreaBottom: number;
  loading: boolean;
}

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    city: APP_CITY,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    loading: false,
  }),
  actions: {
    setSafeArea(top: number, bottom: number) {
      this.safeAreaTop = top;
      this.safeAreaBottom = bottom;
    },
    setLoading(value: boolean) {
      this.loading = value;
    },
  },
});
