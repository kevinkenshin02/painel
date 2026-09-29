// Sem cache de propósito: o Painel mostra dados que mudam o tempo todo (caixa, OS, estoque),
// e uma tela velha guardada seria pior que nenhuma. Existe só para o app ser instalável.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
