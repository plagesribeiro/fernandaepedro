import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivory">
      <Heart className="w-10 h-10 text-rose-gold fill-rose-gold animate-pulse mb-4" />
      <p className="font-script text-3xl text-rose-gold">F & P</p>
      <p className="text-warm-gray text-sm mt-2">Carregando...</p>
    </div>
  );
}
