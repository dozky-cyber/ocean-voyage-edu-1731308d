# Order Brief — Deskripsi Potential Feature yang Spesifik per Jenis Bisnis

Masalah saat ini: kalimat relevansi Potential Feature masih memakai nama pola bisnis yang terlalu luas ("jasa / service / appointment business"), sehingga terasa template. Untuk Tobiin seharusnya berbicara sebagai bisnis furniture & interior custom (desain -> produksi -> finishing -> instalasi).

Penyebabnya sudah dipastikan dari kode: alasan relevansi diambil dari `reasons` generik di consultant library lalu dirapikan oleh `humanizeRelevance`, yang menyisipkan nama `BusinessFlowPattern` (5 pola besar). Tidak ada lapisan kosakata per industri.

## Yang akan dibangun

### 1. Industry Context Library (baru)

File baru `src/lib/admin/industry-context.ts` berisi ~18-22 industri konkret, bukan hanya 5 pola besar. Contoh: furniture/interior custom, konveksi/garmen, percetakan/advertising, kontraktor/renovasi, bengkel/otomotif, laundry, salon/barber, klinik/terapi, fotografi/videografi, wedding & event organizer, catering/kuliner, bakery, retail/olshop, distributor/grosir, properti/kos, travel/tour, jasa servis elektronik, pendidikan/kursus, pertanian/UMKM produksi, dan konsultan/agency.

Tiap industri menyimpan kosakata yang dipakai untuk menulis kalimat:

- sebutan pekerjaan (project, order, unit, sesi, acara, paket)
- tahapan kerja nyata (mis. interior: survey -> desain -> produksi -> finishing -> instalasi)
- sebutan customer, sifat transaksi (custom/berulang/satuan), dan durasi pengerjaan (panjang/singkat)
- 2-3 keluhan khas industri tersebut

Deteksi memakai keyword scoring seperti `detectBusinessFlowPattern`, dengan fallback ke pola bisnis lama bila industri tidak dikenali.

### 2. Narrative generator per fitur

File yang sama menyediakan penulis kalimat untuk tiap fitur di consultant library (notification, status tracking, digital nota, customer history, database customer, invoice, laporan, katalog, portfolio, booking, schedule, inventory, dsb.), dengan pola:

- Kenapa relevan: kondisi nyata industri + kenapa muncul (1-2 kalimat, menyebut nama bisnis dan tahapan kerja industri).
- Dampak bisnis: hasil yang dirasakan owner/customer.
- Kaitan dengan alur bisnis: menyambung ke fitur yang sudah ada di scope customer.

Contoh keluaran untuk Tobiin + Notification: "Pada bisnis interior custom seperti Fadly Furniture Interior, satu project melewati tahap desain, produksi, finishing, sampai instalasi, sehingga customer sering menanyakan perkembangan. Notifikasi otomatis membuat setiap perpindahan tahap tersampaikan tanpa owner harus mengabari satu per satu."

Kalimat disusun dari template + kosakata industri (deterministik, tanpa panggilan AI), jadi setiap jenis usaha dapat perlakuan yang sama.

### 3. Integrasi

- `src/lib/order-brief-insight.ts`: `humanizeRelevance` diganti pemakaiannya oleh generator baru untuk `reason`, `impact`, dan `relation` di daftar `optional`; juga dipakai untuk `benefit` item Core Solution agar konsisten. Bila industri tidak terdeteksi, keluaran lama tetap dipakai sebagai fallback.
- `src/lib/order-brief-pdf.ts`: hanya menyesuaikan panjang teks (paragraf multi-baris) untuk blok Kenapa relevan / Dampak / Kaitan, tetap dengan aturan tidak boleh terpotong antar halaman.
- Tidak ada perubahan pada logic pemilihan fitur, SOP package, Enterprise hard filter, maupun scope Order Brief.

### 4. Verifikasi

- Menambah pengecekan pada `src/lib/admin/consultant-scenarios.test.ts`: untuk seluruh skenario bisnis, kalimat relevansi tidak boleh mengandung frasa pola generik ("jasa / service / appointment business", "process-status", dsb.) dan wajib menyebut konteks industri atau nama bisnis.
- Render ulang sample Tobiin ke PDF dan cek halaman per halaman (tidak ada teks terpotong, tumpang tindih, atau section terbelah), plus render 2 sample industri lain (mis. laundry dan katering) untuk memastikan template bekerja lintas industri.

## Catatan teknis

File tersentuh: `src/lib/admin/industry-context.ts` (baru), `src/lib/order-brief-insight.ts`, `src/lib/order-brief-pdf.ts` (penyesuaian layout teks), `src/lib/admin/consultant-scenarios.test.ts`.

&nbsp;

Tambahan wajib:

Business Model Context

Bukan hanya industri.

Feature Vocabulary Mapping

Agar nama fitur menyesuaikan industri.

Business Stage Awareness

Agar rekomendasi tidak hanya berdasarkan jenis bisnis.