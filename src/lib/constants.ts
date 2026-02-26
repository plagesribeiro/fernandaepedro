export const WEDDING = {
  bride: "Fernanda",
  groom: "Pedro",
  date: new Date("2026-08-08T16:00:00-03:00"),
  dateDisplay: "08 · Agosto · 2026",
  venue: {
    name: "Palácio das Mangabeiras",
    address: "R. Professor Djalma Guimarães, 161 - Mangabeiras",
    city: "Belo Horizonte, MG",
    fullAddress:
      "R. Professor Djalma Guimarães, 161 - Mangabeiras, Belo Horizonte - MG",
  },
  schedule: [
    { time: "16:00", event: "Cerimônia", description: "Celebração do nosso amor com a bênção de Deus e a presença dos que amamos" },
    { time: "18:00", event: "Recepção", description: "Coquetel e jantar para celebrar juntos este momento especial" },
    { time: "21:00", event: "Festa", description: "Música, dança e muita alegria para fechar a noite com chave de ouro" },
  ],
  gallery: [
    "/images/gallery/1.jpg",
    "/images/gallery/2.jpg",
    "/images/gallery/3.jpg",
    "/images/gallery/4.jpg",
    "/images/gallery/5.jpg",
    "/images/gallery/6.jpg",
    "/images/gallery/7.jpg",
    "/images/gallery/8.jpg",
    "/images/gallery/20241114_175429.jpg",
    "/images/gallery/20250417_105341.jpg",
    "/images/gallery/20250425_211340.jpg",
    "/images/gallery/20250503_095108.jpg",
    "/images/gallery/20250510_203357.jpg",
    "/images/gallery/20250618_203207.jpg",
    "/images/gallery/20250703_190055.jpg",
    "/images/gallery/20250729_152822.jpg",
    "/images/gallery/20260105_160005.jpg",
    "/images/gallery/20260106_175528.jpg",
    "/images/gallery/20260106_175540.jpg",
    "/images/gallery/20260106_181905.jpg",
  ],
} as const;

export const SECTIONS = [
  { id: "inicio", label: "Início" },
  { id: "cerimonia", label: "O Grande Dia" },
  { id: "presenca", label: "Confirmação" },
  { id: "presentes", label: "Presentes" },
  { id: "galeria", label: "Galeria" },
] as const;

export const GIFT_CATEGORIES = [
  "Todos",
  "Cozinha",
  "Casa",
  "Eletrônicos",
  "Experiências",
] as const;
