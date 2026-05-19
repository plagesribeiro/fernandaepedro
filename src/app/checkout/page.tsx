"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Heart,
  QrCode,
  ShoppingBag,
  Sparkles,
  Lock,
  Loader2,
  Check,
} from "lucide-react";
import {
  isValidPhoneNumber,
  parsePhoneNumber,
  formatPhoneNumberIntl,
} from "react-phone-number-input";
import { FormField } from "@/components/ui/FormField";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useCart } from "@/components/cart/CartContext";
import { formatCurrency, cn, isUsableImage } from "@/lib/utils";
import { WEDDING } from "@/lib/constants";
import { CardPaymentBrick } from "@/components/checkout/CardPaymentBrick";
import { PixCheckoutStep } from "@/components/checkout/PixCheckoutStep";
import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";
import { AiMessageField } from "@/components/checkout/AiMessageField";
import { AiGiftImageBox } from "@/components/checkout/AiGiftImageBox";
import { AiTipBanner } from "@/components/checkout/AiTipBanner";
import {
  AI_IMAGE_STORAGE_KEY,
  AI_TIP_STORAGE_KEY,
  loadTipState,
  saveTipState,
  type PersistedTipState,
} from "@/lib/ai-checkout-storage";

type PaymentMethod = "card" | "pix";
// Passo 1: dados do comprador. Passo 2: mensagem + imagem IA + doação extra. Passo 3: pagamento.
type Step = "buyer" | "ai" | "pay" | "card_pending" | "success";

const CHECKOUT_FORM_STORAGE_KEY = "fp-checkout-form-v1";

interface PersistedForm {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

function loadPersistedForm(): PersistedForm {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHECKOUT_FORM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as PersistedForm;
  } catch {
    // ignore
  }
  return {};
}

/**
 * Converte telefones antigos armazenados (ex: "(31) 99999-9999") pra E.164
 * (formato usado pela nova lib). Se não der pra parsear, retorna "" pra
 * forçar o usuário a digitar de novo.
 */
function normalizeStoredPhone(stored: string | undefined): string {
  if (!stored) return "";
  if (isValidPhoneNumber(stored)) return stored;
  try {
    const parsed = parsePhoneNumber(stored, "BR");
    if (parsed?.isValid()) return parsed.number;
  } catch {
    // ignore
  }
  return "";
}

