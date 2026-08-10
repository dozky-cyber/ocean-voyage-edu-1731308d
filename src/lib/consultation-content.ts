/** Content + option lists for the "Kenapa Memilih KERJAKU" and consultation sections. */

export const aboutKerjaku = {
  eyebrow: "Tentang",
  title: "Tentang KERJAKU",
  body: "KERJAKU adalah layanan digital yang membantu individu, bisnis, dan organisasi membangun website profesional serta solusi digital yang sesuai kebutuhan. Kami fokus menghadirkan website modern, responsive, dan mudah digunakan.",
} as const;

export const processKerjaku = {
  eyebrow: "Proses",
  title: "Cara Kerja KERJAKU",
  steps: [
    { step: "01", title: "Konsultasi", body: "Diskusikan kebutuhan, ide, dan tujuan website." },
    {
      step: "02",
      title: "Perencanaan",
      body: "Menentukan konsep desain, fitur, dan solusi yang sesuai.",
    },
    {
      step: "03",
      title: "Pengembangan",
      body: "Website dibuat dengan teknologi modern sesuai kebutuhan project.",
    },
    {
      step: "04",
      title: "Launch & Support",
      body: "Website siap digunakan dan mendapatkan dukungan setelah pengerjaan.",
    },
  ],
} as const;

export const trustCta = {
  title: "Siap Membuat Website Impian Anda?",
  body: "Diskusikan kebutuhan website Anda bersama KERJAKU dan dapatkan solusi yang sesuai.",
  cta: "Konsultasikan Project Anda",
} as const;

export const whyKerjaku = {
  eyebrow: "Kenapa KERJAKU",
  title: "Kenapa Memilih KERJAKU",
  cards: [
    {
      title: "Solusi Sesuai Kebutuhan",
      body: "Setiap project disesuaikan dengan tujuan bisnis dan kebutuhan client.",
    },
    {
      title: "Desain Modern & Responsive",
      body: "Website optimal digunakan pada desktop maupun mobile.",
    },
    {
      title: "Komunikasi Transparan",
      body: "Client dapat berdiskusi langsung mengenai perkembangan project.",
    },
    {
      title: "Pengembangan Custom",
      body: "Tidak hanya template, fitur dapat dikembangkan sesuai kebutuhan.",
    },
  ],
} as const;

export const consultationSection = {
  eyebrow: "Konsultasi",
  title: "Konsultasikan Project Anda",
  body: "Ceritakan kebutuhan digital Anda. KERJAKU akan mempelajari kebutuhan, masalah, dan ruang lingkup project sebelum menentukan solusi.",
  cta: "Mulai Konsultasi",
} as const;

export const projectTypes = [
  "Website Company Profile",
  "Website Bisnis",
  "Landing Page",
  "Web Application",
  "Aplikasi Custom",
  "Dashboard Sistem",
  "Sistem Operasional",
  "E-Commerce",
  "AI & Automation",
  "Integrasi Sistem",
  "Lainnya",
] as const;

export const budgetOptions = [
  "Sampai Rp500.000",
  "Rp500.000 - Rp1.000.000",
  "Rp1.000.000 - Rp3.000.000",
  "Rp3.000.000 - Rp5.000.000",
  "Rp5.000.000 - Rp10.000.000",
  "Di atas Rp10.000.000",
] as const;

export const timelineOptions = [
  "Secepatnya",
  "1 bulan",
  "2-3 bulan",
  "Lebih dari 3 bulan",
  "Fleksibel",
] as const;
