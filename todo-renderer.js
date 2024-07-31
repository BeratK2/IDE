const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const addBtn = document.getElementById('addBtn');

addBtn.addEventListener('click', function(){
    const li = document.createElement('li');
    const text = document.createTextNode(todoInput.value);

    const doneBtn = document.createElement('button');
    doneBtn.textContent = "Done"
    doneBtn.classList.add("done-btn")
   
    doneBtn.addEventListener('click', function(){
        li.classList.toggle('complete')
    })

    li.appendChild(text);
    li.appendChild(doneBtn);
    
    todoList.appendChild(li);
    todoInput.value = ""
})