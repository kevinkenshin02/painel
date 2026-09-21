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
INSERT INTO "new_configuracao" ("atualizadoEm", "endereco", "id", "nomeLoja", "whatsapp") SELECT "atualizadoEm", "endereco", "id", "nomeLoja", "whatsapp" FROM "configuracao";
DROP TABLE "configuracao";
ALTER TABLE "new_configuracao" RENAME TO "configuracao";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
