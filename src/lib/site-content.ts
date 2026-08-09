/**
 * Centralized content for the KERJAKU experience.
 * All copy/data lives here so text and assets can be swapped in
 * without touching layout or animation code.
 */

export type Grade = "Products" | "Experiments";

export const brand = {
  name: "KERJAKU",
  tagline: "DIGITAL PRODUCT JOURNEY",
  motto: "Work, made your way.",
};

export const grades: {
  id: Grade;
  label: string;
  full: string;
  description: string;
}[] = [
  {
    id: "Products",
    label: "Products",
    full: "Shipped & Live",
    description: "Produk digital yang sudah berjalan dan dipakai dalam pekerjaan nyata.",
  },
  {
    id: "Experiments",
    label: "Experiments",
    full: "In The Lab",
    description: "Eksperimen AI, automation, dan tools kecil yang sedang saya uji.",
  },
];

export const hero = {
  eyebrow: "Digital Product Journey",
  title: "Work, made your way.",
  subtitle:
    "Ruang untuk merancang ide, membangun sistem, dan menciptakan produk digital yang membantu menyelesaikan masalah nyata.",
  primaryCta: "Explore My Work",
  secondaryCta: "About Me",
};

export const pastel = {
  eyebrow: "Ideas",
  title: "Ideas Behind The Build",
  subtitle: "Every product starts with a problem worth solving.",
  body: "Setiap produk dimulai dari memahami masalah, kebutuhan pengguna, dan mencari solusi yang tepat.",
  fragments: [
    { label: "Problem Discovery", note: "Menemukan akar masalah" },
    { label: "Research", note: "Data & konteks kerja" },
    { label: "User Needs", note: "Kebutuhan pengguna" },
    { label: "Ideas", note: "Solusi yang mungkin" },
  ],
};

export type WorldId = "web" | "automation" | "ai" | "data";

export const worlds: {
  id: WorldId;
  title: string;
  subtitle: string;
  body: string;
  depth: string;
  points: string[];
}[] = [
  {
    id: "web",
    title: "Web Application",
    subtitle: "Antarmuka Kerja",
    body: "Aplikasi web yang ringan, cepat, dan nyaman dipakai setiap hari di lapangan maupun kantor.",
    depth: "-120 m",
    points: [
      "Dashboard dan form kerja harian",
      "Responsif untuk mobile dan desktop",
      "Autentikasi dan hak akses pengguna",
      "Integrasi dengan data yang sudah ada",
    ],
  },
  {
    id: "automation",
    title: "Automation",
    subtitle: "Alur Otomatis",
    body: "Menghapus pekerjaan berulang dengan alur kerja otomatis yang berjalan di belakang layar.",
    depth: "-260 m",
    points: [
      "Laporan otomatis terjadwal",
      "Notifikasi dan follow-up",
      "Sinkronisasi antar sistem",
      "Template dokumen instan",
    ],
  },
  {
    id: "ai",
    title: "AI Integration",
    subtitle: "Lapisan Cerdas",
    body: "Menambahkan lapisan AI untuk merangkum, menganalisis, dan memberi rekomendasi kerja.",
    depth: "-410 m",
    points: [
      "Ringkasan aktivitas otomatis",
      "Insight dari catatan lapangan",
      "Asisten tanya jawab internal",
      "Klasifikasi dan pelabelan data",
    ],
  },
  {
    id: "data",
    title: "Data System",
    subtitle: "Fondasi Data",
    body: "Struktur data yang rapi agar setiap keputusan berdiri di atas informasi yang bisa dipercaya.",
    depth: "-560 m",
    points: [
      "Skema database yang terstruktur",
      "Riwayat dan jejak perubahan",
      "Visualisasi kemajuan pekerjaan",
      "Ekspor data untuk pelaporan",
    ],
  },
];

export const systems = {
  eyebrow: "Systems",
  title: "Systems & Solutions",
  body: "Mengubah ide menjadi sistem digital yang dapat digunakan dalam pekerjaan dan kehidupan sehari-hari.",
};

export const products = {
  eyebrow: "Products",
  title: "Products I Build",
  body: "Beberapa produk digital yang sedang dan telah saya kembangkan.",
};

export type Project = {
  name: string;
  category: string;
  description: string;
  status?: string;
  focus?: string[];
};

export const projects: Record<Grade, Project[]> = {
  Products: [
    {
      name: "RO MEMORY",
      category: "Field Activity Intelligence System",
      description:
        "Sistem digital untuk mengelola workshop, aktivitas visit, laporan, follow-up, dan insight kerja dengan bantuan AI.",
      status: "LIVE",
    },
    {
      name: "MATERIAL ESTIMATOR",
      category: "Furniture & Interior Material Planning",
      description:
        "Aplikasi untuk membantu menghitung kebutuhan material furniture dan interior berdasarkan ukuran pekerjaan, sehingga proses perencanaan bahan menjadi lebih cepat, akurat, dan terstruktur.",
      focus: [
        "Material calculation",
        "Furniture planning",
        "Quantity estimation",
        "Material requirement planning",
      ],
    },
    {
      name: "DOMPET GUE",
      category: "Personal Finance Workspace",
      description:
        "Aplikasi pengelolaan keuangan pribadi untuk membantu pencatatan, monitoring, dan memahami kondisi finansial.",
    },
  ],
  Experiments: [
    {
      name: "AI ASSISTANT",
      category: "Conversational Work Helper",
      description:
        "Eksperimen asisten yang merangkum catatan kerja dan menyusun langkah tindak lanjut secara bertahap.",
    },
    {
      name: "WORKFLOW AUTOMATION",
      category: "Background Process Lab",
      description:
        "Uji coba alur otomatis untuk laporan terjadwal, pengingat, dan sinkronisasi data antar aplikasi.",
    },
    {
      name: "SMART TOOLS",
      category: "Micro Utilities",
      description:
        "Kumpulan tool kecil yang menyelesaikan satu masalah spesifik dengan cepat dan tanpa konfigurasi rumit.",
    },
  ],
};

