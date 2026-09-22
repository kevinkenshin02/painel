/*
  Warnings:

  - You are about to drop the column `cnpj` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `inscricaoEstadual` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `satChaveAcesso` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `satEmitidoEm` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `satMensagemErro` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `satNumeroSessao` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `satStatus` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `satXmlRetorno` on the `vendas` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_configuracao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomeLoja" TEXT NOT NULL DEFAULT 'Óticas Tanaka e Relojoaria',
    "endereco" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "metaDiaria" REAL NOT NULL DEFAULT 0,
    "metaMensal" REAL NOT NULL DEFAULT 0,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_configuracao" ("atualizadoEm", "endereco", "id", "metaDiaria", "metaMensal", "nomeLoja", "whatsapp") SELECT "atualizadoEm", "endereco", "id", "metaDiaria", "metaMensal", "nomeLoja", "whatsapp" FROM "configuracao";
DROP TABLE "configuracao";
ALTER TABLE "new_configuracao" RENAME TO "configuracao";
CREATE TABLE "new_vendas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataVenda" DATETIME NOT NULL,
    "clienteNome" TEXT,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "custoTotal" REAL NOT NULL,
    "valorVendido" REAL NOT NULL,
    "canalOrigem" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL DEFAULT 'OUTRO',
    "statusPagamento" TEXT NOT NULL DEFAULT 'PAGO',
    "mercadoPagoOrderId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "armacaoId" INTEGER,
    "relogioId" INTEGER,
    "lenteId" INTEGER,
    "funcionarioId" INTEGER,
    CONSTRAINT "vendas_armacaoId_fkey" FOREIGN KEY ("armacaoId") REFERENCES "estoque_armacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_relogioId_fkey" FOREIGN KEY ("relogioId") REFERENCES "estoque_relogios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_lenteId_fkey" FOREIGN KEY ("lenteId") REFERENCES "estoque_lentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vendas" ("armacaoId", "canalOrigem", "categoria", "clienteNome", "criadoEm", "custoTotal", "dataVenda", "descricao", "formaPagamento", "funcionarioId", "id", "lenteId", "mercadoPagoOrderId", "quantidade", "relogioId", "statusPagamento", "valorVendido") SELECT "armacaoId", "canalOrigem", "categoria", "clienteNome", "criadoEm", "custoTotal", "dataVenda", "descricao", "formaPagamento", "funcionarioId", "id", "lenteId", "mercadoPagoOrderId", "quantidade", "relogioId", "statusPagamento", "valorVendido" FROM "vendas";
DROP TABLE "vendas";
ALTER TABLE "new_vendas" RENAME TO "vendas";
CREATE UNIQUE INDEX "vendas_mercadoPagoOrderId_key" ON "vendas"("mercadoPagoOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
