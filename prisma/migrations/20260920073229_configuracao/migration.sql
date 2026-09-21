-- CreateTable
CREATE TABLE "configuracao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomeLoja" TEXT NOT NULL DEFAULT 'Óticas Tanaka e Relojoaria',
    "endereco" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "atualizadoEm" DATETIME NOT NULL
);
