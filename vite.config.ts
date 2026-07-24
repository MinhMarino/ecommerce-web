import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site: https://MinhMarino.github.io/ecommerce-web/
export default defineConfig({
  plugins: [react()],
  base: "/ecommerce-web/",
});
