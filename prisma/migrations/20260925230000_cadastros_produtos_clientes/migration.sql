-- Painel 2.0 (etapa 2): clientes + receitas, fornecedores e produtos numa ficha só
-- (relógios, armações e lentes), com movimentação de estoque e histórico de preços.
-- Ordem pensada para NÃO perder dados: cria as tabelas novas, copia os dados das
-- antigas, liga vendas/OS aos cadastros e só no fim apaga as tabelas antigas.

-- CreateTable
CREATE TABLE "clientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL DEFAULT '',
    "cpf" TEXT,
    "email" TEXT,
    "nascimento" DATETIME,
    "endereco" TEXT,
    "origem" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "dataReceita" DATETIME,
    "medico" TEXT,
    "tipoLente" TEXT,
    "odEsferico" TEXT,
    "odCilindrico" TEXT,
    "odEixo" TEXT,
    "odAdicao" TEXT,
    "odPrisma" TEXT,
    "odBase" TEXT,
    "oeEsferico" TEXT,
    "oeCilindrico" TEXT,
    "oeEixo" TEXT,
    "oeAdicao" TEXT,
    "oePrisma" TEXT,
    "oeBase" TEXT,
    "dp" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receitas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "representante" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "produtos" (
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
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "produtos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL,
    "custoUnitario" REAL,
    "motivo" TEXT,
    "vendaId" INTEGER,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentos_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "movimentos_estoque_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_precos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "precoVenda" REAL NOT NULL,
    "origem" TEXT,
    "funcionarioId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historico_precos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historico_precos_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------------
-- Dados: fornecedores a partir do texto livre do estoque antigo
-- ("A definir" vira sem fornecedor; "ORIENT" é a mesma Orient Relógios da Amazônia)
-- ---------------------------------------------------------------------------
INSERT INTO "fornecedores" ("nome", "criadoEm", "atualizadoEm")
SELECT "nome", strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now'), strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now')
FROM (
    SELECT DISTINCT CASE WHEN UPPER(TRIM("f")) = 'ORIENT' THEN 'Orient Relógios da Amazônia' ELSE TRIM("f") END AS "nome"
    FROM (
        SELECT "fornecedor" AS "f" FROM "estoque_relogios"
        UNION SELECT "fornecedor" FROM "estoque_armacoes"
        UNION SELECT "fornecedor" FROM "estoque_lentes"
    )
    WHERE TRIM("f") <> '' AND LOWER(TRIM("f")) <> 'a definir'
)
ORDER BY "nome";

-- Dados: produtos (relógios)
INSERT INTO "produtos" ("codigo", "tipo", "marca", "descricao", "publico", "mecanismo", "fornecedorId", "quantidade", "custoUnitario", "precoVenda", "ativo", "criadoEm", "atualizadoEm")
SELECT
    r."codigo",
    'RELOGIO',
    CASE r."marca"
        WHEN 'ORIENT' THEN 'Orient'
        WHEN 'MAGNUM' THEN 'Magnum'
        WHEN 'LINCE' THEN 'Lince'
        WHEN 'X_WATCH' THEN 'X-Watch'
        WHEN 'COSMOS' THEN 'Cosmos'
        WHEN 'CHAMPION' THEN 'Champion'
        WHEN 'SKMEI' THEN 'Skmei'
        ELSE COALESCE(NULLIF(TRIM(r."marcaOutro"), ''), 'Outra')
    END,
    r."modeloReferencia",
    r."tipoPublico",
    r."tipoMecanismo",
    (SELECT f."id" FROM "fornecedores" f
      WHERE f."nome" = CASE WHEN UPPER(TRIM(r."fornecedor")) = 'ORIENT' THEN 'Orient Relógios da Amazônia' ELSE TRIM(r."fornecedor") END),
    r."quantidade",
    r."custoUnitario",
    r."precoVenda",
    r."ativo",
    r."criadoEm",
    r."atualizadoEm"
