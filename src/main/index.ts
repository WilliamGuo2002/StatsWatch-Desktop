import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'node:path';
import { IPC } from '../shared/ipc';
import { overfast } from './overfast/client';
import { handle } from './ipc/envelope';
import { registerCaptureIpc } from './ipc/matchGate';

const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

function registerOverfastIpc(): void {
  // Career data from public profiles. Not match data, so not gated.
  const routes: Record<string, (...a: never[]) => Promise<unknown>> = {
    [IPC.overfast.searchPlayers]: overfast.searchPlayers as never,
    [IPC.overfast.playerSummary]: overfast.playerSummary as never,
    [IPC.overfast.playerStatsSummary]: overfast.playerStatsSummary as never,
    [IPC.overfast.playerCareerStats]: overfast.playerCareerStats as never,
    [IPC.overfast.heroes]: overfast.heroes as never,
    [IPC.overfast.heroDetail]: overfast.heroDetail as never,
    [IPC.overfast.heroGlobalStats]: overfast.heroGlobalStats as never,
    [IPC.overfast.maps]: overfast.maps as never,
    [IPC.overfast.gamemodes]: overfast.gamemodes as never,
  };

  for (const [channel, fn] of Object.entries(routes)) {
    handle(channel, (_event, ...args) => fn(...(args as never[])));
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0e1a',
    show: false,
    // Desktop chrome, not a browser frame: we draw the title bar ourselves
    // and let Windows render its native min/max/close over our colour.
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#060a14',
      symbolColor: '#9ca3af',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // External links go to the user's browser, never a new Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // No File/Edit/View/Window menu — this is an app, not a browser.
  Menu.setApplicationMenu(null);

  registerOverfastIpc();
  registerCaptureIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
