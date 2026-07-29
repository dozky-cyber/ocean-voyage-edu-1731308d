/**
 * Centralized content for the EDU CHANCE experience.
 * All copy/data lives here so legacy EDU CHANCE text and assets can be
 * swapped in without touching layout or animation code.
 */

export type Grade = "SMP" | "SMA";

export const brand = {
  name: "EDU CHANCE",
  tagline: "PELUANG",
  motto: "Pelayaran belajar tanpa batas",
};

export const grades: {
  id: Grade;
  label: string;
  full: string;
  description: string;
}[] = [
  {
    id: "SMP",
    label: "SMP",
    full: "Sekolah Menengah Pertama",
    description: "Dasar kuat, rasa ingin tahu tumbuh. Materi kelas 7 sampai 9.",
  },
  {
    id: "SMA",
    label: "SMA",
    full: "Sekolah Menengah Atas",
    description: "Pendalaman dan arah masa depan. Materi kelas 10 sampai 12.",
  },
];

export const hero = {
  eyebrow: "Ekspedisi Belajar Interaktif",
  title: "PELUANG",
  subtitle:
    "Selami samudra pengetahuan bersama EDU CHANCE. Satu pelayaran sinematik yang membawamu dari permukaan menuju harta karun ilmu di dasar laut.",
  primaryCta: "Mulai Menjelajah",
  secondaryCta: "Pelajari Cara Kerja",
};

export const pastel = {
  eyebrow: "Dunia Kedua",
  title: "Serpihan Ilmu yang Melayang",
  body:
    "Setiap arus membawa pecahan pelajaran: buku, kompas, rumus, dan data. Gerakkan layar perlahan dan biarkan pengetahuan mengalir mendekat.",
  fragments: [
    { label: "Buku", note: "Bacaan terkurasi" },
    { label: "Kompas", note: "Arah belajar" },
    { label: "Rumus", note: "Logika & pola" },
    { label: "Data", note: "Jejak kemajuan" },
    { label: "Peta", note: "Rute materi" },
    { label: "Cahaya", note: "Motivasi harian" },
  ],
};

export type WorldId = "materi" | "misi" | "tantangan" | "ai";

export const worlds: {
  id: WorldId;
  title: string;
  subtitle: string;
  body: string;
  depth: string;
}[] = [
  {
    id: "materi",
    title: "Jelajah Materi",
    subtitle: "Palung Pengetahuan",
    body: "Rangkuman tiap mata pelajaran yang disusun bertahap, dari permukaan hingga konsep terdalam.",
    depth: "-120 m",
  },
  {
    id: "misi",
    title: "Misi Pembelajaran",
    subtitle: "Pelayaran Harian",
    body: "Target kecil setiap hari agar kapal belajarmu terus bergerak tanpa kehabisan tenaga.",
    depth: "-260 m",
  },
  {
    id: "tantangan",
    title: "Tantangan & Permainan",
    subtitle: "Harta Karun",
    body: "Kuis, teka-teki, dan permainan cepat untuk menguji pemahaman sambil mengumpulkan pencapaian.",
    depth: "-410 m",
  },
  {
    id: "ai",
    title: "AI Pendamping",
    subtitle: "Lumba-lumba Pemandu",
    body: "Teman belajar yang menjelaskan ulang materi sulit dengan bahasa yang lebih sederhana.",
    depth: "-560 m",
  },
];

export const ai = {
  eyebrow: "Dunia Keempat",
  title: "AI Pendamping Belajar",
  body:
    "Ajukan pertanyaan, dan pendamping akan merangkai penjelasan bertahap. Demo ini berjalan sepenuhnya di perangkatmu — belum terhubung ke layanan AI eksternal.",
  portraitCaption: "Kak Nadia — pendamping belajar EDU CHANCE",
  examples: [
    "Jelaskan fotosintesis dengan bahasa sederhana",
    "Bagaimana cara menghitung luas trapesium?",
    "Buat rencana belajar 7 hari untuk ujian",
    "Apa perbedaan teks eksposisi dan persuasi?",
  ],
  benefits: [
    "Penjelasan bertahap sesuai jenjang",
    "Contoh soal dan pembahasan singkat",
    "Rencana belajar yang realistis",
  ],
};

