const KEY = "qm-footprint";

export interface FootprintItem {
  type: "scenic" | "product";
  id: string;
  name: string;
  nameEn?: string;
  image: string;
  time: number;
}

export function readFootprint(): FootprintItem[] {
  try {
    const raw = uni.getStorageSync(KEY);
    return raw ? (JSON.parse(raw) as FootprintItem[]) : [];
  } catch {
    return [];
  }
}

/** 详情页浏览留痕：同一条目去重后置顶，最多保留 60 条 */
export function pushFootprint(item: Omit<FootprintItem, "time">) {
  if (!item.id) return;
  const list = readFootprint().filter((x) => !(x.type === item.type && x.id === item.id));
  list.unshift({ ...item, time: Date.now() });
  uni.setStorageSync(KEY, JSON.stringify(list.slice(0, 60)));
}

export function clearFootprint() {
  uni.removeStorageSync(KEY);
}
