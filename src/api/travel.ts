import type {
  ApiResponse,
  GuideData,
  MapCategory,
  ScenicItem,
  TravelRoute,
} from "@/types/business";
import { get } from "@/utils/request";

export interface MapMarker {
  id: string;
  category: MapCategory;
  name: string;
  image: string;
  distance: string;
  summary: string;
  open: boolean;
  bookable: boolean;
  location: { lat: number; lng: number };
}

export function getScenicList(): Promise<ApiResponse<ScenicItem[]>> {
  return get<ApiResponse<ScenicItem[]>>("/travel/scenic");
}

export function getScenicDetail(id: string): Promise<ApiResponse<ScenicItem>> {
  return get<ApiResponse<ScenicItem>>(`/travel/scenic/${encodeURIComponent(id)}`);
}

export function getTravelRoutes(): Promise<ApiResponse<TravelRoute[]>> {
  return get<ApiResponse<TravelRoute[]>>("/travel/routes");
}

export function getTravelRouteDetail(id: string): Promise<ApiResponse<TravelRoute>> {
  return get<ApiResponse<TravelRoute>>(`/travel/routes/${encodeURIComponent(id)}`);
}

/** 山野导览图全量数据：点位分布 + 路线折线 + 公共设施 + 分类文案 */
export function getGuideData(): Promise<ApiResponse<GuideData>> {
  return get<ApiResponse<GuideData>>("/travel/guide");
}

/**
 * 地图点位按分类查询。
 * 点位数据统一以导览图数据为准，保证地图、分类筛选与导览图三者一致。
 */
export function getMapMarkers(category?: MapCategory): Promise<ApiResponse<MapMarker[]>> {
  return get<ApiResponse<MapMarker[]>>("/travel/map-markers", {
    params: category ? { category } : undefined,
  });
}
