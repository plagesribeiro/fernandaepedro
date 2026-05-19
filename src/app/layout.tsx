import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Fernanda & Pedro — 08.08.2026",
  description:
    "Celebre conosco o casamento de Fernanda e Pedro. 08 de agosto de 2026 no Palácio das Mangabeiras, Belo Horizonte.",
  keywords: [
    "casamento",
    "Fernanda e Pedro",
    "wedding",
    "Belo Horizonte",
    "Palácio das Mangabeiras",
  ],
  openGraph: {
    title: "Fernanda & Pedro — Nosso Casamento",
    description:
      "Estamos nos casando! 08 de agosto de 2026 no Palácio das Mangabeiras.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Fernanda & Pedro — 08.08.2026",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="bg-ivory text-charcoal font-sans antialiased">
        <CartProvider>
          {children}
          <CartButton />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
