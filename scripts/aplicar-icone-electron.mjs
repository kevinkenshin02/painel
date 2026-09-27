// O binario node_modules/electron/dist/electron.exe vem com o icone padrao do Electron (o atomo azul)
// gravado nele. O Windows usa ESSE icone (nao o da janela) para representar o app fixado na barra de
// tarefas quando ele nao esta rodando. rcedit troca o icone gravado no proprio .exe, do mesmo jeito que
// o electron-builder faz na hora de empacotar. Roda de novo sempre que "npm install" reinstalar o electron.
import { rcedit } from "rcedit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const exe = path.join(raiz, "node_modules", "electron", "dist", "electron.exe");
const icone = path.join(raiz, "electron", "icone-painel-v3.ico");

await rcedit(exe, { icon: icone });
console.log("Icone do electron.exe atualizado:", exe);