FROM "estoque_relogios" r
ORDER BY r."id";

-- Dados: produtos (armações) — código repetido ganha o prefixo ARM-
INSERT INTO "produtos" ("codigo", "tipo", "descricao", "cor", "fornecedorId", "quantidade", "custoUnitario", "precoVenda", "ativo", "criadoEm", "atualizadoEm")
SELECT
    CASE WHEN EXISTS (SELECT 1 FROM "produtos" p WHERE p."codigo" = a."codigo") THEN 'ARM-' || a."codigo" ELSE a."codigo" END,
    'ARMACAO',
    a."marcaModelo",
    NULLIF(TRIM(a."corReferencia"), ''),
    (SELECT f."id" FROM "fornecedores" f
      WHERE f."nome" = CASE WHEN UPPER(TRIM(a."fornecedor")) = 'ORIENT' THEN 'Orient Relógios da Amazônia' ELSE TRIM(a."fornecedor") END),
    a."quantidade",
    a."custoUnitario",
    a."precoVenda",
    a."ativo",
    a."criadoEm",
    a."atualizadoEm"
FROM "estoque_armacoes" a
ORDER BY a."id";

-- Dados: produtos (lentes prontas) — código repetido ganha o prefixo LEN-
INSERT INTO "produtos" ("codigo", "tipo", "descricao", "grau", "fornecedorId", "quantidade", "custoUnitario", "precoVenda", "ativo", "criadoEm", "atualizadoEm")
SELECT
    CASE WHEN EXISTS (SELECT 1 FROM "produtos" p WHERE p."codigo" = l."codigo") THEN 'LEN-' || l."codigo" ELSE l."codigo" END,
    'LENTE_PRONTA',
    l."descricao",
    NULLIF(TRIM(l."grau"), ''),
    (SELECT f."id" FROM "fornecedores" f
      WHERE f."nome" = CASE WHEN UPPER(TRIM(l."fornecedor")) = 'ORIENT' THEN 'Orient Relógios da Amazônia' ELSE TRIM(l."fornecedor") END),
    l."quantidade",
    l."custoUnitario",
    l."precoVenda",
    l."ativo",
    l."criadoEm",
    l."atualizadoEm"
FROM "estoque_lentes" l
ORDER BY l."id";

-- Dados: estoque inicial e preço inicial de cada produto
INSERT INTO "movimentos_estoque" ("produtoId", "tipo", "quantidade", "saldo", "custoUnitario", "motivo", "criadoEm")
SELECT "id", 'CADASTRO', "quantidade", "quantidade", "custoUnitario", 'Estoque que já estava no Painel (antes da versão 2.0)', "criadoEm"
FROM "produtos";

INSERT INTO "historico_precos" ("produtoId", "custoUnitario", "precoVenda", "origem", "criadoEm")
SELECT "id", "custoUnitario", "precoVenda", 'Preço que já estava no Painel', "criadoEm"
FROM "produtos";

-- Dados: clientes a partir das OS (mesmo nome + mesmo telefone = mesmo cliente)
INSERT INTO "clientes" ("nome", "telefone", "criadoEm", "atualizadoEm")
SELECT
    TRIM("clienteNome"),
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clienteWhatsapp", '(', ''), ')', ''), ' ', ''), '-', ''), '.', ''), '+', ''),
    MIN("criadoEm"),
    MAX("atualizadoEm")
FROM "ordens_servico"
GROUP BY LOWER(TRIM("clienteNome")),
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("clienteWhatsapp", '(', ''), ')', ''), ' ', ''), '-', ''), '.', ''), '+', '')
ORDER BY MIN("id");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ordens_servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataEntrada" DATETIME NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteWhatsapp" TEXT NOT NULL,
    "clienteId" INTEGER,
    "tipoServico" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazoPrometido" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "valorTotal" REAL NOT NULL,
    "sinalPago" REAL NOT NULL DEFAULT 0,
    "dataEntrega" DATETIME,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ordens_servico" ("atualizadoEm", "clienteNome", "clienteWhatsapp", "clienteId", "criadoEm", "dataEntrada", "dataEntrega", "descricao", "id", "observacoes", "prazoPrometido", "sinalPago", "status", "tipoServico", "valorTotal")
