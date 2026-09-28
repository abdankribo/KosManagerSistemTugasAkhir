# KosManager — Sistem Manajemen Kos Berbasis Next.js

KosManager adalah aplikasi manajemen rumah kos yang digunakan untuk mengelola data kamar, penyewa, penginapan, tagihan, invoice, pembayaran, serta akun pengguna berdasarkan hak akses masing-masing.

Aplikasi ini merupakan pengembangan/migrasi dari sistem sebelumnya berbasis Laravel/Inertia menjadi aplikasi berbasis **Next.js + React + Prisma + MySQL**. Sistem dirancang agar proses administrasi kos yang sebelumnya dilakukan secara manual dapat dikelola dalam satu aplikasi.

---

## 1. Gambaran Umum Sistem

Secara sederhana, KosManager menghubungkan seluruh proses operasional kos dalam satu alur:

```text
                         KOS MANAGER
                              │
              ┌───────────────┼───────────────┐
              │               │               │
          PEMILIK          KARYAWAN        PENYEWA
          / ADMIN           / STAFF         / TENANT
              │               │               │
              └───────────────┼───────────────┘
                              │
                         DATA KOS
                              │
        ┌─────────────┬───────┼────────┬──────────────┐
        │             │       │        │              │
      KAMAR        PENYEWA  PENGINAPAN TAGIHAN      PEMBAYARAN
        │             │       │        │              │
        └─────────────┴───────┴────────┴───────┬──────┘
                                               │
                                            INVOICE
                                               │
                                            PAYMENT
                                               │
                                      VERIFIKASI ADMIN/STAFF
```

Tujuan utama sistem adalah menyediakan alur data yang jelas dari pengelolaan kamar sampai pembayaran penyewa.

---

## 2. Tujuan Sistem

KosManager dibuat untuk membantu pengelola kos:

- mengelola data kamar dan harga sewa;
- mengetahui kamar yang sedang kosong atau ditempati;
- mencatat identitas penyewa;
- menghubungkan penyewa dengan kamar melalui data penginapan;
- membuat dan mengelola tagihan;
- membuat invoice berdasarkan tagihan;
- menerima pengajuan pembayaran dari penyewa;
- menerima bukti pembayaran;
- melakukan verifikasi pembayaran;
- membedakan akses Pemilik, Karyawan, dan Penyewa;
- menjaga agar penyewa hanya dapat mengakses data miliknya;
- mengurangi pencatatan administrasi secara manual.

---

# 3. Role dan Hak Akses

KosManager memiliki tiga jenis pengguna utama.

## 3.1 Pemilik Kos / Admin

Pemilik Kos merupakan pengguna dengan hak akses administrasi paling luas.

### Fungsi utama

Pemilik dapat digunakan untuk:

- melihat dashboard dan statistik kos;
- mengelola data pengguna;
- mengelola akun dan role pengguna;
- mengelola data kamar;
- menentukan nomor kamar;
- menentukan ukuran kamar;
- mencatat fasilitas kamar;
- menentukan harga sewa per bulan;
- mengelola data penyewa;
- mencatat identitas penyewa;
- mengatur data penginapan;
- menghubungkan penyewa dengan kamar;
- menentukan periode tinggal;
- mengelola tagihan;
- mengelola invoice;
- melihat data pembayaran;
- melakukan atau mengawasi verifikasi pembayaran;
- memantau kondisi operasional kos.

### Data yang dikelola

```text
PEMILIK / ADMIN
      │
      ├── Pengguna
      ├── Kamar
      ├── Penyewa
      ├── Penginapan
      ├── Tagihan
      ├── Invoice
      └── Pembayaran
```

Admin berfungsi sebagai pusat pengelolaan data dan administrasi sistem.

---

## 3.2 Karyawan Kos / Staff

Karyawan digunakan untuk membantu Pemilik menjalankan operasional harian.

### Fungsi utama

Karyawan dapat digunakan untuk:

