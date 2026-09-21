-- AlterTable
ALTER TABLE "configuracao" ADD COLUMN "bairro" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "cep" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "cnpj" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "codigoMunicipio" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "complemento" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "inscricaoEstadual" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "logradouro" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "numero" TEXT;
ALTER TABLE "configuracao" ADD COLUMN "regimeTributario" TEXT;

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
    "satStatus" TEXT NOT NULL DEFAULT 'NAO_EMITIDO',
    "satChaveAcesso" TEXT,
    "satNumeroSessao" INTEGER,
    "satXmlRetorno" TEXT,
    "satMensagemErro" TEXT,
    "satEmitidoEm" DATETIME,
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
CREATE UNIQUE INDEX "vendas_satChaveAcesso_key" ON "vendas"("satChaveAcesso");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- O SAT exige códigos fiscais diferentes para crédito e débito, então
-- CARTAO_MAQUININHA virou CARTAO_CREDITO/CARTAO_DEBITO. Vendas antigas não
-- registravam a distinção: assume crédito, que é a maioria na loja.
UPDATE "vendas" SET "formaPagamento" = 'CARTAO_CREDITO' WHERE "formaPagamento" = 'CARTAO_MAQUININHA';
