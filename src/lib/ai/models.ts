// Model IDs roteados pelo Vercel AI Gateway. Single place to swap.
// Docs: https://vercel.com/docs/ai-gateway/models-and-providers
//   "The Vercel AI Gateway is the default provider for the AI SDK when a
//    model is specified as a string."
export const TEXT_MODEL = "openai/gpt-5.2";

// "Nano Banana 2 Pro" — mesmo model id é usado tanto pra prompt-only quanto
// pra multimodal (text + image). Roteamento por modo no /api/ai/image.
export const IMAGE_MODEL = "google/gemini-3-pro-image";
