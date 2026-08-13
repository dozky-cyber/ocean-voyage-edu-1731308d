# Consultant Engine V5 — Penajaman Core Solution vs Potential Feature

Mesin Core vs Growth sudah ada (V4). Yang belum dijalankan penuh adalah beberapa aturan khusus fitur dan pembacaan konteks bisnis (lokasi, proses transaksi). Rencana ini mempertegasnya tanpa mengubah struktur PDF, harga, atau data Order Brief.

## Yang akan diperbaiki

### 1. Analisa bisnis lebih lengkap (STEP 1)
`src/lib/order-brief-insight.ts` — konteks yang dikirim ke mesin ditambah sinyal lokasi bisnis dan proses transaksi (dari brief: jumlah lokasi/cabang, cara customer bayar/pesan), bukan hanya nama bisnis + masalah. Nama bisnis saja tidak pernah cukup untuk memilih fitur.

### 2. Aturan khusus per fitur (STEP 6 + ATURAN KHUSUS)
`src/lib/admin/problem-solution-map.ts` dan `src/lib/admin/consultant-library.ts`:

- **Digital Nota** — Core hanya bila brief menyebut masalah nota/bukti transaksi/pembayaran manual. Bisnis transaksional tanpa keluhan itu tetap mendapatkannya sebagai Potential Feature.
- **Order Management** — Core bila ada pencatatan order manual (aturan yang sudah ada, token diperluas bila ditemukan celah saat uji).
- **Status Tracking** — Core bila ada proses pekerjaan/status yang ditanyakan customer.
- **Inventory** — diperketat: hanya muncul (Core maupun Potential) bila stok/gudang/kehabisan barang disebut pada Business Problem atau tujuan customer. Sinyal dari jenis bisnis saja tidak lagi cukup.
- **Multi User** — hanya bila brief menyebut kebutuhan hak akses berbeda; adanya karyawan tidak cukup (sudah ada, dipertahankan + ditegaskan pada validasi).
- **Dashboard** — tidak pernah otomatis Core; Core hanya bila owner menyebut kebutuhan memantau operasional.
- **Automation** — selalu Potential kecuali customer secara eksplisit meminta otomatisasi/reminder.
- **CRM** — hanya untuk kebutuhan pengelolaan customer yang kompleks (sales/pipeline/prospek/banyak pelanggan berulang); usaha kecil tetap diblok.

### 3. Validasi 4 pertanyaan dijadikan gate eksplisit
`src/lib/admin/consultant-library.ts` — hasil validasi menyimpan jawaban 4 pertanyaan (menyelesaikan masalah utama, sesuai skala, sesuai alur bisnis, tidak ada solusi lebih sederhana). Fitur yang gagal dibuang, termasuk saat berstatus Core, kecuali customer memintanya langsung.

### 4. Package decision & Enterprise hard filter
`src/lib/admin/package-decision-sop.ts` sudah menerapkan 4 level + hard filter Enterprise (butuh ≥2 sinyal: multi cabang, struktur bertingkat, user besar, integrasi ERP/API). Tidak diubah; hanya ditambahkan uji regresi bahwa dashboard/database/laporan/karyawan/automation saja tidak pernah menghasilkan Enterprise.

### 5. Urutan output PDF
`src/lib/order-brief-pdf.ts` — memastikan urutan: Order Brief → Package Recommendation → Team KERJAKU Consultant Recommendation (judul bagian ditegaskan sebagai **CORE SOLUTION**, tiap item tetap memuat baris "Menyelesaikan: …") → Potential Feature Recommendation (pengembangan lanjutan) → Closing. Aturan anti-potong halaman tetap.

### 6. Chatbot konsisten
`src/routes/api/public/consultant-chat.ts` — aturan khusus di atas (Digital Nota, Inventory, Multi User, Dashboard, Automation, CRM) ditambahkan ke prompt agar rekomendasi saat chat sama dengan PDF.

## Verifikasi
Suite `src/lib/admin/consultant-scenarios.test.ts` (22 skenario bisnis) diperluas dengan assertion baru:
- Inventory tidak muncul pada bisnis tanpa masalah stok.
- Digital Nota tidak menjadi Core bila nota tidak disebut.
- Automation & CRM tidak pernah Core kecuali diminta.
- Dashboard Core hanya saat monitoring disebut.
- Tidak ada Enterprise pada bisnis satu lokasi.
Ditambah laporan tabel ulang 22 skenario (bisnis, masalah, package, core, potential, fitur terblok) untuk pemeriksaan manual.

## Catatan teknis
File yang disentuh: `problem-solution-map.ts`, `consultant-library.ts`, `order-brief-insight.ts`, `order-brief-pdf.ts`, `consultant-chat.ts`, `consultant-scenarios.test.ts`. Tidak ada perubahan skema database, harga, atau struktur Order Brief.
