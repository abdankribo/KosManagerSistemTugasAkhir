# Kos Manager — Next.js

Aplikasi manajemen kos yang dimigrasikan dari Laravel/Inertia ke Next.js + React + Prisma + MySQL.

## Fitur
- Login dengan JWT session pada cookie HttpOnly.
- Dashboard statistik.
- CRUD Users, Kamar, Penyewa, Penginapan, Tagihan, Invoice, dan Pembayaran.
- Form edit dan soft delete.
- Validasi NIK, telepon, fasilitas, nominal, dan bentrok periode kamar.
- Dropdown relasi untuk penginapan, tagihan, invoice, dan pembayaran.
- Pencarian pada modul yang mendukung pencarian.
- Responsive UI desktop dan mobile.

## Menjalankan
1. `npm install`
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `DATABASE_URL` dengan database MySQL.
4. Isi `AUTH_SECRET` dengan secret acak panjang, minimal 32 karakter.
5. `npx prisma generate`
6. `npm run dev`
7. Buka `http://localhost:3000`.

## Database lama
Arahkan `DATABASE_URL` ke database MySQL lama setelah melakukan backup. Jangan menjalankan `prisma db push` pada database produksi. Bila perlu menyelaraskan schema Prisma dengan database yang sudah ada, gunakan `npx prisma db pull` setelah struktur database diverifikasi.

## Deployment Vercel
- Framework: Next.js
- Build Command: `npm run build`
- Environment Variables: `DATABASE_URL`, `AUTH_SECRET`
- Node.js: gunakan versi yang didukung project/Vercel.

## Informasi Login

Aplikasi memiliki tiga jenis akun. Credential login tidak disimpan langsung di repository. Username dan password akun demo ditentukan melalui environment variable seed agar credential produksi tidak terekspos di GitHub.

| Role | Username | Password |
|---|---|---|
| Admin / Pemilik Kos | nilai `SEED_ADMIN_USERNAME` | nilai `SEED_ADMIN_PASSWORD` |
| User / Karyawan | nilai `SEED_USER_USERNAME` | nilai `SEED_USER_PASSWORD` |
| Penyewa / Tenant | nilai `SEED_TENANT_USERNAME` | nilai `SEED_TENANT_PASSWORD` |

### Catatan login
- Akun Admin digunakan untuk pengelolaan penuh data kos.
- Akun User/Karyawan digunakan untuk operasional kos, termasuk melihat kamar, penyewa, tagihan, dan memeriksa bukti pembayaran sesuai hak aksesnya.
- Akun Tenant digunakan untuk portal penyewa dan hanya dapat mengakses data yang terkait dengan penyewa tersebut.
- Variabel `SEED_TENANT_USERNAME` dan `SEED_TENANT_PASSWORD` bersifat opsional. Akun tenant hanya dibuat ketika kedua variabel tersebut diisi.
- Untuk environment production, jangan menuliskan password asli di README atau source code. Simpan credential melalui Environment Variables/secret manager.

## Catatan
Build dan koneksi MySQL perlu diverifikasi pada environment yang memiliki akses dependency install dan database sebenarnya; repository ini tidak menyimpan credential database.


## Role aplikasi

KosManager sekarang memiliki tiga jenis akun:

- **Admin / Pemilik Kos** — mengelola kamar, harga, pengguna, penyewa, tagihan, invoice, dan seluruh transaksi.
- **User / Karyawan** — mengelola operasional kos dan memverifikasi bukti pembayaran penyewa.
- **Penyewa / Tenant** — menggunakan portal sederhana untuk melihat kamar/tagihan miliknya, memilih tagihan, menentukan tanggal pembayaran, dan mengunggah foto bukti pembayaran.

### Alur pembayaran

1. Admin atau karyawan menyiapkan kamar, penyewa, penginapan, tagihan, dan invoice.
2. Penyewa masuk ke Portal Penyewa.
3. Penyewa memilih tagihan/kamar yang tersedia.
4. Nominal pembayaran diambil otomatis dari tagihan dan tidak dapat diubah oleh penyewa.
5. Penyewa memilih tanggal pembayaran dan mengunggah foto bukti pembayaran.
6. Pembayaran masuk dengan status **Menunggu Verifikasi**.
7. Admin atau karyawan memeriksa bukti pembayaran.
8. Pembayaran dapat diterima atau ditolak. Penyewa dapat melihat statusnya dari portal.

Akun tenant harus dihubungkan ke data penyewa agar tenant hanya dapat melihat tagihan dan pembayaran miliknya sendiri.
