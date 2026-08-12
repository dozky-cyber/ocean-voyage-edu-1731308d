# Link Download WhatsApp Jadi Pendek & Rapi

Masalah di screenshot: WhatsApp tidak mendukung format link markdown `[Teks](url)`, jadi teksnya tampil apa adanya dan URL signed Supabase yang sangat panjang tetap kelihatan. Klik pada label juga tidak mungkin — WhatsApp hanya bisa membuat URL polos jadi bisa diklik.

Solusi: hilangkan URL panjang dengan membuat link pendek milik KERJAKU sendiri yang namanya mengikuti nama customer, lalu link pendek itulah yang dikirim (bisa langsung diklik, dan saat dibuka otomatis mengunduh PDF).

Hasil di WhatsApp:

```text
📎 Order Brief:
Order_Brief_KERJAKU_Candra.pdf

📥 Download PDF:
https://kerjaku.space/d/order-brief-kerjaku-candra
```

## Yang dibangun

1. **Tabel link pendek** (`document_links`): slug, bucket, storage path, nama file, lead/conversation, tanggal dibuat. RLS: hanya admin yang boleh membuat/melihat; pembacaan untuk redirect dilakukan server-side.
2. **Slug otomatis dari nama brief**: `order-brief-kerjaku-candra`. Kalau slug sudah dipakai untuk brief lain, ditambah sufiks pendek (`-2`, `-a1b2`) supaya tetap unik dan tetap terbaca.
3. **Route publik `/d/{slug}`**: server membuat signed URL baru saat diklik, lalu redirect ke file PDF. Karena signed URL dibuat on-demand, link pendek tidak pernah kedaluwarsa dan customer selalu bisa membuka file.
4. **Pesan WhatsApp**: label markdown dihapus, diganti URL pendek polos supaya benar-benar bisa diklik di WhatsApp. Nama file tetap `Order_Brief_KERJAKU_[Nama].pdf`.
5. **UI admin**: tombol "Copy Link PDF" dan riwayat pengiriman ikut memakai link pendek.

## Catatan teknis

- Perubahan pada: `src/lib/order-brief.ts` (template pesan), `src/lib/order-brief.server.ts` (upload + daftar slug), `src/lib/order-brief.functions.ts` (`prepareOrderBriefFile` mengembalikan short URL), route baru `src/routes/d.$slug.tsx` (redirect server), dan migrasi tabel `document_links` + GRANT + RLS.
- Email tetap format lama; hanya nilai URL-nya ikut menjadi link pendek.
- Logic AI Consultant, generate PDF, penanggalan brief, versi V1/V2, dan CRM flow tidak diubah.

## Tidak diubah

- Desain PDF, waktu/tanggal brief, delivery history, status pipeline.
