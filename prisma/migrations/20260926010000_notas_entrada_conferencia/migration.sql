-- CreateTable
CREATE TABLE "notas_entrada" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chave" TEXT,
    "numero" TEXT NOT NULL,
    "serie" TEXT,
    "dataEmissao" DATETIME,
    "fornecedorId" INTEGER,
    "valorProdutos" REAL NOT NULL DEFAULT 0,
    "valorTotal" REAL NOT NULL DEFAULT 0,
    "parcelas" TEXT,
    "observacoes" TEXT,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notas_entrada_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notas_entrada_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notas_entrada_itens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notaId" INTEGER NOT NULL,
    "produtoId" INTEGER,
    "codigoFornecedor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ean" TEXT,
    "ncm" TEXT,
    "quantidade" REAL NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "valorTotal" REAL NOT NULL,
    "lancado" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "notas_entrada_itens_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_entrada" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notas_entrada_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_produtos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "referencia" TEXT,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "descricao" TEXT NOT NULL,
    "cor" TEXT,
    "publico" TEXT,
    "mecanismo" TEXT,
    "grau" TEXT,
    "ncm" TEXT,
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "localizacao" TEXT,
    "fornecedorId" INTEGER,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "custoUnitario" REAL NOT NULL DEFAULT 0,
    "precoVenda" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "aConferir" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "produtos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_produtos" ("ativo", "atualizadoEm", "codigo", "codigoBarras", "cor", "criadoEm", "custoUnitario", "descricao", "estoqueMinimo", "fornecedorId", "grau", "id", "localizacao", "marca", "mecanismo", "ncm", "observacoes", "precoVenda", "publico", "quantidade", "referencia", "tipo", "unidade") SELECT "ativo", "atualizadoEm", "codigo", "codigoBarras", "cor", "criadoEm", "custoUnitario", "descricao", "estoqueMinimo", "fornecedorId", "grau", "id", "localizacao", "marca", "mecanismo", "ncm", "observacoes", "precoVenda", "publico", "quantidade", "referencia", "tipo", "unidade" FROM "produtos";
DROP TABLE "produtos";
ALTER TABLE "new_produtos" RENAME TO "produtos";
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");
CREATE INDEX "produtos_tipo_marca_idx" ON "produtos"("tipo", "marca");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "notas_entrada_chave_key" ON "notas_entrada"("chave");
