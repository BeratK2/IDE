const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  globalShortcut,
  ipcRenderer,
} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const pty = require("node-pty");
const isMac = process.platform === "darwin";

var shell = os.platform() === "win32" ? "powershell.exe" : "bash"; // Shell variable
var directory = "";
var directoryFiles = []


// Terminal
var ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env,
});

/**----------------------
 **      MENU TEMPLATE
 *------------------------**/
const template = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  {
    label: "File",
    submenu: [
      {
        // Open Folder Button
        label: "Open Folder",

        // Open directory from path
        click() {
          dialog
            .showOpenDialog({
              defaultPath: directory || app.getPath("desktop"),
              buttonLabel: "Open",
              properties: ["openDirectory"],
            })

            // Get directory and its files
            .then((result) => {
              directory = result.filePaths[0];
              directoryFiles = fs.readdirSync(directory);
              console.log("Directory: " + directory);
              console.log("Files: " + directoryFiles);

              ptyProcess.write("cd " + directory + '\r');
              win.webContents.send("directory-change", directoryFiles)
              console.log(directoryFiles)
              // ["cd ." + directory + '\r', directoryFiles]
            })
            .catch((err) => {
              console.error(err);
            });
        },
      },
      isMac ? { role: "close" } : { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...(isMac
        ? [
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
              label: "Speech",
              submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
          ]
        : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
            { type: "separator" },
            { role: "front" },
            { type: "separator" },
            { role: "window" },
          ]
        : [{ role: "close" }]),
    ],
  },
  {
    label: "Terminal",
    submenu: [
      { role: "minimize", label: "New Terminal" },
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
            { type: "separator" },
            { role: "front" },
            { type: "separator" },
            { role: "window" },
          ]
        : [{ role: "close" }]),
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://electronjs.org");
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

/**----------------------
 **      APP INITIALIZATION
 *------------------------**/
// Create window
let win;
const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
   },
  });

  win.loadFile("index.html");

  // Close window
  win.on("closed", function () {
    win = null;
  });


  ptyProcess.on("data", function (data) {
    console.log("Pty Data: " + data);
    win.webContents.send("terminal.incData", data);
  });

  ipcMain.on("terminal.toTerm", function (event, data) {
    console.log("Terminal data: " + data)
    ptyProcess.write(data);
  });
};

// CLose app when all windows are closed if not on Mac
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// App activation
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