export const finalCta = {
  eyebrow: "Dunia Kelima",
  title: "Permukaan Baru Menantimu",
  body:
    "Pelayaran selesai, tetapi perjalanan belajarmu baru dimulai. Pilih jenjangmu dan mulai misi pertama hari ini.",
  primary: "Mulai Perjalanan",
  secondary: "Lihat Petunjuk",
};

export const materiPanel: Record<
  Grade,
  { subject: string; topics: string[] }[]
> = {
  SMP: [
    {
      subject: "Matematika",
      topics: ["Bilangan bulat & pecahan", "Aljabar dasar", "Bangun datar & ruang", "Statistika sederhana"],
    },
    {
      subject: "IPA",
      topics: ["Klasifikasi makhluk hidup", "Zat & perubahannya", "Energi dan usaha", "Sistem tubuh manusia"],
    },
    {
      subject: "Bahasa Indonesia",
      topics: ["Teks deskripsi", "Teks prosedur", "Teks laporan observasi", "Puisi rakyat"],
    },
    {
      subject: "IPS",
      topics: ["Interaksi sosial", "Kondisi geografis Indonesia", "Kegiatan ekonomi", "Sejarah kerajaan Nusantara"],
    },
  ],
  SMA: [
    {
      subject: "Matematika",
      topics: ["Fungsi & persamaan kuadrat", "Trigonometri", "Limit dan turunan", "Peluang & statistika"],
    },
    {
      subject: "Fisika",
      topics: ["Kinematika", "Hukum Newton", "Termodinamika", "Gelombang dan optik"],
    },
    {
      subject: "Biologi",
      topics: ["Sel dan jaringan", "Genetika", "Evolusi", "Ekosistem dan lingkungan"],
    },
    {
      subject: "Ekonomi",
      topics: ["Permintaan & penawaran", "Pasar dan harga", "Akuntansi dasar", "Kebijakan fiskal"],
    },
  ],
};

export const petunjukSteps = [
  {
    title: "1. Pilih jenjang",
    body: "Tentukan SMP atau SMA. Semua materi, misi, dan tantangan akan menyesuaikan jenjang yang kamu pilih.",
  },
  {
    title: "2. Gulir untuk menyelam",
    body: "Gerakan gulir mengendalikan seluruh pelayaran. Gulir ke bawah untuk menyelam lebih dalam, gulir ke atas untuk kembali ke permukaan.",
  },
  {
    title: "3. Jelajahi dunia belajar",
    body: "Setiap objek di kedalaman mewakili satu cara belajar: materi, misi harian, tantangan, dan AI pendamping.",
  },
  {
    title: "4. Tanya AI pendamping",
    body: "Tuliskan pertanyaanmu pada kolom AI. Demo lokal akan menyusun kerangka jawaban bertahap sebagai contoh.",
  },
  {
    title: "5. Ulangi dan konsisten",
    body: "Kembali setiap hari, selesaikan satu misi kecil, dan pantau kemajuan pelayaran belajarmu.",
  },
];

/** Deterministic local demo response — no external AI call is made. */
export function buildDemoAnswer(question: string, grade: Grade): string[] {
  const q = question.trim().replace(/\s+/g, " ");
  const topic = q.replace(/[?.!]+$/, "");
  return [
    `Ringkasan untuk jenjang ${grade}: "${topic}" bisa dipahami lewat tiga lapisan, dari gambaran umum sampai penerapan.`,
    `Lapisan 1 — Permukaan: kenali istilah kuncinya dan tuliskan ulang dengan kalimatmu sendiri, maksimal dua kalimat.`,
    `Lapisan 2 — Tengah: cari satu contoh nyata di sekitarmu, lalu hubungkan dengan konsep utamanya.`,
    `Lapisan 3 — Dasar: kerjakan dua soal latihan, lalu jelaskan langkahmu seolah sedang mengajari teman.`,
    `Catatan: jawaban ini adalah demo lokal EDU CHANCE, bukan hasil dari layanan AI eksternal.`,
  ];
}
