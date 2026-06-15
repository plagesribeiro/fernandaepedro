import { WEDDING } from "@/lib/constants";

export interface CartItemForPrompt {
  kind: "gift" | "donation";
  name: string;
  unitPrice: number;
  quantity: number;
}

export function buildMessageSystemPrompt(): string {
  return `Você escreve mensagens curtas, calorosas e elegantes em português brasileiro para presentear noivos.

Contexto fixo:
- Noivos: ${WEDDING.bride} e ${WEDDING.groom}
- Casamento: ${WEDDING.dateDisplay}, ${WEDDING.venue.name} (${WEDDING.venue.city})
- Você escreve no lugar de UM convidado que está dando um presente ou doação.

Regras:
- ENXUTA: exatamente 3 ou 4 frases curtas. Máximo 280 caracteres no total.
- Cada frase é direta, sem subordinações longas nem listas.
- Tom afetuoso, sincero, com leveza. Sem clichê de Hallmark.
- Mencione "${WEDDING.bride} e ${WEDDING.groom}" (ou "Fê e Pê") ao menos uma vez.
- Pode tocar no presente de forma sutil, se fizer sentido.
- Não invente fatos do convidado (idade, parentesco, profissão).
- Sem emojis. Sem exclamações duplas. Sem hashtag.
- Saída: APENAS o texto, sem aspas nem prefixo nem "Mensagem:".`;
}

export function buildMessageUserPrompt(input: {
  items: CartItemForPrompt[];
  total: number;
  hint?: string;
  reserverName?: string;
}): string {
  const lines = input.items.map((it) => {
    if (it.kind === "gift") {
      const qty = it.quantity > 1 ? ` (x${it.quantity})` : "";
      return `- ${it.name}${qty} — R$ ${it.unitPrice.toFixed(2)}`;
    }
    return `- Doação livre — R$ ${it.unitPrice.toFixed(2)}`;
  });

  const totalLine = `Total: R$ ${input.total.toFixed(2)}`;
  const hint = input.hint?.trim()
    ? `Dica do convidado: "${input.hint.trim()}"`
    : `Dica do convidado: sem dica.`;
  const guest = input.reserverName?.trim()
    ? `Nome do convidado (use só pra ajustar tom, não escreva de "Bruno...": ${input.reserverName.trim()})`
    : "";

  return [
    "Presente(s) no carrinho:",
    lines.join("\n"),
    totalLine,
    "",
    hint,
    guest,
    "",
    "Gere a mensagem.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildImagePrompt(input: {
  userPrompt?: string;
  hasReferenceImages: boolean;
}): string {
  const hasPrompt = !!input.userPrompt?.trim();
  const hasRefs = input.hasReferenceImages;

  // O contexto do casamento entra só como destinatário (ocasião), NÃO como tema.
  // O conteúdo da imagem vem do pedido textual e/ou das fotos anexadas.
  // Se o usuário não deu nada, aí sim a gente sugere algo afetivo pros noivos.
  const lines: string[] = [];

  lines.push(
    `Gere uma imagem que vai ser presenteada a um casal de noivos: ${WEDDING.bride} e ${WEDDING.groom}. Eles são apenas o destinatário do presente — você NÃO precisa fazer algo com tema de casamento (porta-retrato, foto deles no altar, decoração de festa, etc.) a menos que isso seja explicitamente pedido.`
  );

  lines.push("");
  lines.push(
    "REGRA PRINCIPAL: o conteúdo da imagem é determinado pelo pedido do convidado e/ou pelas imagens de referência. Faça exatamente o que ele pediu, no estilo que ele pediu. Se pediu um gato cyberpunk, faz um gato cyberpunk. Se pediu uma paisagem, uma paisagem."
  );

  lines.push("");
  if (hasPrompt) {
    lines.push(`Pedido do convidado: "${input.userPrompt!.trim()}"`);
  } else {
    lines.push("Pedido do convidado: (não enviou texto)");
  }

  if (hasRefs) {
    lines.push(
      "Imagens de referência: o convidado anexou — use como inspiração visual PRIMÁRIA (mood, paleta, composição, conteúdo). Se as fotos mostram pessoas, você pode mantê-las na cena dentro do que foi pedido (sem cópia literal de rosto se o pedido pede transformação)."
    );
  }

  lines.push("");
  lines.push("Output:");
  lines.push("- Composição 1:1 quadrada.");
  lines.push("- Imagem bem composta, qualidade de impressão.");
  lines.push(
    "- Evite: stock photo aesthetics, watermarks, texto sobreposto (exceto se pedido), neon harsh, clichês de casamento genéricos."
  );
  lines.push(
    "- Assinatura discreta obrigatória: inclua o texto \"uaimedia.app\" em letras pequenas e sutis em um dos cantos inferiores da imagem (tipografia simples, baixa opacidade ou cor que harmonize com a cena, sem fundo nem moldura). Deve ser legível de perto, mas sem competir com o assunto principal nem invadir a composição. É a única exceção à regra de \"sem texto sobreposto\" acima."
  );

  if (!hasPrompt && !hasRefs) {
    lines.push("");
    lines.push(
      `Como o convidado não deu pedido nem referências: surpreenda com algo bonito e afetivo que possa servir como um presente delicado para ${WEDDING.bride} e ${WEDDING.groom} — pode ser paisagem, still life, atmosfera, abstrato. Evite clichês visuais de casamento (retratos, alianças, buquês).`
    );
  }

  lines.push("");
  lines.push("Gere uma imagem.");

  return lines.join("\n");
}
