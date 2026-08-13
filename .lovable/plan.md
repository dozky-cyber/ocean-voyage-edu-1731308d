# KERJAKU Package Decision Engine (SOP)

Tujuan: keputusan package pada PDF Order Brief tidak lagi ditentukan oleh banyaknya fitur, tetapi oleh tingkat kompleksitas bisnis. SOP ini menjadi satu sumber aturan yang dipakai oleh generator PDF, engine rekomendasi fitur, dan chatbot konsultasi.

Saat ini keputusan package dihitung dari pencocokan kata kunci (`complexityCeiling`) plus gate Enterprise terpisah (`enterpriseScaleJustified`) di `src/lib/order-brief-insight.ts`. Keduanya akan digantikan satu decision engine berbasis level.

## SOP 4 Level

```text
LEVEL 1 BASIC        kehadiran digital. owner sendiri, tanpa proses operasional,
                     tanpa data transaksi. profile / landing / katalog / WA / maps.

LEVEL 2 PROFESSIONAL pengelolaan konten & customer. owner masih pegang sendiri,
                     ada customer berulang. CMS, customer database, portfolio,
                     testimonial, form konsultasi, booking sederhana.

LEVEL 3 BUSINESS     ada proses operasional harian: order masuk, dikerjakan,
                     dibayar. boleh ada karyawan, tetapi tetap SATU unit bisnis.
                     order management, status tracking, nota digital, dashboard,
                     customer history, report sederhana, multi user sederhana.

LEVEL 4 ENTERPRISE   kompleksitas ORGANISASI, bukan kebutuhan sistem.
```

## Aturan penentuan level

1. Mulai dari BASIC. Level naik hanya bila ada bukti karakter bisnis pada brief.
2. Naik ke PROFESSIONAL bila ada pengelolaan konten mandiri, database/booking/member, customer berulang, atau kebutuhan update konten sendiri.
3. Naik ke BUSINESS bila ada sinyal operasional harian: order/pesanan masuk, antrian atau proses pengerjaan, status pekerjaan, nota/invoice, pembayaran, kasir, laporan harian, atau ada karyawan yang memakai sistem.
4. Naik ke ENTERPRISE hanya bila lolos hard filter di bawah.

## Hard filter Enterprise

Enterprise butuh minimal 2 dari 4 kondisi organisasi:

1. Multi lokasi / banyak cabang dengan kontrol pusat.
2. Struktur berjenjang (manager, supervisor, admin cabang) dengan approval dan hak akses berbeda.
3. User besar: >= 50 user atau banyak divisi.
4. Integrasi sistem perusahaan nyata: ERP, accounting, warehouse, API sistem eksternal.

Hard block (mengunci Enterprise walau ada kata "integrasi"/"otomatis"/"dashboard"):

- brief menyebut 1 outlet / 1 cabang / 1 lokasi dan tidak ada sinyal multi cabang;
- jumlah user kecil (<= 25) tanpa multi cabang dan tanpa struktur berjenjang;
- skala personal / dikelola owner sendiri.

Tidak pernah menjadi alasan Enterprise: punya dashboard, punya database, punya laporan, punya beberapa karyawan, punya automation sederhana.

## Konsistensi antar output

- Level hasil SOP menjadi ceiling: package pada Order Brief tidak boleh melebihi level ini, walaupun chatbot sempat menyebut package lebih tinggi.
- Opsi pengembangan Team KERJAKU Consultant maksimal satu tingkat di atas level, dan tidak pernah Enterprise bila hard filter gagal.
- Fitur bertier enterprise tidak boleh muncul (Consultant maupun Potential Feature) bila hard filter gagal.
- Alasan rekomendasi pada PDF menyebutkan dasar keputusan: karakter bisnis, jumlah lokasi, jumlah user, dan kenapa belum Enterprise.
- Prompt chatbot memakai definisi level yang sama, sehingga percakapan dan PDF tidak bertentangan.

## Detail teknis

- File baru `src/lib/admin/package-decision-sop.ts`: mendefinisikan `PackageLevel` (basic/professional/business/enterprise), sinyal per level, hard filter Enterprise, dan `decidePackageLevel(brief)` yang mengembalikan `{ level, signals, blockedReasons, rationale }`. SOP ditulis sebagai komentar di file ini agar menjadi dokumentasi hidup.
- `src/lib/order-brief-insight.ts`: hapus `complexityCeiling` dan `enterpriseScaleJustified`, pakai `decidePackageLevel`. Ceiling package, `allowEnterprise`, `maxTier` untuk `selectConsultantFeatures`, dan `buildConsultantOption` semuanya membaca hasil SOP. `buildReason` memakai `rationale` sehingga alasan menyebut skala dan alasan penolakan Enterprise.
- `src/lib/admin/consultant-library.ts`: pertahankan gate `allowEnterprise`, tambahkan pemetaan level SOP ke `maxTier` (basic->basic, professional->professional, business->business, enterprise->enterprise).
- `src/routes/api/public/consultant-chat.ts`: ganti bagian package pada system prompt dengan ringkasan SOP 4 level + hard filter, termasuk contoh laundry 1 outlet = Business System.

## Verifikasi

Skenario uji terhadap engine:

1. Florist personal, katalog + WA -> Basic.
2. Fotografer dengan booking + testimonial -> Professional.
3. Laundry 1 outlet, owner + 4 karyawan, order & status -> Business, Enterprise terkunci.
4. Laundry 3 cabang, 60 user, laporan antar cabang -> Enterprise.
5. Brief menyebut "otomatis" dan "dashboard" pada usaha 1 outlet -> tetap Business.
