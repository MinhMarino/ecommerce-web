# ecommerce-web

React + Vite frontend — host bằng **GitHub Pages**.

## URL

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

Rồi re-run workflow **Deploy GitHub Pages**.

## Deploy

Push lên `main` sẽ tự build & publish Pages (GitHub Actions).
