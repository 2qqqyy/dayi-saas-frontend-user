import type { ApiResponse, ProductItem, ProductReview } from "@/types/business";
import { get } from "@/utils/request";
import { mapProduct, toStr, type BackendPage, type BackendProductRow } from "@/utils/backend";

export interface ProductQuery {
  /** 分类 id 或分类名，内部统一转成 id 再请求 */
  category?: string | number;
  keyword?: string;
}

export interface CategoryNode {
  nameEn?: string;
  id: string;
  name: string;
  parentId: string;
  icon: string;
}

/**
 * 分类目录缓存：一次页面加载里 getTopCategories 与 getProductList 都会用到，缓存 Promise
 * 才能把并发请求合成一次。带 60s 过期，后台「分类管理」改了名字 C 端不必刷新整页。
 */
const CATEGORY_TTL = 60_000;
let categoryPromise: Promise<CategoryNode[]> | null = null;
let categoryCachedAt = 0;

function ensureCategories(force = false): Promise<CategoryNode[]> {
  if (categoryPromise && !force && Date.now() - categoryCachedAt <= CATEGORY_TTL) {
    return categoryPromise;
  }
  const next = get<
    ApiResponse<{ id: number; name: string; parentId?: number; icon?: string }[]>
  >("/product/categories")
    .then((res) =>
      res.data.map((c) => ({
        id: toStr(c.id),
        name: toStr(c.name),
        parentId: toStr(c.parentId ?? 0),
        icon: toStr(c.icon),
      })),
    )
    .catch((e) => {
      // 失败不能把 rejected promise 留在缓存里，否则之后所有分类相关调用永久失败
      if (categoryPromise === next) categoryPromise = null;
      throw e;
    });
  categoryPromise = next;
  categoryCachedAt = Date.now();
  return next;
}

/** 页面 onShow 时强制刷新分类目录（后台改了分类，回到页面即生效） */
export function refreshCategories(): Promise<CategoryNode[]> {
  return ensureCategories(true);
}

async function mapProductRow(row: BackendProductRow): Promise<ProductItem> {
  const cats = await ensureCategories();
  const hit = cats.find((c) => c.id === toStr(row.product.categoryId));
  return mapProduct(row, hit?.name);
}

/** 一级分类 */
export async function getTopCategories(): Promise<ApiResponse<CategoryNode[]>> {
  const cats = await ensureCategories();
  return { code: 200, message: "ok", data: cats.filter((c) => c.parentId === "0") };
}

/** 某个分类下的子分类 */
export async function getSubCategories(parentId: string | number): Promise<ApiResponse<CategoryNode[]>> {
  const cats = await ensureCategories();
  return { code: 200, message: "ok", data: cats.filter((c) => c.parentId === toStr(parentId)) };
}

/** 分类名 → id；传入的本来就是 id 或未匹配到时原样返回，由后端决定兜底 */
export async function resolveCategoryId(nameOrId: string): Promise<string> {
  if (/^\d+$/.test(nameOrId)) return nameOrId;
  const cats = await ensureCategories();
  return cats.find((c) => c.name === nameOrId)?.id ?? nameOrId;
}

export async function getProductList(params?: ProductQuery): Promise<ApiResponse<ProductItem[]>> {
  const raw = params?.category == null ? "" : toStr(params.category);
  const res = await get<ApiResponse<BackendPage<BackendProductRow>>>("/product", {
    params: {
      category: raw ? await resolveCategoryId(raw) : undefined,
      keyword: params?.keyword,
      page: 1,
      pageSize: 50,
    },
  });
  const list = await Promise.all(res.data.list.map(mapProductRow));
  return { code: 200, message: "ok", data: list };
}

const AVATAR_COLORS = ["#4F8F52", "#B07A3C", "#3C7FB1", "#8A5FA8", "#C05B5B"];

/** 后端 review 只有 score / content / createTime / userId，规格与「有用」数没有来源，留空由模板跳过 */
function mapReviews(rows: Record<string, unknown>[]): ProductReview[] {
  return rows.map((r, i) => ({
    id: String(r.id ?? ""),
    user: `买家 ${String(r.userId ?? "").padStart(4, "0")}`,
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    rating: Number(r.score ?? 0),
    date: String(r.createTime ?? "").slice(0, 10),
    spec: "",
    content: String(r.content ?? ""),
    tags: [],
    likes: 0,
  }));
}

export async function getProductDetail(id: string): Promise<ApiResponse<ProductItem>> {
  const [res, reviewRes] = await Promise.all([
    get<ApiResponse<BackendProductRow>>(`/product/${encodeURIComponent(id)}`),
    get<ApiResponse<BackendPage<Record<string, unknown>>>>(
      `/product/${encodeURIComponent(id)}/reviews`,
      { params: { page: 1, pageSize: 10 } },
    ).catch(() => null),
  ]);
  const item = await mapProductRow(res.data);
  const page = reviewRes?.data;
  const reviews = mapReviews(page?.list ?? []);
  const good = reviews.filter((r) => r.rating >= 4).length;
  return {
    code: 200,
    message: "ok",
    data: {
      ...item,
      reviews,
      reviewCount: Number(page?.total ?? reviews.length),
      goodRate: reviews.length ? `${Math.round((good / reviews.length) * 100)}%` : "—",
    },
  };
}
