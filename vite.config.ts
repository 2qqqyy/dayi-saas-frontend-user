import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    // 允许手机通过局域网访问
    host: '0.0.0.0',

    port: 5176,

    // 开发环境允许跨域
    cors: true,

    // 数据接口：转发给后端 Spring Boot 服务（qingmeili-backend，端口 8081）
    // 上传件：后端 WebMvcConfig 把 /uploads/** 映射到磁盘目录，接口返回的也是该相对路径，
    // 不代理会被 dev server 当作前端路由回退成 index.html，图片静默不渲染。
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      // 配图已从 src/static/images 移出（小程序主包限 2M），统一由后端提供。
      // 只代理 /static/images，不代理整个 /static，否则包内的 logo.png 会被打到后端 404。
      '/static/images': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      // 景点语音讲解 mp3 与配图同源，dev 下同样要转给后端
      '/static/audio': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
});
