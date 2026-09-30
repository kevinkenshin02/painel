// O binario node_modules/electron/dist/electron.exe vem com o icone padrao do Electron (o atomo azul)
// gravado nele. O Windows usa ESSE icone (nao o da janela) para representar o app fixado na barra de
// tarefas quando ele nao esta rodando. rcedit troca o icone gravado no proprio .exe, do mesmo jeito que
// o electron-builder faz na hora de empacotar. Roda de novo sempre que "npm install" reinstalar o electron.
import { rcedit } from "rcedit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const exe = path.join(raiz, "node_modules", "electron", "dist", "electron.exe");
const icone = path.join(raiz, "electron", "icone-painel-v3.ico");

// o ícone é só visual: se não der para gravar, avisa e deixa a instalação seguir
if (!fs.existsSync(exe)) {
  console.warn("Aviso: electron.exe não encontrado (o Electron não foi baixado?). Ícone não aplicado:", exe);
} else {
  try {
    await rcedit(exe, { icon: icone });
    console.log("Icone do electron.exe atualizado:", exe);
  } catch (e) {
    console.warn("Aviso: não foi possível gravar o ícone no electron.exe (o Painel está aberto?):", e.message);
  }
}
