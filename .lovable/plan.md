# Consultant Engine V6 — Clean, Non-Duplicate, Solution-Gap Analysis

Sample PDF Tobiin mengonfirmasi empat masalah: **Status Tracking / Progress Tracking** muncul lagi sebagai Core meski sudah ada di Feature List; **Business System** ditulis dua kali di Langkah Selanjutnya; alasan package memuat boilerplate Enterprise yang terlalu panjang; dan mesin memaksakan Core dari masalah yang sebenarnya sudah ditangani oleh fitur customer.

## Hasil akhir yang dituju

PDF membaca hubungan berikut sebelum membuat rekomendasi:

```text
Business Problem
  → sudah diselesaikan Feature List? → tandai sebagai TER-COVER, jangan rekomendasikan ulang
  → belum diselesaikan?              → pilih Core Solution baru yang paling langsung
  → ada peluang lanjutan relevan?    → masukkan Potential Feature
```

Mesin tidak akan memaksakan Core baru jika semua masalah utama sudah ter-cover. Dalam kondisi itu, PDF menyatakan singkat bahwa kebutuhan inti sudah tepat, lalu hanya memberikan ide pengembangan yang benar-benar baru dan relevan.

## Perubahan yang akan dibuat

### 1. Deduplikasi semantik lintas seluruh PDF

Satukan pengecekan cakupan Feature List dengan **Consultant Feature Library**, bukan hanya Master Feature Library lama.

- Kenali nama yang berbeda tetapi bermakna sama, misalnya:
  - `Status Tracking Progress Pekerjaan` = `Status Tracking / Progress Tracking`
  - `Pencatatan Project / Order` = `Order Management`
  - `Halaman FAQ` = `FAQ / Knowledge Section`
  - `Galeri / Portfolio` = `Galeri Portfolio`
- Fitur yang sudah ter-cover langsung dibuang dari kandidat **Core** maupun **Potential**, tanpa pengecualian.
- Hapus aturan saat ini yang masih mengizinkan duplikat bila kandidat berstatus Core.
- Tambahkan ID canonical/alias mapping supaya deduplikasi tidak bergantung pada kemiripan judul mentah saja.

### 2. Ubah Core menjadi analisis “uncovered problem”, bukan pengulangan

Setelah peta Problem → Solution dibuat, setiap masalah diperiksa terhadap Feature List:

- Jika solusi langsung sudah ada di scope customer, masalah ditandai **covered** dan tidak menghasilkan Core Recommendation.
- Jika masalah belum punya solusi pada Feature List, mesin memilih maksimal 2–4 Core yang benar-benar menutup gap tersebut.
- Jika seluruh masalah sudah covered, bagian Core tidak menampilkan fitur palsu/duplikat. Intro konsultasi berubah menjadi validasi profesional bahwa kebutuhan inti sudah mencakup masalah utama.
- Ide baru seperti Notification, Form Konsultasi, Customer History, atau Digital Nota hanya muncul bila lolos validasi alur, skala, problem, dan solusi lebih sederhana; penempatannya tetap Core hanya jika menutup masalah yang belum ter-cover, selain itu Potential.
- Digital Nota tidak akan masuk hanya karena bisnis punya order; harus ada masalah bukti transaksi/nota/pembayaran atau gap nyata yang disebut customer.

Untuk sample Tobiin, Status Tracking dan Pencatatan Project tidak akan muncul lagi sebagai Core. Mesin akan mengenali bahwa masalah progress dan pencatatan sudah ter-cover, lalu hanya menawarkan pengembangan baru yang relevan seperti notifikasi update progress—tanpa menyebut ulang fitur awal.

### 3. Bersihkan Package Recommendation dan alasan

Ringkas alasan package menjadi tiga bagian saja:

1. kebutuhan/tujuan bisnis,
2. karakter proses yang membuat level solusi tersebut cocok,
3. skala pengguna/lokasi bila memang relevan.

Hapus permanen dari semua PDF Order Brief:

