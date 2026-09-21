const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const PORT = process.env.DESKTOP_PORT || "3100";
const PROJECT_ROOT = path.join(__dirname, "..");

let serverProcess;
let mainWindow;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error("Servidor Next.js não respondeu a tempo."));
            return;
          }
          setTimeout(tryOnce, 300);
        });
    };
    tryOnce();
  });
}

function rodarBackup() {
  const backupScript = path.join(PROJECT_ROOT, "scripts", "backup.mjs");
  const backupProcess = spawn(process.execPath, [backupScript], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });
  backupProcess.on("error", (err) => {
    console.error("Falha ao iniciar backup:", err);
  });
}

function startNextServer() {
  const nextBin = path.join(
    PROJECT_ROOT,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  serverProcess = spawn(process.execPath, [nextBin, "start", "-p", PORT], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Servidor Next.js encerrou com código ${code}`);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "Óticas Tanaka | Painel de gestão",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
}

const temAFechadura = app.requestSingleInstanceLock();

if (!temAFechadura) {
  // Já tem um Painel Tanaka aberto — não sobe um segundo servidor/janela.
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startNextServer();
    try {
      await waitForServer(`http://localhost:${PORT}`);
    } catch (err) {
      console.error(err);
    }
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (serverProcess) serverProcess.kill();
    rodarBackup();
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    if (serverProcess) serverProcess.kill();
  });
}
