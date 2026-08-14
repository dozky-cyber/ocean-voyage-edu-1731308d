# Audit Order Brief vs Proposal + Perbaikan Generator Proposal (Universal)

Hasil audit dua PDF (Tobiin / Fadly Furniture Interior) dibandingkan langsung dengan kode generator.

## Temuan audit (semua sudah diverifikasi di kode + PDF)

1. **Paket rekomendasi tidak match.** Brief: `Business System`. Proposal: `Digital Workflow Solution`.
   Penyebab: proposal memakai penebak kata kunci sendiri (`recommendPackage` di `sales-ai.ts`) yang mengabaikan keputusan paket Order Brief (SOP Package Decision Engine).
2. **Feature Recommendation tidak mirror.** Brief menghasilkan 5 potential feature relevan (Notifikasi Progress Otomatis, Riwayat Project, Form Konsultasi, Invoice & Nota Digital, Database Customer) lengkap dengan alasan relevansi, dampak bisnis, kaitan alur bisnis, prioritas, dan fase.
   Proposal justru memunculkan WhatsApp, Contact Form, Form Konsultasi, Booking/Reservasi — dari library lain (`buildEnhancements`), tanpa alasan bisnis, tanpa fase, dan sebagian tidak relevan.
3. **Duplicate logic di PDF proposal.** Daftar enhancement yang sama dicetak dua kali: sekali sebagai "Feature Recommendation" dan sekali lagi sebagai "Optional Feature" di dalam Investment.
4. **Core Solution memakai kalimat template.** Tiga dari empat fitur hanya tertulis "Sesuai kebutuhan yang disampaikan client pada Order Brief", dan satu deskripsi salah konteks ("Pencatatan Project / Order → Customer dapat melakukan pemesanan melalui website"). Nama fitur juga tidak memakai kosakata industri yang sudah dipakai brief (Manajemen Project, Tracking Progress Pengerjaan).
5. **Recommended Solution generic.** Isinya hanya satu kalimat "menyelesaikan portfolio tersebar di wa dan ig melalui alur kerja terpusat…" plus satu benefit paket. Tidak ada peta masalah → solusi seperti di brief.
6. **Bagian penting dari brief hilang di proposal:** Business Readiness (tahap bisnis) dan Peta Masalah & Solusi, serta pembagian Fase 1 / Fase 2.
7. **Teks terpotong di PDF proposal.** Client card menampilkan "Furniture & Interior Custom Workshop (Fadly Furniture" (terpotong), judul proposal juga terpotong satu baris.
8. **Branding tidak konsisten.** Header brief "TEAM KERJAKU CONSULTANT", header proposal "BUSINESS SYSTEM CONSULTANT".
9. **Project Timeline tipis.** Hanya menyalin "1 bulan" tanpa tahapan kerja; brief punya konteks alur industri yang bisa dipakai.
10. **Catatan investasi terbaca kasar** ("Rekomendasi: sesuaikan scope fase pertama agar masuk range ini") — bahasa internal, bukan bahasa client. (Angka tetap bisa diedit manual.)

## Rencana perbaikan

### A. Satu sumber kebenaran: Order Brief Insight
Proposal berhenti memakai mesin tebakannya sendiri dan mengambil hasil `buildBriefInsight` (mesin yang sama dengan PDF Order Brief):

- Paket = paket hasil SOP Order Brief (fallback hanya jika brief tidak ada).
- Core Solution = Feature List brief, verbatim, dengan nama & deskripsi versi industri yang sama dengan brief.
- Feature Recommendation = Potential Feature brief (nama, alasan relevansi, dampak bisnis, kaitan alur bisnis, prioritas, fase) — 1:1, tidak menambah/mengurangi.
- Business Problem, Client Requirement, Timeline, Budget = langsung dari brief final.

### B. Struktur PDF proposal baru (berlaku untuk semua industri)
Urutan final, tanpa pengulangan:

1. Cover
2. About KERJAKU
3. Client Requirement (ringkasan bisnis + tujuan + kebutuhan admin/team dari brief)
4. Business Problem
5. Feature List (Order Brief) — verbatim
6. Recommended Solution — alasan paket + peta Masalah → Solusi (tabel, sama seperti brief) + Business Readiness singkat
7. Core Solution — fitur brief + deskripsi berbasis industri
8. Feature Recommendation — potential feature brief dengan alasan/dampak/kaitan + Prioritas & Fase, harga per item
9. Project Timeline — timeline brief + estimasi KERJAKU + deadline produksi (logika sekarang dipertahankan)
10. Investment — Core Solution (subtotal) + Optional Feature (hanya baris nama + harga, deskripsi tidak diulang) + Total
11. Payment Terms
12. Next Steps — selaras dengan closing brief (konfirmasi scope → pengecekan kebutuhan → kesepakatan → kick-off)

Anti-duplikasi: penjelasan panjang fitur hanya muncul sekali (di Feature Recommendation); tabel Investment hanya angka.

### C. Kualitas dokumen
- Perbaiki pemotongan teks: nama client dan judul proposal dibuat wrap multi-baris, bukan dipotong.
- Branding header proposal disamakan: "TEAM KERJAKU CONSULTANT".
- Blok fitur tidak boleh terbelah antar halaman (aturan yang sudah dipakai di PDF brief).
- Catatan investasi ditulis dengan bahasa konsultatif, tidak menyebut instruksi internal.

### D. Universal, bukan khusus furniture
Semua kalimat dihasilkan oleh Industry Context Library yang sudah ada (21 industri) + fallback netral, sehingga laundry, klinik, kuliner, retail, dsb. mendapat proposal dengan struktur dan kualitas yang sama.

### E. Verifikasi
- Tes regresi baru: untuk minimal 5 industri berbeda, pastikan paket proposal == paket brief, feature list identik, potential feature identik, dan tidak ada teks duplikat antar section.
- QA render PDF (brief + proposal berdampingan) untuk kasus Tobiin dan 2 industri lain: cek tidak ada teks terpotong, tidak ada section terbelah, dan seluruh isi relevan.

## Catatan teknis

- File utama: `src/lib/admin/sales-ai.ts` (`buildProposalSections`, `recommendPackage`), `src/lib/admin/proposal-logic.ts` (`buildCoreFeatures`, `buildEnhancements`), `src/lib/admin.server.ts` (`createProposalForLead`), `src/lib/proposal-doc.ts` (tipe data), `src/lib/proposal-pdf.ts` (render).
- Ditambahkan sumber bersama dari `src/lib/order-brief-insight.ts` + `src/lib/admin/industry-context.ts`.
- Tipe `ProposalDocData` diperluas: `problemMap`, `readiness`, `packageRationale`, dan enhancement mendapat `reason`, `impact`, `relation`, `priority`, `phase`.
- Angka harga tetap seperti sekarang dan tetap bisa diedit manual di halaman admin proposal.