export const profile = {
  eyebrow: "Profile",
  title: "Digital Product Builder",
  body: "Membangun aplikasi, sistem kerja, dan pengalaman digital melalui web technology, AI, dan automation.",
  name: "Adji Taufiq",
  caption: "Adji Taufiq",
  skills: ["Web Technology", "AI", "Automation", "Data & Systems"],
};

export const ai = {
  eyebrow: "Intelligence",
  title: "AI & Automation",
  body: "Mengeksplorasi bagaimana teknologi AI dapat membantu manusia bekerja lebih cepat, sederhana, dan efektif.",
  portraitCaption: "Adji Taufiq — Digital Product Builder",
  cards: [
    { title: "AI Assistant", note: "Pendamping kerja yang menjawab dan merangkum." },
    { title: "Workflow Automation", note: "Proses berulang berjalan sendiri." },
    { title: "Smart Tools", note: "Tool kecil, dampak besar." },
  ],
  examples: [
    "Bagaimana AI membantu laporan lapangan?",
    "Otomatiskan follow-up pekerjaan mingguan",
    "Rancang sistem estimasi material",
    "Ide fitur untuk aplikasi keuangan pribadi",
  ],
  benefits: [
    "Proses kerja lebih cepat",
    "Keputusan berbasis data",
    "Lebih sedikit pekerjaan manual",
  ],
};

export const finalCta = {
  eyebrow: "Closing",
  title: "Keep Building",
  body: "Setiap ide memiliki kesempatan untuk menjadi sesuatu yang berguna.",
  primary: "Let's Connect",
  secondary: "Explore My Work",
};

export const workPanel: Record<Grade, { subject: string; topics: string[] }[]> = {
  Products: [
    {
      subject: "RO MEMORY",
      topics: ["Workshop & visit", "Laporan lapangan", "Follow-up otomatis", "AI insight kerja"],
    },
    {
      subject: "MATERIAL ESTIMATOR",
      topics: [
        "Material calculation",
        "Furniture planning",
        "Quantity estimation",
        "Material requirement planning",
      ],
    },
    {
      subject: "DOMPET GUE",
      topics: ["Pencatatan harian", "Monitoring arus kas", "Kategori pengeluaran", "Ringkasan bulanan"],
    },
    {
      subject: "Fondasi Teknis",
      topics: ["Web application", "Automation", "AI integration", "Data system"],
    },
  ],
  Experiments: [
    {
      subject: "AI Assistant",
      topics: ["Ringkasan catatan", "Tanya jawab internal", "Saran tindak lanjut", "Bahasa sederhana"],
    },
    {
      subject: "Workflow Automation",
      topics: ["Laporan terjadwal", "Pengingat pekerjaan", "Sinkronisasi data", "Template instan"],
    },
    {
      subject: "Smart Tools",
      topics: ["Kalkulator cepat", "Konversi data", "Checklist kerja", "Pencatat ide"],
    },
    {
      subject: "Next Up",
      topics: ["Mobile companion", "Offline mode", "Analitik lanjutan", "Integrasi pihak ketiga"],
    },
  ],
};

export const processSteps = [
  {
    title: "1. Pahami masalahnya",
    body: "Mulai dari masalah nyata di pekerjaan: apa yang lambat, berulang, atau mudah salah.",
  },
  {
    title: "2. Riset & kebutuhan pengguna",
    body: "Kumpulkan konteks, data, dan cara kerja pengguna sebelum menulis satu baris kode.",
  },
  {
    title: "3. Rancang sistemnya",
    body: "Susun alur, struktur data, dan antarmuka yang paling sederhana untuk menyelesaikan masalah.",
  },
  {
    title: "4. Bangun & otomatisasi",
    body: "Kembangkan aplikasi, tambahkan automation dan lapisan AI di titik yang benar-benar membantu.",
  },
  {
    title: "5. Pakai, ukur, perbaiki",
    body: "Gunakan produknya di pekerjaan sehari-hari, ukur hasilnya, lalu perbaiki secara bertahap.",
  },
];

/** Deterministic local demo response — no external AI call is made. */
export function buildDemoAnswer(question: string, grade: Grade): string[] {
  const q = question.trim().replace(/\s+/g, " ");
  const topic = q.replace(/[?.!]+$/, "");
  return [
    `Konteks ${grade}: "${topic}" bisa didekati lewat tiga lapisan, dari masalah sampai produk yang berjalan.`,
    `Lapisan 1 — Permukaan: rumuskan masalahnya dalam satu kalimat dan tentukan siapa penggunanya.`,
    `Lapisan 2 — Sistem: petakan alur kerja dan data yang dibutuhkan, lalu cari bagian yang bisa diotomatiskan.`,
    `Lapisan 3 — Produk: bangun versi terkecil yang bisa dipakai, ukur hasilnya, lalu iterasi.`,
    `Catatan: jawaban ini adalah demo lokal KERJAKU, bukan hasil dari layanan AI eksternal.`,
  ];
}