- kalimat `Enterprise hanya dipakai bila organisasi benar-benar kompleks ...`,
- daftar multi lokasi/struktur/user/ERP API,
- kalimat `Rekomendasi ini mengikuti kebutuhan yang tertulis pada Order Brief tanpa menambah kompleksitas baru.`

Enterprise Hard Filter tetap berjalan di belakang layar; hanya penjelasan internalnya yang tidak dicetak ke PDF.

### 4. Gabungkan Langkah Selanjutnya bila level solusi sama

Perbaiki generator closing:

- Bila package awal dan opsi pengembangan sama-sama `Business System`, tampilkan **satu poin Business System** saja.
- Fitur Core/Potential yang disepakati dijelaskan sebagai penyesuaian scope pada solusi yang sama, bukan package kedua.
- Dua opsi bernomor hanya ditampilkan bila memang ada dua level solusi berbeda.
- Jika tidak ada upgrade package dan tidak ada Core baru, closing cukup menyampaikan review scope dan tindak lanjut penawaran.

### 5. Rapikan struktur Consultant Recommendation

PDF akan memiliki tiga state yang jelas:

- **Ada Core baru:** tampilkan Core Solution baru + masalah yang diselesaikan.
- **Semua masalah sudah ter-cover:** tampilkan validasi singkat tanpa daftar Core duplikat.
- **Tidak ada ide tambahan yang kuat:** hilangkan Potential Feature daripada mengisi rekomendasi generik.

Section `Perbandingan Solusi` juga tidak ditampilkan bila package tidak berubah atau tidak ada kolom perbandingan, sehingga halaman lebih clean.

### 6. Samakan chatbot dengan engine PDF

Perbarui instruksi konsultasi chat agar tidak lagi memberi contoh yang mendorong pengulangan fitur. Chatbot wajib:

- membedakan solusi yang sudah diminta customer dengan gap yang belum tertutup,
- tidak memaksakan 2–4 Core ketika semua masalah sudah covered,
- tidak mengulang package yang sama sebagai dua opsi,
- menempatkan ide baru sesuai dampaknya, bukan sekadar mengambil fitur dari library.

## Verifikasi otomatis

Perluas suite skenario dengan assertion berikut:

- Reproduksi penuh sample **Furniture & Interior Tobiin**.
- Status Tracking dan Order Management tidak muncul di Core/Potential bila sudah ada dengan judul berbeda di Feature List.
- FAQ dan Portfolio juga dikenali sebagai covered melalui alias.
- Tidak ada satu feature ID canonical yang muncul pada dua section.
- Semua Core memiliki masalah **yang belum ter-cover**.
- Semua masalah yang sudah ter-cover tidak menghasilkan Core baru.
- Package awal = opsi pengembangan menghasilkan satu poin Langkah Selanjutnya.
- Boilerplate Enterprise dan kalimat kompleksitas baru tidak terdapat pada teks PDF.
- Digital Nota tidak muncul pada sample Tobiin karena tidak ada masalah nota/pembayaran.
- Skenario dengan masalah nyata yang belum ter-cover tetap menghasilkan Core yang tepat.

Jalankan seluruh regression suite yang sudah ada agar aturan Inventory, Multi User, Dashboard, CRM, Automation, Personal Scale, dan Enterprise Hard Filter tidak berubah.

## QA PDF

Generate ulang PDF dari data setara sample Tobiin, ekstrak teks, lalu render seluruh halaman menjadi gambar untuk diperiksa:

- tidak ada fitur/package berulang,
- tidak ada heading kosong,
- section yang tidak relevan benar-benar hilang,
- urutan dan numbering bersih,
- tidak ada teks terpotong atau overlap.

## Catatan teknis

Fokus perubahan: `consultant-library.ts`, `problem-solution-map.ts`, `order-brief-insight.ts`, `order-brief-pdf.ts`, `package-decision-sop.ts`, `consultant-chat.ts`, dan `consultant-scenarios.test.ts`. Tidak ada perubahan database, harga, data customer, atau struktur input Order Brief.
