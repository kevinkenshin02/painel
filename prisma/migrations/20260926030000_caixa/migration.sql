-- CreateTable
CREATE TABLE "caixas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "abertoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" DATETIME,
    "trocoInicial" REAL NOT NULL DEFAULT 0,
    "abertoPorId" INTEGER,
    "fechadoPorId" INTEGER,
    "aberturaAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "dinheiroContado" REAL,
    "dinheiroEsperado" REAL,
    "observacaoAbertura" TEXT,
    "observacaoFechamento" TEXT,
    CONSTRAINT "caixas_abertoPorId_fkey" FOREIGN KEY ("abertoPorId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "caixas_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimentos_caixa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caixaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "vendaId" INTEGER,
    "ordemServicoId" INTEGER,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentos_caixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimentos_caixa_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos_os" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ordemServicoId" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "descricao" TEXT,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamentos_os_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pagamentos_os_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "movimentos_caixa_caixaId_idx" ON "movimentos_caixa"("caixaId");

-- CreateIndex
CREATE INDEX "pagamentos_os_ordemServicoId_idx" ON "pagamentos_os"("ordemServicoId");

-- Dados: o sinal já pago das OS existentes vira um pagamento registrado (sem entrar em caixa nenhum)
INSERT INTO "pagamentos_os" ("ordemServicoId", "valor", "formaPagamento", "descricao", "criadoEm")
SELECT "id", "sinalPago", 'OUTRO', 'Valor já pago antes do Painel 2.0', "criadoEm"
FROM "ordens_servico"
WHERE "sinalPago" > 0;
