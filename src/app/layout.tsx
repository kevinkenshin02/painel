import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Work_Sans } from "next/font/google";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";

// Mesmo par de fontes do site tanakaotica.com.br
const work = Work_Sans({
  variable: "--font-work",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel Tanaka | Ótica e Relojoaria",
  description: "Painel de gestão da Tanaka Ótica e Relojoaria",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Painel Tanaka" },
  icons: { apple: "/icones/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f9b233",
  width: "device-width",
  initialScale: 1,
};

// O escuro é o padrão; só troca se a pessoa escolheu o claro em Configurações.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (localStorage.getItem("tema") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${work.variable} ${shippori.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full font-sans text-[14px] text-texto">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