- melihat informasi operasional kos;
- membantu pengelolaan data yang diberikan oleh sistem;
- melihat data kamar dan penyewa sesuai hak akses;
- membantu pengelolaan tagihan/invoice;
- memeriksa pembayaran yang diajukan penyewa;
- memeriksa bukti pembayaran;
- melakukan verifikasi pembayaran sesuai hak akses;
- membantu memantau status pembayaran.

### Fokus role

Jika Pemilik berfokus pada administrasi dan pengelolaan keseluruhan sistem, Karyawan lebih berfokus pada operasional sehari-hari.

```text
PEMILIK
   │
   ├── Pengelolaan keseluruhan
   │
   └──────────────┐
                  ↓
              KARYAWAN
                  │
                  ├── Operasional kos
                  ├── Data penyewa
                  ├── Tagihan
                  └── Verifikasi pembayaran
```

Hak akses Karyawan tetap dibatasi oleh role sehingga tidak otomatis memiliki seluruh kewenangan Pemilik.

---

## 3.3 Penyewa / Tenant

Penyewa merupakan pengguna yang menggunakan sistem dari sisi penghuni kos.

Penyewa tidak mengelola data seluruh kos. Data yang ditampilkan harus berhubungan dengan akun dan data penyewa tersebut.

### Fungsi utama

Penyewa dapat:

- login ke portal penyewa;
- melihat informasi kamar miliknya;
- melihat tagihan miliknya;
- melihat invoice yang berkaitan dengan tagihan;
- memilih tagihan yang akan dibayar;
- melihat nominal pembayaran;
- menentukan tanggal pembayaran;
- mengunggah bukti pembayaran;
- melihat status pembayaran;
- mengetahui apakah pembayaran masih menunggu verifikasi, diterima, atau ditolak.

### Batasan data

Konsep akses tenant:

```text
AKUN TENANT
     │
     ↓
DATA PENYEWA
     │
     ↓
PENGINAPAN
     │
     ↓
KAMAR
     │
     ↓
TAGIHAN
     │
     ↓
INVOICE
     │
     ↓
PEMBAYARAN
```

Dengan demikian, tenant tidak seharusnya dapat membuka data pembayaran atau tagihan milik tenant lain.

---

# 4. Struktur Data Sistem

Data utama sistem terdiri dari beberapa bagian.

## 4.1 Account

Account merupakan kelompok/akun utama yang menaungi pengguna.

Hubungannya:

```text
Account
   │
   └── Users
          ├── Admin
          ├── Staff
          └── Tenant
```

---

## 4.2 User

User adalah akun yang digunakan untuk login ke sistem.

Data user antara lain:

- nama depan;
- nama belakang;
- email;
- password;
- role;
- status owner;
- hubungan ke data penyewa jika akun tersebut merupakan tenant.

Role utama:

- Owner/Admin;
- Staff;
- Tenant.

---

## 4.3 Room / Kamar

Room menyimpan informasi fisik dan harga kamar.

Data kamar meliputi:

- nomor kamar;
- panjang;
- lebar;
- fasilitas;
- harga sewa per bulan;
- waktu pembuatan dan pembaruan;
- status penghapusan melalui soft delete.

Contoh:

```text
Kamar 102
├── Ukuran
├── Fasilitas
├── Harga / bulan
└── Status penghuni
```

Informasi kamar menjadi dasar untuk mengetahui biaya sewa dan kondisi hunian.

---

## 4.4 Renter / Penyewa

Renter menyimpan identitas penghuni kos.

Data yang tersedia:

- NIK;
- nama;
- jenis kelamin;
- nomor telepon;
- alamat.

Data ini digunakan sebagai identitas penyewa yang kemudian dapat dihubungkan dengan akun tenant.

---

## 4.5 Lodging / Penginapan

Lodging menghubungkan:

```text
PENYEWA
   │
   └────── PENGINAPAN ────── KAMAR
```

Data penginapan mencatat:

- penyewa;
- kamar;
- tanggal mulai tinggal;
- tanggal selesai tinggal;
- waktu pembuatan/perubahan.

