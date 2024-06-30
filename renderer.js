//import * as monaco from 'monaco-editor';
const { ipcRenderer } = require("electron");
const { Terminal } = require("xterm");

var term = new Terminal();
var directoryList = document.getElementById("directory");
var selectedFile = "";

term.open(document.getElementById("terminal"));
term.onData((e) => {
  ipcRenderer.send("terminal.toTerm", e);
});

ipcRenderer.on("terminal.incData", function (event, data) {
  console.log("Something happened?");
  term.write(data);
});

/**----------------------
 **     CHANGE DIRECTORY
 *------------------------**/
ipcRenderer.on("directory-change", function (event, data) {
  console.log("Files: " + data);
  console.log("Directory changed!");

  // Loop through each file returned and append them
  for (var i = 0; i < data.length; i++) {
    var listItem = document.createElement("li");

    var alertButton = document.createElement("button");
    alertButton.textContent = data[i];

    // Add an event listener to the button
    alertButton.addEventListener(
      "click",
      (function (item) {
        return function () {
          readFileContent(item);
          selectedFile = item;
          console.log(selectedFile);
        };
      })(data[i])
    );

    listItem.appendChild(alertButton);
    directoryList.appendChild(listItem);
  }
  //term.write(data[0]);
});

/**----------------------
 **      READ CONTENT FROM SELECTED FILE
 *------------------------**/
// Send requested file
const readFileContent = (file) => {
  ipcRenderer.send("read-file", file);
};

// Get read file content and append it to the editor
ipcRenderer.on("display-content", function (event, data) {
  document.getElementById("file-content").append(data);

  //require.config({ paths: { vs: "./node_modules/monaco-editor/min/vs" } });
  //oadMonacoEditor(data); // Pass the data to the Monaco Editor initialization function
});


/* Load Monaco Editor using AMD loader
function loadMonacoEditor(data) {
  require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' }});
  require(['vs/editor/editor.main'], function() {
    monaco.editor.create(document.getElementById('editor'), {
      value: data || '',
      language: 'javascript',
      automaticLayout: true,
    });
  });
}
*/