-- CreateTable
CREATE TABLE "funcionarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "pinSalt" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "funcionarioId" INTEGER,
    CONSTRAINT "vendas_armacaoId_fkey" FOREIGN KEY ("armacaoId") REFERENCES "estoque_armacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_relogioId_fkey" FOREIGN KEY ("relogioId") REFERENCES "estoque_relogios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vendas" ("armacaoId", "canalOrigem", "categoria", "clienteNome", "criadoEm", "custoTotal", "dataVenda", "descricao", "formaPagamento", "id", "mercadoPagoOrderId", "quantidade", "relogioId", "statusPagamento", "valorVendido") SELECT "armacaoId", "canalOrigem", "categoria", "clienteNome", "criadoEm", "custoTotal", "dataVenda", "descricao", "formaPagamento", "id", "mercadoPagoOrderId", "quantidade", "relogioId", "statusPagamento", "valorVendido" FROM "vendas";
DROP TABLE "vendas";
ALTER TABLE "new_vendas" RENAME TO "vendas";
CREATE UNIQUE INDEX "vendas_mercadoPagoOrderId_key" ON "vendas"("mercadoPagoOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
