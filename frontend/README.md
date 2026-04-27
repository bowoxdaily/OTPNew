# Frontend (React + Vite)

## Jalankan Lokal

1. Install dependency:

```bash
npm install
```

2. Jalankan development server:

```bash
npm run dev
```

Mode development memakai proxy Vite untuk path `/api` ke backend yang ada di `vite.config.js`.

## Build Production

1. Buat file `.env.production` dari contoh:

```bash
cp .env.production.example .env.production
```

2. Isi domain API production di `.env.production`:

```env
VITE_API_BASE_URL=https://api.domainkamu.com
```

3. Build:

```bash
npm run build
```

Hasil build ada di folder `dist/`.

## Deploy ke aaPanel

1. Add Site di aaPanel (Nginx static site).
2. Upload isi `dist/` ke root domain web.
3. Tambahkan rewrite SPA di Nginx:

```nginx
location / {
	try_files $uri $uri/ /index.html;
}
```

4. Reload Nginx.
5. Aktifkan SSL di aaPanel (Let's Encrypt).
