import {
  MarcaRelogio,
  MecanismoRelogio,
  PublicoRelogio,
} from "@/generated/prisma/enums";

export const MARCA_RELOGIO_LABELS: Record<MarcaRelogio, string> = {
  ORIENT: "Orient",
  MAGNUM: "Magnum",
  LINCE: "Lince",
  X_WATCH: "X-Watch",
  COSMOS: "Cosmos",
  CHAMPION: "Champion",
  SKMEI: "Skmei",
  OUTRO: "Outro",
};

export const PUBLICO_RELOGIO_LABELS: Record<PublicoRelogio, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  INFANTIL: "Infantil",
  UNISSEX: "Unissex",
};

export const MECANISMO_RELOGIO_LABELS: Record<MecanismoRelogio, string> = {
  ANALOGICO: "Analógico",
  AUTOMATICO: "Automático",
  DIGITAL: "Digital",
  SMART: "Smart",
  OUTRO: "Outro",
};
