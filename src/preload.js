const {
  contextBridge,
  ipcRenderer
} = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: title => ipcRenderer.send('set-title', title),
  clearData: mode => ipcRenderer.send('storage-clear', mode),
  createWindow: opinion => ipcRenderer.send('create-window', opinion)
})

contextBridge.exposeInMainWorld('action', {
  writeFile: opinion => ipcRenderer.invoke('file-writeIn', opinion),
  createFile: path => ipcRenderer.invoke('fse-create', path),
  readFile: opinion => ipcRenderer.invoke('file-read', opinion),
  exist: path => ipcRenderer.invoke('file-exist', path),
  deleteFolder: pathSet => ipcRenderer.invoke('fse-delete-folder', pathSet),
  hash: (obj, hashType) => ipcRenderer.invoke('hash-encode', obj, hashType)
})

contextBridge.exposeInMainWorld('extraAPI', {
  natural: async str => ipcRenderer.invoke('module-natural', str),
  fixCase: strSet => ipcRenderer.invoke('module-change-case', strSet),
  isWord: str => ipcRenderer.invoke('module-natural-WordTokenizer', str)
})