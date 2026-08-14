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

# Consultant Engine V8 — Proposal Generator 1:1 Mirror Order Brief (Closing Ready)

&nbsp;

## Tujuan Utama

&nbsp;

Proposal KERJAKU harus menjadi dokumen penjualan yang berasal langsung dari Order Brief Final.

&nbsp;

Order Brief adalah:

- sumber keputusan konsultasi,

- sumber package,

- sumber fitur,

- sumber potential recommendation.

&nbsp;

Proposal bukan mesin konsultasi baru.

&nbsp;

Proposal hanya mengubah hasil Order Brief menjadi dokumen sales/proposal yang lebih persuasif.

&nbsp;

PRINSIP UTAMA:

&nbsp;

ORDER BRIEF

(Source of Truth)

        |

        ↓

INSIGHT ENGINE

        |

        ↓

PROPOSAL PDF

(Mirror + Sales Document)

&nbsp;

&nbsp;

Proposal tidak boleh memiliki logic rekomendasi fitur sendiri.

&nbsp;

&nbsp;

================================================

&nbsp;

## 1. SATU SUMBER KEBENARAN (WAJIB)

&nbsp;

&nbsp;

Hapus ketergantungan proposal terhadap:

&nbsp;

- recommendPackage() sendiri

- buildEnhancements() sendiri

- library fitur proposal terpisah

&nbsp;

&nbsp;

Proposal wajib mengambil dari:

&nbsp;

- buildBriefInsight()

- Order Brief Final

- Industry Context Library

&nbsp;

&nbsp;

Mapping:

&nbsp;

&nbsp;

PACKAGE:

&nbsp;

Proposal Package

=

Order Brief Package Recommendation

&nbsp;

&nbsp;

CORE SOLUTION:

&nbsp;

Proposal Core Solution

=

Feature List Order Brief

&nbsp;

&nbsp;

POTENTIAL FEATURE:

&nbsp;

Proposal Feature Recommendation

=

Potential Feature Recommendation Order Brief

&nbsp;

&nbsp;

Tidak boleh menambah fitur baru.

&nbsp;

&nbsp;

================================================

&nbsp;

# 2. PROPOSAL PACKAGE HARUS IDENTIK

&nbsp;

&nbsp;

Contoh:

&nbsp;

&nbsp;

Order Brief:

&nbsp;

Business System

&nbsp;

&nbsp;

Proposal:

&nbsp;

Business System

&nbsp;

&nbsp;

Jangan mengubah menjadi:

&nbsp;

- Digital Workflow Solution

- Digital Transformation System

- Smart Business Solution

&nbsp;

&nbsp;

Nama paket harus sama.

&nbsp;

&nbsp;

Jika ingin nama marketing:

&nbsp;

Format:

&nbsp;

&nbsp;

PACKAGE:

&nbsp;

Business System

&nbsp;

&nbsp;

SOLUTION NAME:

&nbsp;

Business System untuk Furniture & Interior Custom Workshop

&nbsp;

&nbsp;

Package tetap sama.

&nbsp;

&nbsp;

================================================

&nbsp;

# 3. FEATURE MIRROR RULE

&nbsp;

&nbsp;

Proposal wajib melakukan pengecekan:

&nbsp;

&nbsp;

Feature List Brief:

&nbsp;

✓ Galeri Portfolio

✓ FAQ

✓ Pencatatan Project

✓ Status Tracking

&nbsp;

&nbsp;

Proposal harus sama.

&nbsp;

&nbsp;

Tidak boleh:

&nbsp;

Tambah:

- WhatsApp

- Contact Form

- Booking

&nbsp;

Jika tidak ada di Brief.

&nbsp;

&nbsp;

Tidak boleh:

&nbsp;

Menghapus fitur.

&nbsp;

&nbsp;

================================================

&nbsp;

# 4. POTENTIAL FEATURE MIRROR RULE

&nbsp;

&nbsp;

Potential Feature Proposal:

&nbsp;

=

Potential Feature Brief

&nbsp;

&nbsp;

Termasuk:

&nbsp;

&nbsp;

- Nama fitur

- Prioritas

- Fase

- Kenapa relevan

- Dampak

- Kaitan bisnis

&nbsp;

&nbsp;

Contoh:

&nbsp;

&nbsp;

Brief:

&nbsp;

Invoice & Nota Digital

&nbsp;

&nbsp;

Proposal:

&nbsp;

Invoice & Nota Digital

&nbsp;

&nbsp;

Bukan:

&nbsp;

Payment Gateway

Billing System

Financial Automation

&nbsp;

&nbsp;

Jangan mengubah nama.

&nbsp;

&nbsp;

================================================

&nbsp;

# 5. PROPOSAL TIDAK BOLEH PUNYA FEATURE LIBRARY SENDIRI

&nbsp;

&nbsp;

Proposal hanya formatter.

&nbsp;

&nbsp;

Jika feature tidak ada di Order Brief:

&nbsp;

Jangan tampilkan.

&nbsp;

&nbsp;

Kecuali:

&nbsp;

fitur internal pricing admin pada Investment.

&nbsp;

&nbsp;

================================================

&nbsp;

# 6. CORE SOLUTION PENULISAN ULANG

&nbsp;

&nbsp;

Core Solution bukan hanya nama paket.

&nbsp;

&nbsp;

Format:

&nbsp;

&nbsp;

CORE SOLUTION

&nbsp;

&nbsp;

Business System

&nbsp;

&nbsp;

Tujuan:

&nbsp;

1 paragraf menjelaskan solusi bisnis.

&nbsp;

&nbsp;

Included Feature:

&nbsp;

&nbsp;

✓ Nama fitur

&nbsp;

Deskripsi:

Manfaat bisnis dan masalah yang diselesaikan.

&nbsp;

&nbsp;

Contoh:

&nbsp;

&nbsp;

Manajemen Project

&nbsp;

Membantu owner mencatat project furniture custom dari customer masuk sampai pengerjaan.

&nbsp;

&nbsp;

Tracking Progress

&nbsp;

Membantu customer mengetahui perkembangan project tanpa harus bertanya manual.

&nbsp;

&nbsp;

Jangan gunakan:

&nbsp;

&nbsp;

"Sesuai kebutuhan client pada Order Brief."

&nbsp;

&nbsp;

Itu terlalu kosong.

&nbsp;

&nbsp;

================================================

&nbsp;

# 7. BUSINESS PROBLEM → SOLUTION MAPPING

&nbsp;

&nbsp;

Tambahkan section:

&nbsp;

&nbsp;

BUSINESS PROBLEM & SOLUTION MAPPING

&nbsp;

&nbsp;

Format:

&nbsp;

&nbsp;

Masalah Customer | Solusi

&nbsp;

&nbsp;

Contoh:

&nbsp;

&nbsp;

Portfolio tersebar di WhatsApp dan Instagram

&nbsp;

↓

&nbsp;

Galeri Portfolio

&nbsp;

&nbsp;

Customer sering bertanya progress

&nbsp;

↓

&nbsp;

Status Tracking

&nbsp;

&nbsp;

Pencatatan project manual

&nbsp;

↓

&nbsp;

Manajemen Project

&nbsp;

&nbsp;

Tujuan:

&nbsp;

Customer melihat bahwa KERJAKU memahami masalah mereka.

&nbsp;

&nbsp;

================================================

&nbsp;

# 8. POTENTIAL FEATURE HARUS UNTUK CLOSING