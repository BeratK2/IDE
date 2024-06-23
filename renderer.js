const { ipcRenderer } = require('electron');
const Terminal = require('xterm').Terminal;

var term = new Terminal();
var directoryList = document.getElementById("directory")
term.open(document.getElementById("terminal"));
term.onData(e => {
  ipcRenderer.send("terminal.toTerm", e);
});

ipcRenderer.on("terminal.incData", function(event, data) {
  console.log("Something happened?");
  term.write(data);
});


/**----------------------
 **     CHANGE DIRECTORY
 *------------------------**/
ipcRenderer.on("directory-change", function(event, data) {
  console.log("Files: " + data);
  console.log("Directory changed!")
  
  // Loop through each file returned and append them
  for (var i = 0; i < data.length; i++) {
    var listItem = document.createElement("li");
    
    var alertButton = document.createElement("button");
    alertButton.textContent = data[i];
    
    // Add an event listener to the button
    alertButton.addEventListener("click", (function(item) {
        return function() {
            readFileContent(item);
        };
    })(data[i]));
    
    listItem.appendChild(alertButton);
    directoryList.appendChild(listItem);
}
  //term.write(data[0]);
})


/**----------------------
 **      READ CONTENT FROM SELECTED FILE 
 *------------------------**/
const readFileContent = (file) => {
  ipcRenderer.send("readFile", file)
}