Data ini penting untuk mengetahui siapa yang menempati kamar tertentu dalam periode tertentu.

Sistem juga melakukan validasi agar periode penginapan tidak saling bertabrakan untuk kamar yang sama.

---

## 4.6 Bill / Tagihan

Bill merupakan tagihan yang berkaitan dengan penginapan.

Data tagihan meliputi:

- nama tagihan;
- deskripsi;
- nominal;
- apakah tagihan berlaku per bulan;
- penginapan yang menjadi sumber tagihan.

Contoh:

```text
Penginapan
     │
     └── Tagihan
          ├── Sewa Kamar
          ├── Nominal
          ├── Deskripsi
          └── Periode
```

---

## 4.7 Invoice

Invoice merupakan dokumen/record penagihan yang dibuat berdasarkan tagihan.

Hubungannya:

```text
Penginapan
     ↓
   Bill
     ↓
  Invoice
     ↓
 Payment
```

Invoice menjadi penghubung sebelum pembayaran dicatat.

---

## 4.8 Payment / Pembayaran

Payment menyimpan proses pembayaran yang dilakukan terhadap invoice.

Data pembayaran meliputi:

- invoice;
- deskripsi;
- nominal;
- status;
- tanggal pembayaran;
- bukti pembayaran;
- nama file bukti;
- waktu verifikasi;
- user yang melakukan verifikasi.

Status pembayaran digunakan untuk menunjukkan proses:

```text
PENDING
   │
   ├──────────────→ VERIFIED / DITERIMA
   │
   └──────────────→ REJECTED / DITOLAK
```

---

# 5. Alur Kerja Utama Sistem

## 5.1 Alur Login

Semua pengguna masuk melalui sistem autentikasi.

```text
┌──────────────┐
│    LOGIN     │
└──────┬───────┘
       ↓
Validasi akun
       ↓
Apakah akun valid?
   ┌───┴────┐
  Tidak    Ya
   │        │
   ↓        ↓
 Error   Pemeriksaan Role
            │
       ┌────┼───────────┐
       ↓    ↓           ↓
     ADMIN STAFF      TENANT
       │    │           │
       ↓    ↓           ↓
 Dashboard Dashboard  Portal Tenant
```

Session login menggunakan JWT yang disimpan melalui cookie HttpOnly.

---

# 6. Alur Pengelolaan Kamar

Alur kamar:

```text
ADMIN / STAFF
      │
      ↓
Tambah / Edit Kamar
      │
      ├── Nomor kamar
      ├── Ukuran
      ├── Fasilitas
      └── Harga per bulan
      │
      ↓
Data Kamar Tersimpan
      │
      ↓
Digunakan dalam Penginapan
      │
      ↓
Menentukan Tagihan Sewa
```

Kamar yang sudah memiliki penghuni dapat ditampilkan bersama informasi penyewa sehingga pengelola dapat mengetahui:

- nomor kamar;
- siapa penghuninya;
- harga kamar;
- periode tinggal;
- status hunian.

---

# 7. Alur Pendaftaran/Pengelolaan Penyewa

```text
ADMIN / STAFF
      │
      ↓
Input Data Penyewa
      │
      ├── NIK
      ├── Nama
      ├── Jenis Kelamin
      ├── Nomor Telepon
      └── Alamat
      │
      ↓
Data Penyewa Tersimpan
      │
      ↓
Buat / Atur Penginapan
      │
      ↓
Pilih Kamar
      │
      ↓
Tentukan Periode Tinggal
```

Data penyewa kemudian menjadi sumber untuk proses tagihan dan pembayaran.

---

# 8. Alur Penginapan

Penginapan merupakan bagian penting karena menghubungkan penyewa dengan kamar.

```text
        PENYEWA
           │
           ↓
      PENGINAPAN
           │
      ┌────┴────┐
      ↓         ↓
   KAMAR     PERIODE
      │         │
      └────┬────┘
           ↓
     STATUS HUNIAN
```

Sistem melakukan pengecekan periode sehingga satu kamar tidak dapat diberikan kepada dua penginapan yang waktunya bertabrakan.

