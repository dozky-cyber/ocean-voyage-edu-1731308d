# Consultant Engine V7 — Potential Feature Intelligence

## Penilaian PDF Tobiin saat ini: 6.5/10

Yang sudah benar: tidak ada duplikat, tidak ada boilerplate Enterprise, Langkah Selanjutnya sudah satu poin, package Business System sudah proporsional.

Yang membuat nilainya turun:

- Bagian Potential Feature hilang sepenuhnya. Dua ide (Notification, Form Konsultasi) ikut terlipat ke dalam blok Consultant, sehingga pembaca tidak melihat section peluang pengembangan sama sekali.
- Hanya 2 ide, tanpa alasan bisnis, tanpa dampak, tanpa prioritas. Untuk paket Business System ini terlalu tipis.
- Invoice / Nota Digital yang sempat muncul di percakapan hilang karena aturan blokir keras masih ikut berlaku untuk ide opsional, bukan hanya untuk Core.
- Bagian ALASAN masih menyalin ulang seluruh Project Summary sehingga terbaca berulang.

Jadi: belum maksimal. Perbaikan berikut menargetkan 9/10.

## Prinsip yang tetap dipertahankan

Core Solution tetap ketat: hanya untuk masalah yang belum ter-cover, tidak boleh duplikat dengan Feature List, tidak boleh menaikkan package. Yang dilonggarkan hanya lapisan Potential Feature, karena sifatnya opsional dan memang tugasnya menawarkan peluang pengembangan.

## Perubahan yang akan dibuat

### 1. Pisahkan gating Core dan Potential

Aturan blokir keras (Digital Nota butuh masalah nota, Inventory butuh masalah stok, CRM butuh kompleksitas, Automation butuh permintaan) tetap berlaku penuh untuk **Core**. Untuk **Potential**, fitur yang sama boleh muncul bila lolos syarat opsional:

- relevan dengan alur bisnis yang terdeteksi (workshop custom = order → produksi → serah terima → pembayaran), dan
- merupakan lanjutan wajar dari fitur yang sudah ada di Feature List, dan
- punya manfaat bisnis konkret yang bisa dituliskan.

Multi-User dan fitur bertim tetap diblokir untuk skala personal. Enterprise tetap diblokir oleh hard filter.

### 2. Buka kandidat saat semua masalah sudah ter-cover

Saat Core kosong, syarat "harus ada di peta growth" dilepas. Kandidat diambil dari seluruh Consultant Library yang lolos tier package, lolos skala, non-duplikat, lalu diberi skor berdasarkan kedekatan dengan alur bisnis dan fitur yang sudah dipilih customer.

Untuk kasus Tobiin, kandidat yang seharusnya muncul: Notification Status, Digital Nota / Invoice, Customer Database & History, Form Konsultasi / Request Penawaran, Laporan Ringkas Owner, Review & Testimonial, Jadwal / Schedule Produksi. Diambil 3–5 terbaik.

### 3. Potential Feature jadi section sendiri, tidak dilipat lagi

Hapus aturan pelipatan yang membuat ide opsional pindah ke blok Consultant. Selama ada minimal satu ide, PDF menampilkan section POTENTIAL FEATURE RECOMMENDATION tersendiri dengan disclaimer opsional.

### 4. Setiap ide ditulis sebagai analisa konsultan, bukan nama fitur

Format tiap poin:

```text
Nama Fitur                                   [Opsional]
Peluang    : kondisi bisnis yang membuat ini relevan
Dampak     : hasil nyata bila dijalankan
Kaitan     : fitur pada Feature List yang disempurnakan
```

Ide dikelompokkan dalam urutan prioritas: efisiensi operasional lebih dulu, lalu pertumbuhan penjualan, lalu visibilitas owner.

### 5. Rapikan ALASAN package

Berhenti menyalin ulang seluruh Project Summary. Alasan diringkas jadi tiga kalimat: kebutuhan bisnis, karakter proses yang cocok dengan level solusi, skala pengguna. Isi Project Summary tetap utuh di halaman pertama.

### 6. Samakan chatbot

Instruksi chat diperbarui agar Potential Feature selalu berisi 3–5 ide dengan peluang dan dampak, dan agar ide yang sudah disebut saat konsultasi (misalnya invoice) tidak hilang di dokumen akhir.

## Verifikasi

- Regenerasi kasus Tobiin: Core tetap kosong, Potential berisi minimal 3 ide termasuk Notification dan Digital Nota, semuanya di luar Feature List.
- Tidak ada satu fitur pun muncul di dua section.
- Skala personal tetap tidak mendapat fitur bertim; hard filter Enterprise tetap aktif.
- Package tetap Business System, tidak naik karena jumlah ide.
- Seluruh regression suite yang ada (190 assertion) tetap lulus.
- QA PDF: render ulang tiap halaman, periksa section tidak kosong, tidak terpotong, penomoran rapi.

## Catatan teknis

File yang disentuh: `consultant-library.ts`, `problem-solution-map.ts`, `order-brief-insight.ts`, `order-brief-pdf.ts`, `consultant-chat.ts`, `consultant-scenarios.test.ts`. Tidak ada perubahan database, harga, atau struktur input Order Brief.
