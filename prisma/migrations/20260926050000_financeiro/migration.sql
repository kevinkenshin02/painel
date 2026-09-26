-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "fornecedorId" INTEGER,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pagoEm" DATETIME,
    "valorPago" REAL,
    "formaPagamento" TEXT,
    "pagoPeloCaixa" BOOLEAN NOT NULL DEFAULT false,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "origem" TEXT NOT NULL DEFAULT 'AVULSA',
    "despesaFixaId" INTEGER,
    "competencia" TEXT,
    "notaId" INTEGER,
    "parcela" TEXT,
    "observacoes" TEXT,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "contas_pagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contas_pagar_despesaFixaId_fkey" FOREIGN KEY ("despesaFixaId") REFERENCES "despesas_fixas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contas_pagar_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_entrada" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contas_pagar_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_despesas_fixas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_despesas_fixas" ("ativo", "atualizadoEm", "criadoEm", "id", "nome", "observacao", "valor") SELECT "ativo", "atualizadoEm", "criadoEm", "id", "nome", "observacao", "valor" FROM "despesas_fixas";
DROP TABLE "despesas_fixas";
ALTER TABLE "new_despesas_fixas" RENAME TO "despesas_fixas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "contas_pagar_vencimento_idx" ON "contas_pagar"("vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "contas_pagar_despesaFixaId_competencia_key" ON "contas_pagar"("despesaFixaId", "competencia");
