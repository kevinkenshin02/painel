"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { cx } from "@/components/ui/cx";

/**
 * Mapa de deslocamento de um retângulo arredondado: no miolo não mexe (cinza neutro 128),
 * perto da borda puxa o fundo para dentro, como a borda grossa de uma lente de vidro.
 * Vermelho = deslocamento em X, verde = em Y.
 */
function mapaDaLente(larg: number, alt: number, raio: number, faixa: number) {
  const f = 0.5; // gera em meia resolução; o filtro estica para o tamanho real
  const W = Math.max(2, Math.round(larg * f));
  const H = Math.max(2, Math.round(alt * f));
  const r = Math.min(raio * f, W / 2, H / 2);
  const b = faixa * f;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(W, H);
  const hx = W / 2 - r;
  const hy = H / 2 - r;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - W / 2;
      const py = y + 0.5 - H / 2;
      const qx = Math.abs(px) - hx;
      const qy = Math.abs(py) - hy;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const fora = Math.hypot(ox, oy);
      const profundidade = -(Math.min(Math.max(qx, qy), 0) + fora - r); // distância até a borda, por dentro
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0 && fora > 0) {
        nx = (Math.sign(px) * ox) / fora;
        ny = (Math.sign(py) * oy) / fora;
      } else if (qx > qy) nx = Math.sign(px);
      else ny = Math.sign(py);
      const t = Math.min(Math.max(1 - profundidade / b, 0), 1);
      const forca = t * t; // forte na borda, some rápido para dentro
      const i = (y * W + x) * 4;
      img.data[i] = 128 - nx * forca * 127;
      img.data[i + 1] = 128 - ny * forca * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

type Props = ComponentProps<"section"> & {
  /** raio dos cantos em px (igual ao rounded-* usado) */
  raio?: number;
  /** quanto a borda "entorta" o fundo, em px */
  intensidade?: number;
};

/** Cartão em "vidro líquido" (estilo iOS 26): transparente, com refração nas bordas e reflexo que segue o ponteiro. */
export function VidroLiquido({ raio = 28, intensidade = 70, className, style, children, ...resto }: Props) {
  const ref = useRef<HTMLElement>(null);
  const id = `lente-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [mapa, setMapa] = useState<{ href: string; w: number; h: number } | null>(null);
  const [refracao, setRefracao] = useState(false);

  // refração só onde o navegador sabe aplicar filtro SVG no fundo (Chromium: Electron, Chrome, Edge, Android)
  useEffect(() => {
    const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
    const chromium = brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
    const semTransparencia = matchMedia("(prefers-reduced-transparency: reduce)").matches;
    if (!chromium || semTransparencia) return;
    const el = ref.current;
    if (!el) return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const gerar = () => {
      const { width, height } = el.getBoundingClientRect();
      const href = mapaDaLente(width, height, raio, 34);
      if (href) setMapa({ href, w: width, h: height });
      setRefracao(true);
    };
    gerar();
    // enquanto o cartão anima de altura, o mapa atual estica; quando assenta, refaz no tamanho exato
    const ro = new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(gerar, 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(espera);
    };
  }, [raio]);

  // reflexo que acompanha o mouse/dedo (só mexe numa variável do próprio cartão)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let quadro = 0;
    const mover = (e: PointerEvent) => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--luz-x", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--luz-y", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <section
      ref={ref}
      {...resto}
      className={cx("liquido", className)}
      style={{
        ...style,
        borderRadius: raio,
        ...(refracao && mapa
          ? {
              WebkitBackdropFilter: `url(#${id}) blur(2.5px) saturate(1.7) brightness(1.04)`,
              backdropFilter: `url(#${id}) blur(2.5px) saturate(1.7) brightness(1.04)`,
            }
          : null),
      }}
    >
      {mapa && (
        <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
          <filter id={id} x="0" y="0" width={mapa.w} height={mapa.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={mapa.href} x="0" y="0" width={mapa.w} height={mapa.h} preserveAspectRatio="none" result="mapa" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale={intensidade} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      {children}
    </section>
  );
}
