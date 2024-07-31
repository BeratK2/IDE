//import * as monaco from 'monaco-editor';
const { ipcRenderer } = require("electron");
const { Terminal } = require("xterm");

var editor;
var term = new Terminal();
var directoryList = document.getElementById("directory");
var selectedFile = "";
var selectedFileContent = "";

console.log("Editor: " + editor);

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
 **      READ CONTENT FROM SELECTED FILE AND APPEND TO ACE EDITOR
 *------------------------**/
// Send requested file
const readFileContent = (file) => {

  ipcRenderer.send("read-file", file); 
};

// Get read file content and append it to the editor
ipcRenderer.on("display-content", function (event, data) {
  // Append data to editor 
  document.getElementById("editor").append(data);
  editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");

  // Set selectedFileContent to
  editor.session.on('change', function() {
    console.log();
  });
  
});

/**======================
 **      SAVE FILE
 *========================**/
ipcRenderer.on("file-saved", function (event, data){
  if(!editor){
    alert("Please choose a file")
  }
  else{
    selectedFileContent = editor.getValue();
    ipcRenderer.send("write-to-file", {file: selectedFile, fileContent: selectedFileContent});
  }
})