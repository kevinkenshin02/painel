import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DB_PATH = path.join(PROJECT_ROOT, "dev.db");
const BACKUP_DIR = path.join(
  process.env.USERPROFILE ?? PROJECT_ROOT,
  "OneDrive",
  "Backups-Painel-Tanaka"
);
const MAX_BACKUPS = 60;

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Banco não encontrado em ${DB_PATH}`);
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destPath = path.join(BACKUP_DIR, `dev-${timestamp}.db`);

  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    await db.backup(destPath);
    console.log(`Backup criado: ${destPath}`);
  } finally {
    db.close();
  }

  const arquivos = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("dev-") && f.endsWith(".db"))
    .sort();
  const excedente = arquivos.length - MAX_BACKUPS;
  if (excedente > 0) {
    for (const f of arquivos.slice(0, excedente)) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
    }
    console.log(`Removidos ${excedente} backups antigos (mantendo os últimos ${MAX_BACKUPS}).`);
  }
}

main().catch((err) => {
  console.error("Erro ao criar backup:", err);
  process.exit(1);
});
