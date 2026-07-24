# ecommerce-web

React + Vite frontend cho quản lý bán khóa học và học sinh.

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

Web: http://localhost:5173

## Deploy Render (Static Site)

1. New → Static Site → connect repo `ecommerce-web`
2. Build: `npm install && npm run build`
3. Publish directory: `dist`
4. Env vars:
   - `VITE_API_URL` = URL API Render, ví dụ `https://ecommerce-api.onrender.com`

Sau khi có URL web, cập nhật `CORS_ORIGIN` bên `ecommerce-api` cho khớp.
