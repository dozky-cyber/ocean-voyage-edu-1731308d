# Perbaikan Logic AI Rekomendasi Fitur pada PDF Order Brief

## Masalah yang terkonfirmasi

Pada brief Rina (Florist, personal, tanpa admin/team), PDF tetap merekomendasikan **Multi User Management**. Penyebabnya ada di pengecekan kondisi bisnis di `src/lib/admin/consultant-library.ts`:

- Konteks brief dirangkai jadi satu teks panjang, lalu fitur `multi-user` lolos karena daftar `requires`-nya berisi kata `"admin"`, `"team"`, `"tim"` — dan kalimat brief justru berbunyi *"Kebutuhan admin/team: Tidak (website statis / dikelola personal)"*.
- Pengecekan hanya mencari kata kunci (`includesAny`), **tidak membaca negasi** ("tidak", "belum ada", "tanpa", "dikelola personal").
- Field skala pengguna (`usersScale = "Personal"`) dan `adminNeeds = "Tidak"` tidak dipakai sama sekali sebagai sinyal penolak.

Jadi masalahnya bukan pada teks PDF, tapi pada validasi fitur: sinyal negatif dari brief tidak dibaca.

## Yang akan dikerjakan

### 1. Baca negasi pada brief (`consultant-library.ts`)
Tambah helper deteksi negasi: jika kata kunci fitur muncul dalam kalimat yang dinegasikan ("tidak", "tanpa", "belum", "bukan", "no", "-"), kata itu **tidak dihitung** sebagai sinyal atau pemenuhan `requires`. Diterapkan pada pengecekan `requires` dan `signals`.

### 2. Sinyal skala bisnis eksplisit
Tambah input opsional `scaleText` (dari `usersScale` + `adminNeeds`) pada `selectConsultantFeatures` / `validateConsultantFeature`. Jika skala menunjukkan **personal / 1 user / tanpa admin / dikelola sendiri**, maka fitur bertim otomatis dibuang: `multi-user`, `dashboard-admin` (kecuali diminta), `cms` bertingkat, `automation` skala team, dan seluruh fitur tier `enterprise`.

### 3. Kirim data skala dari brief (`order-brief-insight.ts`)
Saat memanggil `selectConsultantFeatures`, ikut kirimkan `brief.usersScale` dan `brief.adminNeeds` sebagai `scaleText` supaya aturan di atas jalan.

### 4. Relevansi terhadap Feature List brief
Naikkan bobot fitur yang benar-benar melanjutkan alur brief (katalog → galeri → WhatsApp → repeat order), dan turunkan fitur yang tidak menyentuh masalah yang customer tulis. Jika setelah filter tidak ada fitur yang lolos, bagian "Potential Feature Recommendation" tidak dipaksa terisi (aturan yang sudah ada tetap dipakai).

### 5. Samakan aturan di chatbot
Tambahkan aturan negasi + skala personal ke system prompt `src/routes/api/public/consultant-chat.ts` agar AI chat tidak menyarankan fitur bertim pada bisnis personal.

## Hasil yang diharapkan

Untuk brief seperti Rina: rekomendasi jatuh ke fitur yang benar-benar relevan pada alur florist personal (mis. Galeri/Portfolio produk, Maps lokasi, Testimonial, Form pesanan custom) — dan **Multi User Management tidak muncul lagi**.

## Catatan teknis

- File disentuh: `src/lib/admin/consultant-library.ts`, `src/lib/order-brief-insight.ts`, `src/routes/api/public/consultant-chat.ts`.
- Tidak mengubah struktur PDF, data Order Brief, package logic, atau harga.
- Verifikasi: typecheck bersih + uji ulang logic dengan data brief florist personal (harus 0 fitur bertim).
