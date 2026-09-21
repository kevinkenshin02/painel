/*
  Warnings:

  - You are about to drop the column `bairro` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `cep` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `codigoMunicipio` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `complemento` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `logradouro` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `configuracao` table. All the data in the column will be lost.
  - You are about to drop the column `regimeTributario` on the `configuracao` table. All the data in the column will be lost.

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
    "cnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_configuracao" ("atualizadoEm", "cnpj", "endereco", "id", "inscricaoEstadual", "metaDiaria", "metaMensal", "nomeLoja", "whatsapp") SELECT "atualizadoEm", "cnpj", "endereco", "id", "inscricaoEstadual", "metaDiaria", "metaMensal", "nomeLoja", "whatsapp" FROM "configuracao";
DROP TABLE "configuracao";
ALTER TABLE "new_configuracao" RENAME TO "configuracao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