export default function CheckoutPage() {
  const { items, total, itemCount, clear, addDonation } = useCart();
  const [step, setStep] = useState<Step>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [successMethod, setSuccessMethod] = useState<string | undefined>();
  const [cardPendingId, setCardPendingId] = useState<number | null>(null);
  // AI: URL da imagem gerada que viaja com o pedido; flag de "tá gerando agora";
  // flag de "usou IA pelo menos uma vez" pra disparar o tip banner.
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [tipState, setTipState] = useState<PersistedTipState>({
    added: false,
    dismissed: false,
  });
  const hydratedRef = useRef(false);
  const tipHydratedRef = useRef(false);

  // Restore form state from localStorage on first mount (survives refresh)
  useEffect(() => {
    const saved = loadPersistedForm();
    if (saved.name) setName(saved.name);
    if (saved.email) setEmail(saved.email);
    if (saved.phone) {
      const normalized = normalizeStoredPhone(saved.phone);
      if (normalized) setPhone(normalized);
    }
    if (saved.message) setMessage(saved.message);
    hydratedRef.current = true;
  }, []);

  // Hydrate tip state separately so it survives reloads too.
  useEffect(() => {
    const saved = loadTipState();
    setTipState(saved);
    // Se já tinha sido adicionado/dispensado antes, considera "usedAi" pra
    // manter o banner visível (já que o usuário interagiu com IA antes).
    if (saved.added || saved.dismissed) setUsedAi(true);
    tipHydratedRef.current = true;
  }, []);

  // Persist form state on any change after hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(
        CHECKOUT_FORM_STORAGE_KEY,
        JSON.stringify({ name, email, phone, message })
      );
    } catch {
      // ignore quota errors
    }
  }, [name, email, phone, message]);

  // Persist tip state on changes.
  useEffect(() => {
    if (!tipHydratedRef.current) return;
    saveTipState(tipState);
  }, [tipState]);

  // Wipe stored state once the purchase succeeds.
  useEffect(() => {
    if (step === "success") {
      try {
        window.localStorage.removeItem(CHECKOUT_FORM_STORAGE_KEY);
        window.localStorage.removeItem(AI_IMAGE_STORAGE_KEY);
        window.localStorage.removeItem(AI_TIP_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [step]);

  const handleTipAdd = useCallback(
    (amount: number) => {
      addDonation(amount);
      setTipState({ added: true, dismissed: false, addedAmount: amount });
    },
    [addDonation]
  );

  const handleTipDismiss = useCallback(() => {
    setTipState((prev) => ({ ...prev, dismissed: true }));
  }, []);

  const handleAiUsed = useCallback(() => {
    setUsedAi(true);
  }, []);

  // libphonenumber-js (via react-phone-number-input) valida com regras E.164 + país.
  const validPhone = !!phone && isValidPhoneNumber(phone);
  const buyerValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    validPhone;
  const formValid = items.length > 0 && buyerValid;

  const apiItems = useMemo(
    () =>
      items.map((it) =>
        it.kind === "gift"
          ? {
              kind: "gift" as const,
              giftName: it.giftName,
              quantity: it.quantity,
            }
          : { kind: "donation" as const, amount: it.amount }
      ),
    [items]
  );

  function handleAdvanceToAi(e: FormEvent) {
    e.preventDefault();
    if (!buyerValid) return;
    setStep("ai");
  }

  function handleAdvanceToPay(e: FormEvent) {
    e.preventDefault();
    if (!formValid || aiBusy) return;
    setStep("pay");
  }

  function handleApprovedCard(info: {
    internalId?: number;
    mercadoPagoId?: string;
    paymentMethod?: string;
  }) {
    setSuccessMethod(info.paymentMethod);
    clear();
    setStep("success");
  }

  function handlePendingCard(info: { internalId: number }) {
    setCardPendingId(info.internalId);
    setStep("card_pending");
  }

  function handleApprovedPix() {
    setSuccessMethod("PIX");
    clear();
    setStep("success");
  }

  if (step === "success") {
    return (
      <main className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
        <CheckoutSuccess paymentMethod={successMethod} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ivory py-10 sm:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/#presentes"
          className="inline-flex items-center gap-1 text-sm text-warm-gray hover:text-rose-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pra lista
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-rose-gold" />
            </div>
            <h1 className="font-serif text-3xl text-charcoal">Finalizar</h1>
          </div>
          <p className="text-warm-gray text-sm">
            {itemCount === 0
              ? "Seu carrinho está vazio."
              : `${itemCount} ${itemCount === 1 ? "item" : "itens"} · ${formatCurrency(total)}`}
          </p>
        </motion.div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <StepIndicator step={step} />

              <BuyerSection
                editable={step === "buyer"}
                visible={step !== "card_pending"}
                name={name}
                email={email}
                phone={phone}
                onChangeName={setName}
                onChangeEmail={setEmail}
                onChangePhone={setPhone}
                onContinue={handleAdvanceToAi}
                onEdit={() => setStep("buyer")}
                buyerValid={buyerValid}
              />

              <AiSection
                editable={step === "ai"}
                visible={step === "ai" || step === "pay"}
                name={name}
                email={email}
                phone={phone}
                message={message}
                onChangeMessage={setMessage}
                onContinue={handleAdvanceToPay}
                onEdit={() => setStep("ai")}
                formValid={formValid}
                aiItems={apiItems}
                aiImageUrl={aiImageUrl}
                onAiImageReady={setAiImageUrl}
                onAiBusyChange={setAiBusy}
                onAiUsed={handleAiUsed}
                aiBusy={aiBusy}
                showTipBanner={usedAi && !tipState.dismissed}
                tipAddedAmount={
                  tipState.added ? tipState.addedAmount ?? null : null
                }
                onTipAdd={handleTipAdd}
                onTipDismiss={handleTipDismiss}
              />

              <AnimatePresence>
                {step === "pay" && (
                  <motion.section
                    key="pay"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-champagne rounded-2xl p-6 border border-rose-gold/10 shadow-sm space-y-5"
                  >
                    <h2 className="font-serif text-lg text-charcoal">
                      Como você quer pagar?
                    </h2>

                    <PaymentTabs
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                    />

                    <div className="rounded-lg border border-rose-gold/15 bg-ivory/60 p-3 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-warm-gray leading-relaxed">
                        Pagamento processado pelo Mercado Pago. Seus dados de
                        cartão não passam pelo nosso servidor.
                      </p>
                    </div>

                    {paymentMethod === "card" ? (
                      <CardPaymentBrick
                        amount={total}
                        payerEmail={email.trim()}
                        buildPayload={(formData) => ({
                          paymentMethod: "card",
                          items: apiItems,
                          reserverName: name.trim(),
                          reserverEmail: email.trim(),
                          reserverPhone: phone.trim(),
                          message: message.trim() || undefined,
                          giftImageUrl: aiImageUrl ?? undefined,
                          formData,
                        })}
                        onApproved={handleApprovedCard}
                        onPending={handlePendingCard}
                      />
                    ) : (
                      <PixCheckoutStep
                        items={apiItems}
                        reserverName={name.trim()}
                        reserverEmail={email.trim()}
                        reserverPhone={phone.trim()}
                        message={message.trim() || undefined}
                        giftImageUrl={aiImageUrl ?? undefined}
                        amount={total}
                        onApproved={handleApprovedPix}
                      />
                    )}
                  </motion.section>
                )}

                {step === "card_pending" && (
                  <motion.section
                    key="card_pending"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-champagne rounded-2xl p-8 border border-rose-gold/10 shadow-sm text-center"
                  >
                    <Loader2 className="w-10 h-10 text-rose-gold animate-spin mx-auto mb-3" />
                    <h2 className="font-serif text-xl text-charcoal mb-2">
                      Confirmando seu pagamento
                    </h2>
                    <p className="text-warm-gray text-sm">
                      Banco está revisando o cartão. Isso costuma levar alguns
                      segundos.
                    </p>
                    <p className="text-xs text-warm-gray/70 mt-4">
                      Ref: #{cardPendingId}
                    </p>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>

            <CartAside items={items} total={total} />
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyCart() {
  return (
    <div className="bg-champagne rounded-2xl p-8 text-center border border-rose-gold/10">
      <ShoppingBag className="w-12 h-12 text-rose-gold/30 mx-auto mb-3" />
      <p className="text-warm-gray mb-4">
        Adicione presentes ao carrinho pra continuar.
      </p>
      <Link
        href="/#presentes"
        className="inline-block bg-rose-gold text-white px-6 py-2 rounded-lg hover:bg-rose-gold-dark transition-colors"
      >
        Ver presentes
      </Link>
    </div>
  );
}

type ApiItem =
  | { kind: "gift"; giftName: string; quantity: number }
  | { kind: "donation"; amount: number };

function StepIndicator({ step }: { step: Step }) {
  const steps: Array<{ id: Exclude<Step, "card_pending" | "success">; label: string }> = [
    { id: "buyer", label: "Seus dados" },
    { id: "ai", label: "Mensagem & extras" },
    { id: "pay", label: "Pagamento" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);
  const effectiveIndex =
    step === "card_pending" ? 2 : currentIndex >= 0 ? currentIndex : 0;

  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const isDone = i < effectiveIndex;
        const isActive = i === effectiveIndex;
        return (
          <li key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 transition-colors",
                isDone && "bg-rose-gold text-white",
                isActive && "bg-rose-gold text-white shadow-sm",
                !isDone && !isActive && "bg-ivory border border-rose-gold/20 text-warm-gray"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "truncate font-medium",
                isActive
                  ? "text-charcoal"
                  : isDone
                    ? "text-rose-gold"
                    : "text-warm-gray/80"
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-1",
                  isDone ? "bg-rose-gold/40" : "bg-rose-gold/10"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function BuyerSection({
  visible,
  editable,
  name,
  email,
  phone,
  onChangeName,
  onChangeEmail,
  onChangePhone,
  onContinue,
  onEdit,
  buyerValid,
}: {
  visible: boolean;
  editable: boolean;
  name: string;
  email: string;
  phone: string;
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
  onContinue: (e: FormEvent) => void;
  onEdit: () => void;
  buyerValid: boolean;
}) {
  if (!visible) return null;

  if (!editable) {
    const displayPhone = formatPhoneNumberIntl(phone) || phone;
    return (
      <div className="bg-champagne rounded-2xl p-5 border border-rose-gold/10 flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-medium text-sm text-charcoal truncate">{name}</p>
          <p className="text-xs text-warm-gray truncate">
            {email} · {displayPhone}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-rose-gold hover:underline flex-shrink-0"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onContinue}
      className="bg-champagne rounded-2xl p-6 border border-rose-gold/10 shadow-sm space-y-4"
    >
      <h2 className="font-serif text-lg text-charcoal">Seus dados</h2>

      <FormField
        id="ck-name"
        label="Seu nome completo"
        placeholder="Nome e sobrenome"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChangeName(e.target.value)
        }
        required
      />
      <FormField
        id="ck-email"
        type="email"
        label="Seu e-mail"
        placeholder="seu@email.com"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChangeEmail(e.target.value)
        }
        required
      />
      <PhoneInput
        id="ck-phone"
        label="Seu telefone"
        value={phone}
        onChange={onChangePhone}
      />

      <AnimatedButton
        type="submit"
        disabled={!buyerValid}
        className="w-full"
        size="lg"
      >
        Continuar
      </AnimatedButton>
    </form>
  );
}

function AiSection({
  visible,
  editable,
  name,
  email,
  phone,
  message,
  onChangeMessage,
  onContinue,
  onEdit,
  formValid,
  aiItems,
  aiImageUrl,
  onAiImageReady,
  onAiBusyChange,
  onAiUsed,
  aiBusy,
  showTipBanner,
  tipAddedAmount,
  onTipAdd,
  onTipDismiss,
}: {
  visible: boolean;
  editable: boolean;
  name: string;
  email: string;
  phone: string;
  message: string;
  onChangeMessage: (v: string) => void;
  onContinue: (e: FormEvent) => void;
  onEdit: () => void;
  formValid: boolean;
  aiItems: ApiItem[];
  aiImageUrl: string | null;
  onAiImageReady: (url: string | null) => void;
  onAiBusyChange: (busy: boolean) => void;
  onAiUsed: () => void;
  aiBusy: boolean;
  showTipBanner: boolean;
  tipAddedAmount: number | null;
  onTipAdd: (amount: number) => void;
  onTipDismiss: () => void;
}) {
  if (!visible) return null;

  if (!editable) {
    const hasMessage = message.trim().length > 0;
    const hasImage = !!aiImageUrl;
    return (
      <div className="bg-champagne rounded-2xl p-5 border border-rose-gold/10 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-warm-gray/80 mb-1">
            Mensagem & extras
          </p>
          {hasMessage || hasImage ? (
            <div className="space-y-0.5">
              {hasMessage && (
                <p className="text-sm text-charcoal line-clamp-2">
                  &ldquo;{message.trim()}&rdquo;
                </p>
              )}
              {hasImage && (
                <p className="text-xs text-sage flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Imagem de presente incluída
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-warm-gray italic">Sem mensagem nem imagem extra</p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-rose-gold hover:underline flex-shrink-0"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onContinue}
      className="bg-champagne rounded-2xl p-6 border border-rose-gold/10 shadow-sm space-y-4"
    >
      <div className="space-y-0.5">
        <h2 className="font-serif text-lg text-charcoal flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-gold" /> Mensagem & extras
          <span className="text-warm-gray font-normal text-sm">(opcional)</span>
        </h2>
        <p className="text-xs text-warm-gray/80">
          Tudo aqui é opcional. Pode pular e ir direto pro pagamento.
        </p>
      </div>

      <AiMessageField
        value={message}
        onChange={onChangeMessage}
        items={aiItems}
        name={name}
        email={email}
        phone={phone}
        formValid={formValid}
        maxLength={500}
        disabled={!editable}
        onAiUsed={onAiUsed}
      />

      <AiGiftImageBox
        onImageReady={onAiImageReady}
        onBusyChange={onAiBusyChange}
        onAiUsed={onAiUsed}
        galleryImages={WEDDING.gallery}
        name={name}
        email={email}
        phone={phone}
        formValid={formValid}
        disabled={!editable}
      />

      <AiTipBanner
        show={showTipBanner}
        addedAmount={tipAddedAmount}
        onAdd={onTipAdd}
        onDismiss={onTipDismiss}
      />

      <AnimatedButton
        type="submit"
        disabled={!formValid || aiBusy}
        className="w-full"
        size="lg"
      >
        {aiBusy ? "Aguarde a imagem terminar..." : "Continuar para pagamento"}
      </AnimatedButton>
    </form>
  );
}

function PaymentTabs({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 bg-ivory rounded-xl border border-rose-gold/10">
      <Tab
        active={value === "card"}
        onClick={() => onChange("card")}
        icon={<CreditCard className="w-4 h-4" />}
        label="Cartão"
        sub="até 12x"
      />
      <Tab
        active={value === "pix"}
        onClick={() => onChange("pix")}
        icon={<QrCode className="w-4 h-4" />}
        label="PIX"
        sub="à vista"
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg py-2.5 px-3 transition-all flex flex-col items-start gap-0.5",
        active
          ? "bg-rose-gold text-white shadow-sm"
          : "text-warm-gray hover:bg-rose-gold/5"
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-wider",
          active ? "text-white/80" : "text-warm-gray/70"
        )}
      >
        {sub}
      </span>
    </button>
  );
}

function CartAside({
  items,
  total,
}: {
  items: ReturnType<typeof useCart>["items"];
  total: number;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-white rounded-2xl p-5 border border-rose-gold/10 shadow-sm h-fit md:sticky md:top-6"
    >
      <h2 className="font-serif text-base text-charcoal mb-3">Resumo</h2>
      <ul className="space-y-3">
        {items.map((it) => {
          const isGift = it.kind === "gift";
          const key = isGift ? `gift-${it.giftName}` : `donation-${it.id}`;
          const lineTotal = isGift ? it.price * it.quantity : it.amount;
          return (
            <li key={key} className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-blush/40 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {isGift && isUsableImage(it.imageUrl) ? (
                  <Image
                    src={it.imageUrl}
                    alt={it.giftName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : isGift ? (
                  <ShoppingBag className="w-5 h-5 text-rose-gold/40" />
                ) : (
                  <Heart className="w-5 h-5 text-rose-gold/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {isGift ? it.giftName : "Doação Personalizada"}
                </p>
                <p className="text-xs text-warm-gray">
                  {isGift && it.quantity > 1
                    ? `${it.quantity} × ${formatCurrency(it.price)}`
                    : formatCurrency(isGift ? it.price : it.amount)}
                </p>
              </div>
              <span className="text-sm font-semibold text-rose-gold tabular-nums">
                {formatCurrency(lineTotal)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-rose-gold/10">
        <span className="text-sm text-warm-gray">Total</span>
        <span className="text-xl font-serif text-rose-gold tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
    </motion.aside>
  );
}