---

# 9. Alur Tagihan dan Invoice

Setelah penginapan tersedia, pengelola dapat membuat tagihan.

```text
PENGINAPAN
     │
     ↓
TAGIHAN
     │
     ├── Nama
     ├── Deskripsi
     ├── Nominal
     └── Per bulan / tidak
     │
     ↓
INVOICE
     │
     ↓
Siap dibayar oleh Tenant
```

Nominal pembayaran berasal dari tagihan/invoice sehingga tenant tidak bebas mengubah nominal pembayaran.

---

# 10. Alur Pembayaran Tenant

Ini merupakan salah satu alur utama KosManager.

```text
┌──────────────────┐
│ Tenant Login     │
└────────┬─────────┘
         ↓
Portal Penyewa
         ↓
Melihat Tagihan
         ↓
Memilih Invoice
         ↓
Sistem menentukan nominal
         ↓
Tenant memilih tanggal
         ↓
Upload bukti pembayaran
         ↓
┌─────────────────────────┐
│ Payment = PENDING       │
│ Menunggu Verifikasi     │
└────────────┬────────────┘
             ↓
     Admin / Staff
     memeriksa bukti
             │
       ┌─────┴─────┐
       ↓           ↓
    DITERIMA     DITOLAK
       │           │
       ↓           ↓
 Pembayaran      Tenant
 terverifikasi   mengetahui
       │         status
       └─────┬─────┘
             ↓
       Status tersimpan
```

---

# 11. Alur Verifikasi Pembayaran

Admin atau Staff memeriksa:

1. invoice yang dibayar;
2. nominal pembayaran;
3. tanggal pembayaran;
4. bukti pembayaran;
5. status pembayaran.

Kemudian pembayaran dapat diproses sesuai hasil pemeriksaan.

```text
PEMBAYARAN
    │
    ↓
PENDING
    │
    ↓
Pemeriksaan bukti
    │
 ┌──┴──────────┐
 ↓             ↓
Valid        Tidak valid
 ↓             ↓
Terima        Tolak
 ↓             ↓
Verified     Rejected
```

Sistem menggunakan proses perubahan status yang aman agar pembayaran yang sama tidak dapat diverifikasi dua kali secara bersamaan.

---

# 12. Alur Lengkap Dari Awal Sampai Akhir

Berikut gambaran besar sistem:

```text
                    ┌───────────────┐
                    │     LOGIN     │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Validasi User │
                    └───────┬───────┘
                            ↓
                     Pemeriksaan Role
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
      ADMIN/OWNER         STAFF            TENANT
          │                 │                 │
          ↓                 ↓                 ↓
   Kelola Data Kos    Operasional       Portal Tenant
          │                 │                 │
          └────────────┬────┘                 │
                       ↓                      │
                    KAMAR                     │
                       ↓                      │
                    PENYEWA                   │
                       ↓                      │
                  PENGINAPAN                  │
                       ↓                      │
                    TAGIHAN ←────────────────┘
                       ↓
                    INVOICE
                       ↓
                  PEMBAYARAN
                       ↓
                 PENDING / WAIT
                       ↓
              ADMIN / STAFF REVIEW
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
          DITERIMA             DITOLAK
             ↓                   ↓
        VERIFIED              REJECTED
             │                   │
             └─────────┬─────────┘
                       ↓
                 Tenant melihat
                 status pembayaran
```

---

# 13. Relasi Antar Data

Struktur hubungan data secara konseptual:

```text
ACCOUNT
   │
   └── USER
         │
         └── RENTER
               │
               └──────────────┐
                              ↓
                           LODGING
                              ↑
                              │
ROOM ─────────────────────────┘
                              │
                              ↓
                             BILL
                              │
                              ↓
                           INVOICE
                              │
                              ↓
                           PAYMENT
                              │
                 ┌────────────┴────────────┐
                 ↓                         ↓
            Bukti Bayar               Verifikasi
                 │                         │
                 └───────────┬─────────────┘
                             ↓
                      ADMIN / STAFF
```

