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
const { promisify } = require('util')
const isMac = process.platform === "darwin";


var shell = os.platform() === "win32" ? "powershell.exe" : "bash"; // Shell variable
var directory = "";
var fileContent = ""
var directoryFiles = []
var directoryFileContents = []

const readFilePromise = promisify(fs.readFile);
const readdirPromise = promisify(fs.readdir);
const statPromise = promisify(fs.stat);



/**----------------------
 **      METHOD TO PROCESS FILES
 *------------------------**/
/*
 async function processFiles(directory) {
  try {
    directoryFiles = await readdirPromise(directory);

    for (const file of directoryFiles) {
      const filePath = path.join(directory, file);
      const fileStat = await statPromise(filePath);

      if (fileStat.isDirectory()) {
        // If it is a directory, read its contents
        const dirContents = await readdirPromise(filePath);
        directoryFileContents.push(dirContents);
        //console.log("This is a directory!")
      } else {
        // If it is a file, read its contents
        try {
          const data = await readFilePromise(filePath, 'utf-8');
          directoryFileContents.push(data);
          //console.log("This is a file!")

        } catch (err) {
          console.log(err);
          directoryFileContents.push(null);
        }
      }
    }

  } catch (err) {
    console.error('Error reading directory:', err);
  }

  console.log("Contents: " + directoryFileContents[4]);
}
*/

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

            // Get directory, its files, and each file's content
            .then((result) => {
              // Get directory
              directory = result.filePaths[0];
              directoryFiles = fs.readdirSync(directory);
              
              //console.log(directoryFiles.length)
              // Get file content
              //processFiles(directory)

                /*fs.readFile(directory + '/' + directoryFiles[i] , 'utf-8', (err, data) => {
                  console.log(i);

                  if(err){
                    directoryFileContents.push(data);
                    console.log(i)
                  }
                  //console.log(data);
                  //directoryFileContents.push(data);
                  //console.log(directoryFileContents[i]);

                  //console.log(i);
                  //console.log(directoryFiles.length);
                });*/
              
              //console.log("Contents: " + directoryFileContents[4]);

              //console.log(directory);
              console.log(directoryFiles);

              ptyProcess.write("cd " + directory + '\r');
              win.webContents.send("directory-change", directoryFiles)
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

  // Start terminal
  ptyProcess.on("data", function (data) {
    console.log("Pty Data: " + data);
    win.webContents.send("terminal.incData", data);
  });

  ipcMain.on("terminal.toTerm", function (event, data) {
    console.log("Terminal data: " + data)
    ptyProcess.write(data);
  });

  // Read file
  ipcMain.on("readFile", function(event, data){ 
     console.log((fs.readFileSync(directory + "/" + data).toString()));
  })
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
