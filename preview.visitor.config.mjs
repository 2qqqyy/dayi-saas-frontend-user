export default {
  root: "./dist/build/h5",
  build: { outDir: "." },
  preview: {
    host: "0.0.0.0",
    port: 5176,
    strictPort: true,
    cors: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8081", changeOrigin: true },
      "/uploads": { target: "http://127.0.0.1:8081", changeOrigin: true },
      "/static/images": { target: "http://127.0.0.1:8081", changeOrigin: true },
    },
  },
};
