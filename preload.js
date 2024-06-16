const { contextBridge, ipcRenderer } = require('electron/renderer')

window.addEventListener('DOMContentLoaded', () => {
  const { Terminal } = require('xterm');
  window.Terminal = Terminal;
});

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title)
})