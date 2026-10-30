const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pooldeskDatabase', {
  load: () => ipcRenderer.invoke('pooldesk:load-state'),
  save: state => ipcRenderer.invoke('pooldesk:save-state', state),
  printers: () => ipcRenderer.invoke('pooldesk:printers'),
  print: pageSize => ipcRenderer.invoke('pooldesk:print', pageSize)
});