---

# 14. Fitur Utama Sistem

## Dashboard

Dashboard memberikan ringkasan kondisi sistem dan membantu pengguna memahami keadaan operasional kos dari satu halaman.

Informasi dashboard dapat digunakan untuk memantau data seperti:

- jumlah kamar;
- kondisi hunian;
- data penyewa;
- informasi tagihan;
- invoice;
- pembayaran;
- aktivitas operasional yang relevan dengan role pengguna.

---

## Manajemen User

Digunakan untuk:

- membuat akun;
- mengubah data pengguna;
- menentukan role;
- menghubungkan akun dengan penyewa;
- mengelola status akun.

---

## Manajemen Kamar

Digunakan untuk:

- menambah kamar;
- mengubah kamar;
- melihat kamar;
- mengatur nomor kamar;
- mengatur ukuran;
- mengatur fasilitas;
- mengatur harga sewa;
- menghapus data secara aman menggunakan mekanisme soft delete.

---

## Manajemen Penyewa

Digunakan untuk menyimpan identitas penghuni:

- NIK;
- nama;
- jenis kelamin;
- nomor telepon;
- alamat.

---

## Manajemen Penginapan

Digunakan untuk:

- menentukan penyewa;
- menentukan kamar;
- menentukan tanggal mulai;
- menentukan tanggal selesai;
- memantau hubungan penghuni dengan kamar;
- mencegah bentrok periode kamar.

---

## Manajemen Tagihan

Digunakan untuk:

- membuat tagihan;
- menentukan nama tagihan;
- memberikan deskripsi;
- menentukan nominal;
- menentukan apakah tagihan berlaku per bulan;
- menghubungkan tagihan dengan penginapan.

---

## Manajemen Invoice

Digunakan untuk membuat record invoice dari tagihan sehingga tagihan dapat masuk ke proses pembayaran.

---

## Manajemen Pembayaran

Digunakan untuk:

- menerima pembayaran dari tenant;
- menyimpan nominal;
- menyimpan tanggal pembayaran;
- menyimpan bukti pembayaran;
- menyimpan status;
- menyimpan informasi verifikasi.

---

## Verifikasi Pembayaran

Admin/Staff dapat memeriksa bukti pembayaran dan mengubah status pembayaran sesuai hasil pemeriksaan.

---

## Pencarian

Modul yang mendukung pencarian dapat digunakan untuk menemukan data lebih cepat tanpa harus membuka seluruh daftar secara manual.

---

## Validasi Data

Sistem memiliki validasi untuk membantu menjaga konsistensi data, termasuk:

- validasi NIK;
- validasi nomor telepon;
- validasi fasilitas;
- validasi nominal;
- validasi relasi;
- validasi periode penginapan;
- validasi pembayaran.

---

## Soft Delete

Data penting tidak langsung dihapus secara permanen dari database ketika menggunakan mekanisme soft delete.

Konsepnya:

```text
DATA AKTIF
    │
    ↓
Hapus
    │
    ↓
deleted_at terisi
    │
    ↓
Tidak ditampilkan sebagai data aktif
```

Hal ini membantu menjaga histori data dan mengurangi risiko kehilangan data secara langsung.

---

# 15. Keamanan dan Hak Akses

Sistem menerapkan beberapa mekanisme untuk menjaga keamanan aplikasi.

### Authentication

Login menggunakan session berbasis JWT yang disimpan melalui cookie HttpOnly.

### Role-based access

Akses pengguna dibedakan berdasarkan role sehingga halaman/fungsi administrasi tidak disamakan dengan portal tenant.

### Pembatasan data tenant

Tenant diarahkan untuk hanya mengakses data yang berhubungan dengan dirinya.

### Validasi server

Data penting tidak hanya bergantung pada validasi tampilan, tetapi juga diperiksa pada sisi server.

### Pembayaran atomik

Perubahan status pembayaran menggunakan mekanisme pembaruan yang aman untuk mencegah dua proses verifikasi terhadap pembayaran yang sama secara bersamaan.

