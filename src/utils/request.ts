import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage } from "@/utils/storage";

/**
 * 接口基地址。
 * - H5：走 vite 代理（/api 与 /uploads → 后端 8080，见 vite.config.ts），相对路径即可；
 * - 小程序：没有 dev server 代理这一层，必须绝对地址。开发者工具与后端同机时用 127.0.0.1，
 *   真机预览要换成电脑的局域网 IP；
 * - 打包部署时若前后端不同源，构建前设置 VITE_API_BASE_URL 覆盖即可。
 */
/**
 * 小程序要访问的后端地址。真机预览必须写电脑的局域网 IP —— 手机上的 127.0.0.1 是手机自己。
 * 开发者工具在本机时用 127.0.0.1 或局域网 IP 都可以。换网段只改这一处。
 * 默认取 127.0.0.1：开发者工具与后端同机时开箱可用，不会因换了网络而静默指向失效 IP。
 *
 * 真机小程序不加载 http 明文图片（模拟器是 Chromium 所以看不出来）。要走 https 隧道演示时，
 * 构建前设 VITE_MP_SERVER 即可，不用改源码：VITE_MP_SERVER=https://xxx.trycloudflare.com npm run dev:mp-weixin
 */
const MP_SERVER = import.meta.env.VITE_MP_SERVER || "http://127.0.0.1:8080";
const MP_API_BASE = MP_SERVER + "/api";

/**
 * 小程序逻辑层没有 XMLHttpRequest，axios 内置的 xhr / fetch 适配器全都不可用。
 * 必须用编译期常量判断：开发者工具的模拟器里 XMLHttpRequest 是存在的，
 * 用运行时特性探测会误判成 H5，导致适配器不挂载、所有请求发不出去。
 * 取不到常量时按 H5 处理，保证 H5 行为不受影响。
 */
const isMiniProgram = (process.env.UNI_PLATFORM || "h5") !== "h5";

const baseURL = import.meta.env.VITE_API_BASE_URL || (isMiniProgram ? MP_API_BASE : "/api");

/** 给 uni.uploadFile 这类不走 axios 的调用拼接口地址 */
export function apiPath(path: string): string {
  return baseURL + path;
}

/**
 * 小程序包内不再携带 src/static/images —— 配图改由后端 WebMvcConfig 的
 * /static/images/** 提供，否则主包 14M 远超 2M 上限。响应里出现的相对图片路径
 * 在这里统一补成绝对地址。真机预览时同样要换成电脑的局域网 IP。
 */
const MP_STATIC_ORIGIN = MP_SERVER;

/** 整串都是 /static/ 路径才改写；含逗号的正文文案不满足条件，不会被误伤 */
function toAbsoluteStatic(value: string): string | null {
  const parts = value.split(",").map((p) => p.trim());
  if (!parts.length || !parts.every((p) => p.startsWith("/static/"))) return null;
  return parts.map((p) => MP_STATIC_ORIGIN + p).join(",");
}

function absolutizeStatic(value: unknown): unknown {
  if (typeof value === "string") return toAbsoluteStatic(value) ?? value;
  if (Array.isArray(value)) return value.map(absolutizeStatic);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      out[k] = absolutizeStatic(v);
    });
    return out;
  }
  return value;
}

/** 给源码里硬编码的 /static/… 资源路径用（小程序下补成后端绝对地址） */
export function assetUrl(path: string): string {
  if (!isMiniProgram) return path;
  return toAbsoluteStatic(path) ?? path;
}

type UniMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const parts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    (Array.isArray(value) ? value : [value]).forEach((item) => {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    });
  });
  return parts.join("&");
}

function toHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
  const raw = (config.headers?.toJSON?.() ?? config.headers ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (value !== undefined && value !== null) out[key] = String(value);
  });
  return out;
}

const uniAdapter: AxiosAdapter = (config) =>
  new Promise<AxiosResponse>((resolve, reject) => {
    const raw = config.url || "";
    const full = /^https?:\/\//i.test(raw) ? raw : (config.baseURL || "") + raw;
    const query = toQuery(config.params as Record<string, unknown> | undefined);
    uni.request({
      url: query ? `${full}${full.includes("?") ? "&" : "?"}${query}` : full,
      method: (config.method || "GET").toUpperCase() as UniMethod,
      data: config.data,
      header: toHeaders(config),
      timeout: config.timeout,
      dataType: "json",
      success: (res) => {
        const response = {
          data: res.data,
          status: res.statusCode,
          statusText: String(res.statusCode),
          headers: res.header,
          config,
          request: null,
        } as unknown as AxiosResponse;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(response);
          return;
        }
        const code =
          res.statusCode >= 400 && res.statusCode < 500
            ? AxiosError.ERR_BAD_REQUEST
            : AxiosError.ERR_BAD_RESPONSE;
        reject(new AxiosError(`Request failed with status code ${res.statusCode}`, code, config, null, response));
      },
      fail: (err) =>
        reject(new AxiosError(err.errMsg || "Network Error", AxiosError.ERR_NETWORK, config, null)),
    });
  });

const service = axios.create({
  baseURL,
  timeout: 12000,
  ...(isMiniProgram ? { adapter: uniAdapter } : {}),
});

service.interceptors.request.use((config) => {
  const token = getStorage<string>(STORAGE_KEYS.token, "");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * token 失效（过期/被后台踢下线）时清空整个会话再回登录页。
 * 除了 storage，还要 $reset 掉 Pinia 内存态：reLaunch 是 SPA 跳转不会重建 store，
 * 只清 storage 会让页面继续按「已登录」渲染，接着发一串 401。
 * 动态 import 是为了打破 request ↔ stores 的循环依赖。
 */
async function resetSession() {
  Object.values(STORAGE_KEYS).forEach((key) => uni.removeStorageSync(key));
  const [{ useUserStore }, { useCartStore }, { useOrderStore }] = await Promise.all([
    import("@/stores/user"),
    import("@/stores/cart"),
    import("@/stores/order"),
  ]);
  useUserStore().$reset();
  useCartStore().$reset();
  useOrderStore().$reset();
  uni.reLaunch({ url: "/pages/user/login" });
}

service.interceptors.response.use(
  (response) => {
    let body = response.data;
    if (isMiniProgram) body = absolutizeStatic(body);
    // 后端统一返回 { code, msg, data }，业务层统一按 { code, message, data } 消费
    if (body && typeof body === "object" && "msg" in body && !("message" in body)) {
      body.message = body.msg;
    }
    // 业务失败（非 200 code）统一拦截提示，避免每个页面重复处理
    if (body && typeof body === "object" && typeof body.code === "number" && body.code !== 200) {
      if (body.code === 401) {
        resetSession();
      }
      uni.showToast({
        title: body.message || "请求失败",
        icon: "none",
      });
      return Promise.reject(new Error(body.message || "请求失败"));
    }
    return body;
  },
  (error) => {
    if (error.response?.status === 401) {
      resetSession();
      return Promise.reject(error);
    }

    uni.showToast({
      title: error.response ? "请求失败，请稍后重试" : "网络异常，请检查网络连接",
      icon: "none",
    });
    return Promise.reject(error);
  },
);

/**
 * 响应拦截器里已经把 axios 的 response 解包成服务端的 { code, message, data }，
 * 所以这里把返回类型直接标成 T（业务数据体），避免每个调用点都去断言 AxiosResponse。
 */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as unknown as Promise<T>;
}

export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: "GET" });
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: "POST", data });
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: "PUT", data });
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, url, method: "DELETE" });
}

export default service;
