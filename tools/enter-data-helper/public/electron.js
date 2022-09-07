const electron = require('electron');
const app = electron.app;

const path = require('path');
const isDev = require('electron-is-dev');
const remote = require('@electron/remote/main');
remote.initialize();

let mainWindow;

function createWindow() {
  mainWindow = new electron.BrowserWindow(
    {
      width: 900, height: 680, webPreferences: { nodeIntegration: true, contextIsolation: false, enableRemoteModule: true }, icon: path.join(__dirname, 'logo.png')
    }
  );
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.on('closed', () => mainWindow = null);
  remote.enable(mainWindow.webContents);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
