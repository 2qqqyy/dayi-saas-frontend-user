/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * uni-app 构建时会把 process.env.UNI_PLATFORM 静态替换成字符串字面量
 * （见 @dcloudio/uni-cli-shared/dist/env/define.js），所以这里只补类型，
 * 不需要引入 @types/node。
 */
declare const process: {
  env: { UNI_PLATFORM?: string }
}
