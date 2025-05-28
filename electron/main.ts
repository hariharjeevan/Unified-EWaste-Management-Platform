import { app, Menu, BrowserWindow } from 'electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
    icon: __dirname + '/assets/favicon.ico'
  });

  // Load from deployment
  win.loadURL('https://unified-e-waste-management-platform.vercel.app');
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
