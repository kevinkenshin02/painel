import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: "800",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Óticas Tanaka | Painel de gestão",
  description: "Painel de gestão da Óticas Tanaka e Relojoaria",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var tema = localStorage.getItem("tema");
    if (tema === "dark" || tema === "light") {
      document.documentElement.setAttribute("data-theme", tema);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full bg-[#faf7f2] text-[#221d19]">{children}</body>
    </html>
  );
}
