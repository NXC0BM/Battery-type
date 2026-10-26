import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // порт 3000 занят веб-сервисом NestJS, поэтому фронтенд на 3001
    port: 3001,
    host: true,
  },
});
