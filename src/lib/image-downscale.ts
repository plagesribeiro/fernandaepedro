// Client-side: detecta HEIC, converte pra JPEG via heic2any, depois redimensiona
// pra no máx. 1024px no lado maior usando OffscreenCanvas (com fallback pra <canvas>).
// Devolve dataURL pronto pra mandar no JSON do /api/ai/image.

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export interface DownscaleOptions {
  maxSide?: number;
  quality?: number;
  /** MIME do resultado. Default: image/jpeg (menor que PNG, suficiente como referência). */
  mime?: "image/jpeg" | "image/png" | "image/webp";
}

export class HeicConversionError extends Error {
  constructor() {
    super(
      "Não consegui ler essa foto HEIC. Tira um screenshot ou ative 'Mais compatível' em Ajustes › Câmera › Formatos."
    );
    this.name = "HeicConversionError";
  }
}

export class ImageTooBigError extends Error {
  constructor() {
    super("Imagem grande demais. Use uma menor que 20 MB.");
    this.name = "ImageTooBigError";
  }
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.includes("heic") || type.includes("heif")) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

async function ensureRasterBlob(input: File | Blob): Promise<Blob> {
  if (input instanceof File && isHeic(input)) {
    try {
      // heic2any é só import dinâmico — bundle pesado fica fora do main chunk.
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({
        blob: input,
        toType: "image/jpeg",
        quality: 0.9,
      });
      // heic2any retorna Blob ou Blob[] dependendo das frames.
      if (Array.isArray(out)) return out[0] ?? new Blob([], { type: "image/jpeg" });
      return out;
    } catch (err) {
      console.error("[image-downscale] heic2any failed:", err);
      throw new HeicConversionError();
    }
  }
  return input;
}

async function bitmapFromBlob(blob: Blob): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number) => void;
  close?: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bm = await createImageBitmap(blob);
    return {
      width: bm.width,
      height: bm.height,
      draw: (ctx, w, h) => ctx.drawImage(bm, 0, 0, w, h),
      close: () => bm.close?.(),
    };
  }
  // Fallback raríssimo: usa HTMLImageElement.
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    };
  } finally {
    // a URL pode ser revogada após desenhar; mas como precisa sobreviver até draw, deixamos vazar
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function downscaleImage(
  file: File,
  opts: DownscaleOptions = {}
): Promise<string> {
  const { maxSide = 1024, quality = 0.85, mime = "image/jpeg" } = opts;

  if (file.size > MAX_FILE_BYTES) throw new ImageTooBigError();

  const raster = await ensureRasterBlob(file);
  const { width, height, draw, close } = await bitmapFromBlob(raster);

  const longest = Math.max(width, height);
  const scale = longest > maxSide ? maxSide / longest : 1;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  let outBlob: Blob;
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem contexto 2D no OffscreenCanvas");
    draw(ctx, w, h);
    outBlob = await canvas.convertToBlob({ type: mime, quality });
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Sem contexto 2D no canvas");
    draw(ctx, w, h);
    outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))),
        mime,
        quality
      );
    });
  }

  close?.();
  return blobToDataUrl(outBlob);
}
