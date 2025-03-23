const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Не используем nodeIntegration для безопасности
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Обработчик для выбора папки
ipcMain.handle('selectFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.mp3'))  // Фильтруем только MP3 файлы
    .map(file => path.join(folderPath, file));

  return files;
});

// Обработчик для загрузки файлов из папки
ipcMain.handle('loadFolderFiles', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.mp3'))  // Фильтруем только MP3 файлы
      .map(file => path.join(folderPath, file));

    return files;
  } catch (error) {
    console.error('Ошибка при загрузке файлов:', error);
    return [];
  }
});