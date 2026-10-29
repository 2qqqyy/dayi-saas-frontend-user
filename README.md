# 青梅里 · 用户端 H5 商城（frontend-user）

青梅里乡村文旅 SaaS 平台的 **C 端商城**，面向游客：青梅商品与农产品浏览、民宿预订、景点门票、游玩路线导览、购物车与下单支付、个人中心与消息。

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 框架 | uni-app + Vue 3（`<script setup>` + TypeScript） |
| 构建 | Vite |
| 状态管理 | Pinia |
| 网络 | axios（统一封装在 `src/api/`） |
| 目标端 | H5（可编译小程序端） |

## 目录结构

```
.
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src
    ├── api/           # 接口封装：home / product / cart / order / payment /
    │                  # homestay / ticket / travel / guide / notice / user / ai ...（17 个模块）
    ├── components/    # 通用组件：NavBar / AppTabBar / 各类业务卡片与弹层（20 个）
    ├── composables/   # 组合式函数
    ├── pages/         # 页面（43 个）
    ├── stores/        # Pinia 状态（5 个 store）
    ├── types/         # TypeScript 类型定义
    ├── utils/         # 请求封装、工具函数（13 个）
    ├── static/        # 静态资源
    ├── pages.json     # uni-app 页面路由配置
    ├── manifest.json  # uni-app 应用配置
    ├── uni.scss       # 全局样式变量
    ├── App.vue
    └── main.ts
```

## 本地运行

```bash
npm install
npm run dev:h5       # 开发（H5）
npm run build:h5     # 生产构建，产物在 dist/build/h5
```

开发环境通过 Vite 代理把 `/api` 转发到后端 **http://localhost:8081**。

## 后端

对应后端仓库：[dayi-saas-backed-admin](https://github.com/2qqqyy/dayi-saas-backed-admin)（Spring Boot 3，默认端口 8081）。

## 相关仓库

- 商家端 H5：[dayi-saas-frontend-merchan-h5](https://github.com/2qqqyy/dayi-saas-frontend-merchan-h5)
- 管理后台 PC：[dayi-saas-frontend-admin](https://github.com/2qqqyy/dayi-saas-frontend-admin)
