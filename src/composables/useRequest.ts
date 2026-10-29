import { ref, type Ref } from "vue";

/**
 * 通用异步请求状态封装：统一管理 loading / error / data。
 * 页面列表据此渲染 Skeleton、错误重试与空状态。
 */
export function useRequest<T>(fetcher: () => Promise<T>) {
  const loading = ref(false);
  const error = ref("");
  const data = ref(null) as Ref<T | null>;

  async function run() {
    loading.value = true;
    error.value = "";
    try {
      data.value = await fetcher();
    } catch (e) {
      // 打印原始异常，便于开发期定位问题，同时对外保留友好的提示文案
      console.error("[useRequest]", e);
      error.value = "加载失败，请稍后重试";
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, data, run };
}
