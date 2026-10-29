import { defineStore } from "pinia";
import type { HomestayItem, MapCategory, PickingItem, ScenicItem, TravelRoute } from "@/types/business";
import { getScenicList, getTravelRoutes } from "@/api/travel";
import { getPickingList } from "@/api/picking";
import { getHomestayList } from "@/api/homestay";

interface TravelState {
  scenicList: ScenicItem[];
  routeList: TravelRoute[];
  pickingList: PickingItem[];
  homestayList: HomestayItem[];
  activeMapCategory: MapCategory;
  loaded: boolean;
}

export const useTravelStore = defineStore("travel", {
  state: (): TravelState => ({
    scenicList: [],
    routeList: [],
    pickingList: [],
    homestayList: [],
    activeMapCategory: "scenic",
    loaded: false,
  }),
  actions: {
    async fetchAll() {
      const [scenic, routes, picking, homestay] = await Promise.all([
        getScenicList(),
        getTravelRoutes(),
        getPickingList(),
        getHomestayList(),
      ]);
      this.scenicList = scenic.data;
      this.routeList = routes.data;
      this.pickingList = picking.data;
      this.homestayList = homestay.data;
      this.loaded = true;
    },
    setActiveMapCategory(category: MapCategory) {
      this.activeMapCategory = category;
    },
  },
});
