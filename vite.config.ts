import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages project site: https://MinhMarino.github.io/ecommerce-web/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/ecommerce-web/",
});
