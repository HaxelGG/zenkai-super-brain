const { app, BrowserWindow, Menu, shell, nativeTheme, session } = require("electron");
const path = require("path");

const JARVIS_URL =
  process.env.JARVIS_URL || "https://panel.zenkai.systems/jarvis/";

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  nativeTheme.themeSource = "dark";

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: "JARVIS · ZENKAI",
    backgroundColor: "#030810",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "jarvis-icon.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed = url.startsWith(JARVIS_URL.split("/jarvis")[0]) || url.includes("/jarvis");
    if (!allowed && url.startsWith("http")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(JARVIS_URL);

  const menu = Menu.buildFromTemplate([
    {
      label: "JARVIS",
      submenu: [
        { role: "reload", label: "Recargar" },
        { role: "forceReload", label: "Forzar recarga" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Pantalla completa" },
        { type: "separator" },
        { role: "quit", label: "Salir" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "resetZoom", label: "Zoom normal" },
        { role: "zoomIn", label: "Acercar" },
        { role: "zoomOut", label: "Alejar" },
        { type: "separator" },
        { role: "toggledevtools", label: "DevTools" },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media");
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === "media");
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
