import { z } from "zod";

/** Shared (client-safe) validation schema for the consultation form. */
export const consultationFormSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp tidak valid")
    .max(25)
    .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp hanya boleh angka"),
  projectType: z.string().trim().min(1, "Pilih jenis project").max(80),
  requirement: z.string().trim().min(10, "Ceritakan kebutuhan minimal 10 karakter").max(2000),
  budget: z.string().trim().min(1, "Pilih estimasi budget").max(80),
  timeline: z.string().trim().min(1, "Pilih target waktu").max(80),
  businessName: z.string().trim().max(120).optional().or(z.literal("")),
  features: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ConsultationForm = z.infer<typeof consultationFormSchema>;