SELECT o."atualizadoEm", o."clienteNome", o."clienteWhatsapp",
    (SELECT c."id" FROM "clientes" c
      WHERE LOWER(c."nome") = LOWER(TRIM(o."clienteNome"))
        AND c."telefone" = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(o."clienteWhatsapp", '(', ''), ')', ''), ' ', ''), '-', ''), '.', ''), '+', '')),
    o."criadoEm", o."dataEntrada", o."dataEntrega", o."descricao", o."id", o."observacoes", o."prazoPrometido", o."sinalPago", o."status", o."tipoServico", o."valorTotal"
FROM "ordens_servico" o;
DROP TABLE "ordens_servico";
ALTER TABLE "new_ordens_servico" RENAME TO "ordens_servico";
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
    "produtoId" INTEGER,
    "clienteId" INTEGER,
    "funcionarioId" INTEGER,
    CONSTRAINT "vendas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vendas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- venda ligada a relógio/armação/lente do estoque antigo passa a apontar para o produto de mesmo código
INSERT INTO "new_vendas" ("canalOrigem", "categoria", "clienteNome", "criadoEm", "custoTotal", "dataVenda", "descricao", "formaPagamento", "funcionarioId", "id", "mercadoPagoOrderId", "quantidade", "statusPagamento", "valorVendido", "produtoId")
SELECT v."canalOrigem", v."categoria", v."clienteNome", v."criadoEm", v."custoTotal", v."dataVenda", v."descricao", v."formaPagamento", v."funcionarioId", v."id", v."mercadoPagoOrderId", v."quantidade", v."statusPagamento", v."valorVendido",
    COALESCE(
        (SELECT p."id" FROM "produtos" p JOIN "estoque_relogios" r ON r."codigo" = p."codigo" AND p."tipo" = 'RELOGIO' WHERE r."id" = v."relogioId"),
        (SELECT p."id" FROM "produtos" p JOIN "estoque_armacoes" a ON p."tipo" = 'ARMACAO' AND (p."codigo" = a."codigo" OR p."codigo" = 'ARM-' || a."codigo") WHERE a."id" = v."armacaoId"),
        (SELECT p."id" FROM "produtos" p JOIN "estoque_lentes" l ON p."tipo" = 'LENTE_PRONTA' AND (p."codigo" = l."codigo" OR p."codigo" = 'LEN-' || l."codigo") WHERE l."id" = v."lenteId")
    )
FROM "vendas" v;
DROP TABLE "vendas";
ALTER TABLE "new_vendas" RENAME TO "vendas";
CREATE UNIQUE INDEX "vendas_mercadoPagoOrderId_key" ON "vendas"("mercadoPagoOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Só agora apaga o estoque antigo (os dados já foram copiados para "produtos")
-- DropIndex
DROP INDEX "estoque_armacoes_codigo_key";

-- DropIndex
DROP INDEX "estoque_lentes_codigo_key";

-- DropIndex
DROP INDEX "estoque_relogios_codigo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "estoque_armacoes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "estoque_lentes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "estoque_relogios";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE INDEX "clientes_telefone_idx" ON "clientes"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE INDEX "produtos_tipo_marca_idx" ON "produtos"("tipo", "marca");

-- CreateIndex
CREATE INDEX "movimentos_estoque_produtoId_criadoEm_idx" ON "movimentos_estoque"("produtoId", "criadoEm");

-- CreateIndex
CREATE INDEX "historico_precos_produtoId_criadoEm_idx" ON "historico_precos"("produtoId", "criadoEm");
