import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export async function uploadGiftImage(
  bytes: Uint8Array,
  mediaType: string
): Promise<{ url: string; mediaType: string }> {
  const normalized = mediaType.toLowerCase();
  const ext = MIME_TO_EXT[normalized] ?? "png";
  const filename = `gift-images/${nanoid(12)}.${ext}`;
  const blob = await put(filename, Buffer.from(bytes), {
    access: "public",
    contentType: normalized,
    addRandomSuffix: false,
  });
  return { url: blob.url, mediaType: normalized };
}
