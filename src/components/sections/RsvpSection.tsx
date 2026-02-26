"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { rsvpSchema, type RsvpInput } from "@/lib/validators";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FormField } from "@/components/ui/FormField";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { ConfettiOverlay } from "@/components/effects/ConfettiOverlay";
import { useSoundEffect } from "@/hooks/useSoundEffect";

export function RsvpSection() {
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [serverError, setServerError] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const { play } = useSoundEffect();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RsvpInput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestCount: 1,
      additionalGuests: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    // useFieldArray expects objects, so we use a wrapper
    name: "additionalGuests" as never,
  });

  const phoneValue = watch("phone") || "";
  const guestCount = watch("guestCount");

  // Sync additionalGuests array size with guestCount
  useEffect(() => {
    const count = typeof guestCount === "number" ? guestCount : 1;
    const neededGuests = Math.max(0, count - 1);
    const currentGuests = fields.length;

    if (neededGuests !== currentGuests) {
      const currentValues = watch("additionalGuests") || [];
      const newValues: string[] = [];
      for (let i = 0; i < neededGuests; i++) {
        newValues.push(currentValues[i] || "");
      }
      replace(newValues as never[]);
    }
  }, [guestCount, fields.length, replace, watch]);

  useEffect(() => {
    registerGSAP();
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelector(".rsvp-form"),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  async function onSubmit(data: RsvpInput) {
    setServerError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        play("success");
        setSubmitted(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        setServerError(
          result.message || "Erro ao confirmar. Tente novamente."
        );
      }
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <section
      id="presenca"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 bg-ivory"
    >
      <ConfettiOverlay active={showConfetti} />

      <div className="max-w-xl mx-auto">
        <SectionHeading
          title="Confirme sua Presença"
          subtitle="Ficaremos muito felizes em celebrar com você!"
        />

        {submitted ? (
          <div className="text-center py-12 rsvp-form">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-sage" />
            </div>
            <h3 className="font-serif text-2xl text-charcoal mb-2">
              Presença Confirmada!
            </h3>
            <p className="text-warm-gray">
              Obrigado por confirmar. Mal podemos esperar para celebrar com
              você!
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rsvp-form space-y-5 bg-champagne backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-rose-gold/10 shadow-sm"
          >
            <FormField
              id="rsvp-name"
              label="Nome completo"
              placeholder="Seu nome e sobrenome"
              error={errors.name}
              {...register("name")}
            />

            <FormField
              id="rsvp-email"
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              error={errors.email}
              {...register("email")}
            />

            <PhoneInput
              id="rsvp-phone"
              label="Telefone"
              value={phoneValue}
              onChange={(val) => setValue("phone", val, { shouldValidate: true })}
              error={errors.phone}
            />

            <div className="space-y-1">
              <label
                htmlFor="rsvp-guests"
                className="block text-sm font-medium text-charcoal"
              >
                Número de convidados (incluindo você)
              </label>
              <select
                id="rsvp-guests"
                {...register("guestCount", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-rose-gold/20 hover:border-rose-gold/40 bg-champagne backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold transition-all duration-200"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "pessoa" : "pessoas"}
                  </option>
                ))}
              </select>
              {errors.guestCount && (
                <p className="text-sm text-red-500">
                  {errors.guestCount.message}
                </p>
              )}
            </div>

            <AnimatePresence mode="sync">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id || `guest-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormField
                    id={`rsvp-guest-${index}`}
                    label={`Nome completo — Convidado ${index + 2}`}
                    placeholder="Nome e sobrenome do convidado"
                    error={
                      errors.additionalGuests?.[index]
                        ? {
                            message:
                              typeof errors.additionalGuests[index] === "object" &&
                              errors.additionalGuests[index] !== null &&
                              "message" in errors.additionalGuests[index]
                                ? (errors.additionalGuests[index] as { message?: string }).message
                                : "Nome inválido",
                            type: "validate",
                          }
                        : undefined
                    }
                    {...register(`additionalGuests.${index}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {errors.additionalGuests &&
              !Array.isArray(errors.additionalGuests) &&
              "message" in errors.additionalGuests && (
                <p className="text-sm text-red-500">
                  {errors.additionalGuests.message}
                </p>
              )}

            <FormField
              id="rsvp-message"
              label="Mensagem para os noivos (opcional)"
              as="textarea"
              rows={3}
              placeholder="Deixe uma mensagem carinhosa..."
              error={errors.message}
              {...register("message")}
            />

            {serverError && (
              <p className="text-sm text-red-500 text-center">{serverError}</p>
            )}

            <AnimatedButton
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirmando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Confirmar Presença
                </span>
              )}
            </AnimatedButton>
          </form>
        )}
      </div>
    </section>
  );
}