### Validasi bentrok kamar

Penginapan diperiksa berdasarkan periode agar kamar tidak digunakan oleh dua penghuni pada periode yang bertabrakan.

---

# 16. Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Next.js | Framework aplikasi web |
| React | Antarmuka pengguna |
| Prisma ORM | Pengelolaan akses database |
| MySQL | Database relasional |
| JWT | Session/authentication |
| JavaScript | Bahasa pemrograman utama |
| Vercel | Deployment aplikasi |
| GitHub | Version control dan repository |

---

# 17. Arsitektur Sederhana

```text
┌─────────────────────────────────────────┐
│              USER / BROWSER             │
│  Admin       Staff       Tenant         │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│              NEXT.JS / REACT            │
│                                         │
│  UI → Authentication → Role → API       │
│                    │                    │
│                    ↓                    │
│             Business Logic              │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│                 PRISMA                  │
│             Database Access             │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│                  MYSQL                  │
│                                         │
│ Account │ User │ Room │ Renter          │
│ Lodging │ Bill │ Invoice │ Payment      │
└─────────────────────────────────────────┘
```

---

# 18. Contoh Skenario Penggunaan

## Skenario 1 — Pemilik memasukkan kamar

```text
Pemilik Login
     ↓
Dashboard
     ↓
Menu Kamar
     ↓
Tambah Kamar
     ↓
Nomor + Ukuran + Fasilitas + Harga
     ↓
Simpan
     ↓
Kamar tersedia dalam sistem
```

## Skenario 2 — Penyewa menempati kamar

```text
Pemilik/Staff
     ↓
Data Penyewa
     ↓
Pilih Penyewa
     ↓
Buat Penginapan
     ↓
Pilih Kamar
     ↓
Tentukan Periode
     ↓
Penginapan aktif
```

## Skenario 3 — Penyewa melakukan pembayaran

```text
Tenant Login
     ↓
Portal Tenant
     ↓
Lihat Tagihan
     ↓
Pilih Invoice
     ↓
Upload Bukti Pembayaran
     ↓
Status PENDING
     ↓
Admin/Staff memeriksa
     ↓
VERIFIED / REJECTED
```

---

# 19. Akun Demo

Akun berikut digunakan untuk pengujian aplikasi:

| Role | Username | Password |
|---|---|---|
| Pemilik Kos | `admin55` | `admin55` |
| Karyawan Kos | `user55` | `user55` |
| Penyewa Kos | `rombengz` | `123456789qwe` |

### Catatan

Akun tersebut merupakan akun demo untuk pengujian. Untuk penggunaan production, gunakan credential yang berbeda dan aman.

Akun tenant harus terhubung dengan data penyewa agar portal tenant dapat menampilkan data kamar, tagihan, invoice, dan pembayaran yang sesuai.

---

# 20. Seed Data

Repository menyediakan seed database untuk membantu menyiapkan data awal.

Seed dapat membuat/memperbarui akun demo dan data pendukung untuk pengujian, termasuk:

- akun Pemilik;
- akun Karyawan;
- akun Tenant;
- kamar demo;
- penginapan tenant jika belum tersedia;
- tagihan tenant jika belum tersedia;
- invoice tenant jika belum tersedia.

Seed dibuat agar dapat digunakan kembali tanpa membuat data demo yang sama berulang kali.

> Jalankan seed hanya pada database yang memang ditujukan untuk data demo/pengujian. Untuk database production yang berisi data nyata, lakukan backup dan pemeriksaan terlebih dahulu.

---

# 21. Menjalankan Project Secara Lokal

## Persyaratan

Pastikan tersedia:

- Node.js;
- npm;
- MySQL;
- Git.

## Instalasi

```bash
git clone https://github.com/abdankribo/KosManagerSistemTugasAkhir.git
cd KosManagerSistemTugasAkhir
npm install
```

Buat file environment:

```bash
cp .env.example .env.local
```

