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

## Deploy ke Apache / aaPanel

1. Upload isi `dist/` ke document root domain frontend.
2. Pastikan `mod_rewrite` aktif.
3. File `.htaccess` dari `public/` akan ikut masuk ke `dist/` dan menangani fallback SPA.
4. Jika frontend dan backend ada di domain berbeda, konfigurasi proxy `/api` di VirtualHost Apache agar browser tetap same-origin.
5. Pastikan `.env.production` frontend memakai `VITE_API_BASE_URL=/api`.
6. Restart / reload Apache.
7. Aktifkan SSL di aaPanel bila diperlukan.

Contoh VirtualHost Apache:

```apache
<VirtualHost *:443>
	ServerName otp.bowo-store.id

	SSLEngine on
	# konfigurasi sertifikat SSL di sini

	ProxyPreserveHost On
	ProxyRequests Off
	ProxyPass /api/ https://otpv1.bowo-store.id/api/
	ProxyPassReverse /api/ https://otpv1.bowo-store.id/api/

	DocumentRoot /www/wwwroot/otp.bowo-store.id
	<Directory /www/wwwroot/otp.bowo-store.id>
		AllowOverride All
		Require all granted
	</Directory>
</VirtualHost>
```
