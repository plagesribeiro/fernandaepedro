import { Heart } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory px-4 text-center">
      <Heart className="w-16 h-16 text-rose-gold/30 fill-rose-gold/30 mb-6" />
      <h1 className="font-serif text-4xl text-charcoal mb-3">
        Página não encontrada
      </h1>
      <p className="text-warm-gray mb-8 max-w-md">
        Parece que você se perdeu no caminho para a festa. Vamos te levar de
        volta!
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-rose-gold text-white rounded-full font-medium hover:bg-rose-gold-dark transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