Kemudian isi minimal:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
AUTH_SECRET="gunakan-secret-acak-minimal-32-karakter"
```

Generate Prisma Client:

```bash
npx prisma generate
```

Jalankan aplikasi:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

---

# 22. Deployment Vercel

Konfigurasi deployment utama:

```text
GitHub
   │
   ↓
Repository KosManagerSistemTugasAkhir
   │
   ↓
Vercel
   │
   ↓
Next.js Build
   │
   ↓
Production Application
   │
   ↓
MySQL
```

Environment variable utama:

- `DATABASE_URL`
- `AUTH_SECRET`

Build command project:

```bash
npm run build
```

Database production harus sudah tersedia dan environment variable harus diarahkan ke database yang benar.

---

# 23. Catatan Database

Database menggunakan MySQL melalui Prisma.

Model utama:

```text
Account
User
Room
Renter
Lodging
Bill
Invoice
Payment
```

Sebelum melakukan perubahan schema pada database yang sudah berisi data nyata:

1. lakukan backup;
2. periksa schema database;
3. periksa migration/perubahan yang akan dilakukan;
4. pastikan relasi tidak merusak data;
5. lakukan pengujian terlebih dahulu.

Jangan menjalankan perintah yang mengubah struktur database production tanpa memahami dampaknya.

---

# 24. Ringkasan Alur Sistem Dalam Satu Diagram

Diagram berikut menggambarkan sistem dari sudut pandang pengguna sampai pembayaran:

```text
                         ┌───────────────┐
                         │     LOGIN     │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │ Validasi User │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │  Cek Role     │
                         └───────┬───────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ↓                   ↓                   ↓
        ┌─────────┐         ┌─────────┐         ┌─────────┐
        │  ADMIN  │         │  STAFF  │         │ TENANT  │
        └────┬────┘         └────┬────┘         └────┬────┘
             │                   │                   │
             └──────────┬────────┘                   │
                        ↓                            │
                 ┌──────────────┐                    │
                 │     KAMAR    │                    │
                 └──────┬───────┘                    │
                        ↓                            │
                 ┌──────────────┐                    │
                 │   PENYEWA    │                    │
                 └──────┬───────┘                    │
                        ↓                            │
                 ┌──────────────┐                    │
                 │  PENGINAPAN  │                    │
                 └──────┬───────┘                    │
                        ↓                            │
                 ┌──────────────┐                    │
                 │   TAGIHAN    │◄───────────────────┘
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    INVOICE   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  PEMBAYARAN  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    PENDING   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ ADMIN / STAFF│
                 │  VERIFIKASI  │
                 └──────┬───────┘
                        │
                 ┌──────┴───────┐
                 ↓              ↓
            ┌─────────┐    ┌─────────┐
            │VERIFIED │    │REJECTED │
            └────┬────┘    └────┬────┘
                 │              │
                 └──────┬───────┘
                        ↓
                 Tenant melihat
                 status pembayaran
```

---

# 25. Kesimpulan

KosManager mengintegrasikan proses administrasi kos mulai dari pengelolaan pengguna dan kamar, pencatatan penyewa, pengaturan penginapan, pembuatan tagihan dan invoice, sampai proses pembayaran dan verifikasi.

Pembagian role membuat sistem memiliki tiga sudut pandang:

```text
PEMILIK
   ↓
Mengelola dan mengawasi sistem

KARYAWAN
   ↓
Menjalankan operasional kos

PENYEWA
   ↓
Mengakses data pribadi dan melakukan pembayaran
```

Dengan hubungan data:

```text
USER
  ↓
RENTER
  ↓
LODGING
  ↓
ROOM
  ↓
BILL
  ↓
INVOICE
  ↓
PAYMENT
  ↓
VERIFICATION
```

alur administrasi kos dapat dipusatkan dalam satu sistem sehingga pengelola dapat memantau data dan proses pembayaran dengan lebih terstruktur.

---

## Repository

Source code:
https://github.com/abdankribo/KosManagerSistemTugasAkhir

Project ini menggunakan GitHub sebagai repository dan Vercel sebagai platform deployment aplikasi Next.js.
