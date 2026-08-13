# Consultant Engine V7 — Desain Logic Final (Relationship-Based Recommendation)

Tujuan: menutup celah V6 (Potential Feature hilang) tanpa jatuh ke V7 versi longgar (semua library masuk). Kuncinya: kandidat Potential tidak dipilih dari "sisa library", tapi dari **hubungan** terhadap fitur yang sudah dipilih customer dan alur bisnisnya.

## 1. Model keputusan

Setiap fitur library dinilai terhadap Feature List customer dan menghasilkan salah satu dari empat relasi:

```text
DUPLICATE      fitur yang sama / alias dari yang sudah dipilih   -> BUANG
GAP            masalah customer yang belum punya solusi          -> CORE
ENHANCEMENT    memperkuat fitur yang sudah dipilih               -> POTENTIAL
COMPLEMENTARY  melanjutkan alur bisnis setelah fitur yang ada    -> POTENTIAL
UNRELATED      tidak punya hubungan dengan keduanya              -> BUANG
```

Fitur hanya boleh masuk dokumen jika relasinya GAP, ENHANCEMENT, atau COMPLEMENTARY. Tidak ada jalur lain — inilah pengaman agar library tidak tumpah.

Contoh untuk Tobiin:

```text
Status Tracking      -> DUPLICATE      (sudah ada)            buang
Portfolio, FAQ       -> DUPLICATE      (sudah ada)            buang
Notification Progress-> ENHANCEMENT of Status Tracking        potential
Digital Invoice      -> COMPLEMENTARY of Pencatatan Project   potential
Customer History     -> COMPLEMENTARY of Pencatatan Project   potential
Form Konsultasi      -> COMPLEMENTARY of Portfolio            potential
Testimonial          -> ENHANCEMENT of Portfolio              potential
Inventory, Multi User, CRM, Enterprise -> UNRELATED / diblok  buang
```

## 2. Peta relasi eksplisit

Ditambahkan ke library sebagai data, bukan tebakan teks. Tiap fitur mendapat dua field baru:

- `enhances`: daftar id fitur yang diperkuat olehnya
- `complements`: daftar id fitur yang secara alur bisnis wajar menyusul

Sumber pasangan: alur bisnis yang sudah ada di `business-flow-patterns.ts` (order → produksi → serah terima → pembayaran → after sales). Peta ini yang menentukan kandidat, sehingga hasil selalu bisa dijelaskan sebagai "karena customer sudah punya X".

## 3. Core Solution

Tidak berubah dari V6, hanya dipertegas:

- Kandidat hanya dari masalah berstatus GAP (belum ter-cover Feature List, dicek lewat id canonical + alias).
- Maksimum 4, boleh 0.
- Tidak ada kewajiban mengisi. Bila kosong, dokumen menampilkan validasi scope singkat, bukan fitur pengganti.
- Semua hard filter tetap berlaku penuh di jalur Core.

## 4. Potential Feature

Kandidat wajib lolos berurutan:

1. Bukan DUPLICATE terhadap Feature List maupun Core yang terpilih.
2. Punya relasi ENHANCEMENT atau COMPLEMENTARY ke minimal satu fitur yang sudah dipilih customer.
3. Lolos filter skala dan tier package (personal tetap tidak dapat fitur bertim, tier tidak melebihi level package).
4. Punya manfaat bisnis yang bisa dituliskan konkret. Bila tidak ada kalimat dampak yang jelas, kandidat gugur.

Kuota: 3–5 ide untuk level Business System ke atas, 1–3 untuk Basic/Professional. Bila kandidat yang lolos kurang dari kuota, tampilkan seadanya — tidak ada pengisian paksa.

Urutan: efisiensi operasional lebih dulu, lalu pertumbuhan penjualan, lalu visibilitas owner.

### Perbedaan gating Core vs Potential

Filter khusus tetap hidup, tapi jalurnya dibedakan secara terkontrol:

| Fitur | Core | Potential |
| --- | --- | --- |
| Inventory | butuh masalah stok | tetap butuh sinyal stok — tidak dilonggarkan |
| Multi User | butuh masalah hak akses | tetap diblokir untuk skala personal |
| CRM | butuh kompleksitas customer | tetap butuh sinyal; tidak muncul untuk owner tunggal |
| Automation | butuh permintaan eksplisit | boleh sebagai enhancement bila ada Notification/Status Tracking |
| Digital Invoice / Nota | butuh masalah nota/pembayaran | boleh sebagai complementary bila ada pencatatan order/project |
| Enterprise tier | hard filter | hard filter, tanpa pengecualian |

Jadi yang dilonggarkan hanya dua: Automation dan Digital Invoice, dan hanya lewat jalur relasi ke fitur yang sudah dipilih customer.

## 5. Format penulisan Potential Feature

```text
Nama Fitur                                        [Opsional]
Relevansi : kondisi bisnis customer yang membuat ini masuk akal
Dampak    : hasil nyata bagi operasional atau penjualan
Kaitan    : fitur pada Feature List yang diperkuat atau dilanjutkan
```

Kalimat Kaitan diambil langsung dari relasi, sehingga tidak pernah muncul rekomendasi tanpa dasar.

## 6. Struktur dokumen

- Section POTENTIAL FEATURE RECOMMENDATION berdiri sendiri; aturan pelipatan ke blok Consultant dihapus.
- Bila Core kosong: validasi scope singkat + Potential.
- Bila Potential kosong: section dihilangkan sepenuhnya, bukan diisi generik.
- Bagian ALASAN package diringkas jadi tiga kalimat (kebutuhan bisnis, karakter proses, skala pengguna) dan berhenti menyalin ulang Project Summary.
- Package tidak pernah naik karena jumlah Potential.

## 7. Chatbot disamakan

Instruksi konsultasi memakai empat relasi yang sama, wajib menyebut relevansi dan dampak, dan ide yang sudah dibahas saat chat (misalnya invoice) tidak boleh hilang di dokumen akhir selama relasinya valid.

## 8. Audit ulang sample Tobiin

Hasil yang diharapkan setelah implementasi:

```text
Package  : Business System
Core     : kosong, diganti validasi scope
Potential: Notification Progress
           Digital Invoice / Payment Record
           Customer Database & History
           Form Konsultasi Custom Project
           Testimonial (bila lolos relevansi)
```

Assertion negatif: tidak ada Status Tracking, Portfolio, FAQ, Pencatatan Project, Inventory, Multi User, maupun fitur Enterprise.

## 9. Verifikasi

- Assertion baru untuk Tobiin sesuai tabel di atas.
- Tidak ada satu id canonical pun muncul di dua section.
- Setiap Potential wajib punya `enhances`/`complements` yang tercetak sebagai Kaitan.
- Skenario dengan gap nyata tetap menghasilkan Core yang benar.
- Skenario personal, laundry, retail, distributor tetap lulus tanpa fitur bertim atau Enterprise.
- Seluruh regression suite berjalan (saat ini 190 assertion), plus QA render PDF per halaman.

## Catatan teknis

File yang disentuh: `consultant-library.ts` (field relasi + jalur seleksi), `problem-solution-map.ts`, `business-flow-patterns.ts` (pasangan alur), `order-brief-insight.ts` (kuota + penghapusan pelipatan), `order-brief-pdf.ts` (format 3 baris + section kondisional), `consultant-chat.ts`, `consultant-scenarios.test.ts`. Tidak ada perubahan database, harga, atau struktur input Order Brief.
