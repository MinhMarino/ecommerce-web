# ecommerce-web

React + Vite frontend — đang host bằng **GitHub Pages**.

## Live URL

https://minhmarino.github.io/ecommerce-web/

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

## API URL

Sau khi API lên Render, set GitHub repo variable:

- Name: `VITE_API_URL`
- Value: `https://your-api.onrender.com`

Rồi push lại `main` (hoặc chạy workflow **Deploy GitHub Pages**).

## Auto deploy

Đã bật GitHub Actions: mỗi lần push `main` sẽ tự:

1. `npm ci` + `npm run build`
2. Publish artifact lên nhánh `gh-pages`
3. GitHub Pages serve tại URL ở trên

Workflow: `.github/workflows/deploy-pages.yml`
