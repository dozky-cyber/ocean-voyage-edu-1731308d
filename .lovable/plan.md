# Lanjutkan Order Brief PDF — Render "Alasan Relevansi Bisnis"

Permintaan asli "AI RECOMMENDATION LOGIC — ORDER BRIEF PROTECTION RULE V1" (#215) gagal terselesaikan sebelum typecheck. Bagian 1–4 (source of truth, package ceiling, improvement rule, optional feature rule) sudah lengkap di `src/lib/order-brief-insight.ts`. Yang tertinggal adalah Bagian 5C pada PDF.

## Status saat ini (diverifikasi)

`order-brief-insight.ts` sudah benar:
- `BriefInsight.optional` = `{ name, description, reason }[]` (alasan bisnis per fitur).
- Package ceiling, anti-duplicate, restricted-feature gating semua sudah jalan.

`order-brief-pdf.ts` `aiRecommendation()` (baris 303–317) saat ini hanya merender per fitur opsional:
- nama fitur
- label `DESKRIPSI` + `item.description`

**Baris `item.reason` ("Alasan relevansi bisnis") belum dirender sama sekali.** Inilah yang membuat Bagian 5C tidak lengkap.

## Yang akan dikerjakan

Satu edit kecil di `src/lib/order-brief-pdf.ts`, di blok `insight.optional.forEach(...)`:

Setelah paragraf `DESKRIPSI` + `item.description` (baris ~310), tambahkan:
- label `ALASAN RELEVANSI` (7pt, MUTED)
- paragraf `item.reason` (10pt, INK, lebar `CONTENT_W - 14`)

Sesuai contoh di permintaan asli: setiap fitur opsional menampilkan *Nama → Deskripsi manfaat → Alasan relevansi bisnis*. Tidak ada data lain yang diubah. Urutan section, included scope, disclaimer, dan seluruh Order Brief data tetap.

## Verifikasi

1. `tsgo` typecheck bersih (tidak ada error).
2. PDF lama tidak pecah: pastikan `doc.ensure(...)` cukup untuk ruang alasan agar tidak overflow ke footer/halaman. Tingkatkan margin `doc.ensure(56)` → sekitar `doc.ensure(80)` untuk akomodasi 1–2 baris alasan.

## Catatan teknis

- File disentuh: hanya `src/lib/order-brief-pdf.ts`.
- Tidak mengubah `order-brief-insight.ts` (sudah benar), tidak mengubah data Order Brief, tidak mengubah struktur PDF utama.
- Tidak ada publish.
