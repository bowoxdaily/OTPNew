// vite.config.js
import { defineConfig, loadEnv } from "file:///D:/projectt/OTPserivce/otp-reseller/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/projectt/OTPserivce/otp-reseller/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import fs from "fs/promises";
import svgr from "file:///D:/projectt/OTPserivce/otp-reseller/frontend/node_modules/@svgr/rollup/dist/index.js";
var __vite_injected_original_dirname = "D:\\projectt\\OTPserivce\\otp-reseller\\frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || "https://api.bitnexid.com";
  return {
    resolve: {
      alias: {
        src: resolve(__vite_injected_original_dirname, "src")
      }
    },
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: "load-js-files-as-jsx",
            setup(build) {
              build.onLoad(
                { filter: /src\\.*\.js$/ },
                async (args) => ({
                  loader: "jsx",
                  contents: await fs.readFile(args.path, "utf8")
                })
              );
            }
          }
        ]
      }
    },
    // plugins: [react(),svgr({
    //   exportAsDefault: true
    // })],
    plugins: [svgr(), react()],
    base: "/",
    server: {
      proxy: {
        "/api": {
          target: devProxyTarget,
          changeOrigin: true
        },
        "/uploads": {
          target: devProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9qZWN0dFxcXFxPVFBzZXJpdmNlXFxcXG90cC1yZXNlbGxlclxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHJvamVjdHRcXFxcT1RQc2VyaXZjZVxcXFxvdHAtcmVzZWxsZXJcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3Byb2plY3R0L09UUHNlcml2Y2Uvb3RwLXJlc2VsbGVyL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzL3Byb21pc2VzJztcclxuaW1wb3J0IHN2Z3IgZnJvbSAnQHN2Z3Ivcm9sbHVwJztcclxuLy8gaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3ZncidcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICAgIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xyXG4gICAgY29uc3QgZGV2UHJveHlUYXJnZXQgPSBlbnYuVklURV9ERVZfUFJPWFlfVEFSR0VUIHx8ICdodHRwczovL2FwaS5iaXRuZXhpZC5jb20nO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgICBhbGlhczoge1xyXG4gICAgICAgICAgICAgICAgc3JjOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXNidWlsZDoge1xyXG4gICAgICAgICAgICBsb2FkZXI6ICdqc3gnLFxyXG4gICAgICAgICAgICBpbmNsdWRlOiAvc3JjXFwvLipcXC5qc3g/JC8sXHJcbiAgICAgICAgICAgIGV4Y2x1ZGU6IFtdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgICAgICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbG9hZC1qcy1maWxlcy1hcy1qc3gnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR1cChidWlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVpbGQub25Mb2FkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZmlsdGVyOiAvc3JjXFxcXC4qXFwuanMkLyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jIChhcmdzKSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZXI6ICdqc3gnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50czogYXdhaXQgZnMucmVhZEZpbGUoYXJncy5wYXRoLCAndXRmOCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcblxyXG5cclxuXHJcbiAgICAgICAgLy8gcGx1Z2luczogW3JlYWN0KCksc3Zncih7XHJcbiAgICAgICAgLy8gICBleHBvcnRBc0RlZmF1bHQ6IHRydWVcclxuICAgICAgICAvLyB9KV0sXHJcblxyXG4gICAgICAgIHBsdWdpbnM6IFtzdmdyKCksIHJlYWN0KCldLFxyXG4gICAgICAgIGJhc2U6ICcvJyxcclxuICAgICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAgICAgcHJveHk6IHtcclxuICAgICAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogZGV2UHJveHlUYXJnZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICcvdXBsb2Fkcyc6IHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IGRldlByb3h5VGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdVLFNBQVMsY0FBYyxlQUFlO0FBQ3RXLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3RDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLGlCQUFpQixJQUFJLHlCQUF5QjtBQUVwRCxTQUFPO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDTCxPQUFPO0FBQUEsUUFDSCxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ2pDO0FBQUEsSUFDSjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLE1BQ1QsU0FBUyxDQUFDO0FBQUEsSUFDZDtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1YsZ0JBQWdCO0FBQUEsUUFDWixTQUFTO0FBQUEsVUFDTDtBQUFBLFlBQ0ksTUFBTTtBQUFBLFlBQ04sTUFBTSxPQUFPO0FBQ1Qsb0JBQU07QUFBQSxnQkFDRixFQUFFLFFBQVEsZUFBZTtBQUFBLGdCQUN6QixPQUFPLFVBQVU7QUFBQSxrQkFDYixRQUFRO0FBQUEsa0JBQ1IsVUFBVSxNQUFNLEdBQUcsU0FBUyxLQUFLLE1BQU0sTUFBTTtBQUFBLGdCQUNqRDtBQUFBLGNBQ0o7QUFBQSxZQUNKO0FBQUEsVUFDSjtBQUFBLFFBQ0o7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBO0FBQUE7QUFBQTtBQUFBLElBUUEsU0FBUyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFBQSxJQUN6QixNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDSixPQUFPO0FBQUEsUUFDSCxRQUFRO0FBQUEsVUFDSixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsUUFDbEI7QUFBQSxRQUNBLFlBQVk7QUFBQSxVQUNSLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxRQUNsQjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
