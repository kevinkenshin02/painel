-- CreateTable
CREATE TABLE "estoque_armacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "marcaModelo" TEXT NOT NULL,
    "corReferencia" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "dataEntrada" DATETIME NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "precoVenda" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "estoque_relogios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "marcaOutro" TEXT,
    "modeloReferencia" TEXT NOT NULL,
    "tipoPublico" TEXT NOT NULL,
    "tipoMecanismo" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "dataEntrada" DATETIME NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "precoVenda" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataEntrada" DATETIME NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteWhatsapp" TEXT NOT NULL,
    "tipoServico" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazoPrometido" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "valorTotal" REAL NOT NULL,
    "sinalPago" REAL NOT NULL DEFAULT 0,
    "dataEntrega" DATETIME,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataVenda" DATETIME NOT NULL,
    "clienteNome" TEXT,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "custoTotal" REAL NOT NULL,
    "valorVendido" REAL NOT NULL,
    "canalOrigem" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "armacaoId" INTEGER,
    "relogioId" INTEGER,
    CONSTRAINT "vendas_armacaoId_fkey" FOREIGN KEY ("armacaoId") REFERENCES "estoque_armacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_relogioId_fkey" FOREIGN KEY ("relogioId") REFERENCES "estoque_relogios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "despesas_mensais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesReferencia" TEXT NOT NULL,
    "aluguel" REAL NOT NULL DEFAULT 0,
    "aguaLuzInternet" REAL NOT NULL DEFAULT 0,
    "impostos" REAL NOT NULL DEFAULT 0,
    "outrasDespesas" REAL NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "estoque_armacoes_codigo_key" ON "estoque_armacoes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_relogios_codigo_key" ON "estoque_relogios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_mensais_mesReferencia_key" ON "despesas_mensais"("mesReferencia");
