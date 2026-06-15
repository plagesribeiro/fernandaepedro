import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

async function uploadImage(
  folder: string,
  bytes: Uint8Array,
  mediaType: string
): Promise<{ url: string; mediaType: string }> {
  const normalized = mediaType.toLowerCase();
  const ext = MIME_TO_EXT[normalized] ?? "png";
  const filename = `${folder}/${nanoid(12)}.${ext}`;
  const blob = await put(filename, Buffer.from(bytes), {
    access: "public",
    contentType: normalized,
    addRandomSuffix: false,
  });
  return { url: blob.url, mediaType: normalized };
}

// Imagem gerada pela IA.
export async function uploadGiftImage(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ url: string; mediaType: string }> {
  return uploadImage("gift-images", bytes, mediaType);
}

// Imagem que o convidado enviou do dispositivo como referência no prompt.
export async function uploadInputImage(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ url: string; mediaType: string }> {
  return uploadImage("gift-input-images", bytes, mediaType);
}
