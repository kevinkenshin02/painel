// Ponte segura entre a página do Painel e o Electron: só expõe o "salvar PDF".
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("painel", {
  salvarPdf: (nomeArquivo) => ipcRenderer.invoke("salvar-pdf", nomeArquivo),
});
