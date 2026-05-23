import { app, BrowserWindow, Menu, globalShortcut } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// WSL2/WSLg: request 60 ms PulseAudio buffer (default is ~200 ms)
process.env.PULSE_LATENCY_MSEC = '60'

// Disable Chromium's autoplay restriction so Web Audio works without gesture
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// WSL2 / WSLg: pass the PulseAudio server path directly to Chromium's audio
// service. The sandboxed audio process can't inherit env vars, so it won't
// find WSLg's PulseServer on its own.
if (process.env.PULSE_SERVER) {
  app.commandLine.appendSwitch('pulse-server', process.env.PULSE_SERVER)
}
// Also run audio in-process to avoid the out-of-process sandbox blocking the socket
app.commandLine.appendSwitch('disable-features', 'AudioServiceOutOfProcess')

let win: BrowserWindow | null

function createWindow() {
  Menu.setApplicationMenu(null)

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Ensure the window is never silently muted by Electron's background-tab policy
  win.webContents.setAudioMuted(false)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open DevTools automatically in dev mode
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  globalShortcut.register('F12', () => {
    win?.webContents.toggleDevTools()
  })
})
