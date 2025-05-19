// Store tasks in localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Function to save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Function to create a new task element
function createTaskElement(task) {
  const taskElement = document.createElement("div");
  taskElement.className = `task priority-${task.priority}`;
  taskElement.draggable = true;
  taskElement.id = task.id;

  taskElement.innerHTML = `
        <span class="priority-indicator"></span>
        ${task.text}
        <div class="task-actions">
            <button onclick="editTask('${task.id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteTask('${task.id}')" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

  taskElement.addEventListener("dragstart", drag);
  return taskElement;
}

// Function to add a new task
function addTask() {
  const input = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("taskPriority");
  const text = input.value.trim();

  if (text) {
    const task = {
      id: Date.now().toString(),
      text: text,
      priority: prioritySelect.value,
      column: "todo",
    };

    tasks.push(task);
    saveTasks();

    const taskElement = createTaskElement(task);
    document.querySelector("#todo .task-list").appendChild(taskElement);

    input.value = "";
  }
}

// Function to delete a task
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  document.getElementById(taskId).remove();
}

// Function to edit a task
function editTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  const currentPriority = task.priority;

  // Create a custom dialog for editing
  const dialog = document.createElement("div");
  dialog.className = "edit-dialog";

  // Escape special characters in task text to prevent HTML issues
  const escapedText = task.text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  dialog.innerHTML = `
        <div class="edit-dialog-content">
            <input type="text" id="editTaskText" value="${escapedText}" />
            <select id="editTaskPriority">
                <option value="low" ${
                  currentPriority === "low" ? "selected" : ""
                }>Low Priority</option>
                <option value="medium" ${
                  currentPriority === "medium" ? "selected" : ""
                }>Medium Priority</option>
                <option value="high" ${
                  currentPriority === "high" ? "selected" : ""
                }>High Priority</option>
            </select>
            <div class="edit-dialog-actions">
                <button onclick="saveEdit('${taskId}')">Save</button>
                <button onclick="cancelEdit()">Cancel</button>
            </div>
        </div>
    `;

  // Add dialog styles
  const styles = document.createElement("style");
  styles.textContent = `
        .edit-dialog {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .edit-dialog-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: 300px;
        }
        .edit-dialog-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .edit-dialog input,
        .edit-dialog select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .edit-dialog button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            background: #3498db;
            color: white;
        }
        .edit-dialog button:last-child {
            background: #95a5a6;
        }
    `;

  document.body.appendChild(styles);
  document.body.appendChild(dialog);
}

// Add new functions to handle the edit dialog
function saveEdit(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  const newText = document.getElementById("editTaskText").value.trim();
  const newPriority = document.getElementById("editTaskPriority").value;

  if (newText) {
    task.text = newText;
    task.priority = newPriority;
    saveTasks();

    const taskElement = document.getElementById(taskId);
    taskElement.className = `task priority-${newPriority}`;
    taskElement.innerHTML = `
            <span class="priority-indicator"></span>
            ${newText}
            <div class="task-actions">
                <button onclick="editTask('${taskId}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask('${taskId}')" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
  }

  cancelEdit();
}

function cancelEdit() {
  const dialog = document.querySelector(".edit-dialog");
  if (dialog) {
    dialog.remove();
  }
}

// Drag and Drop functions
function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const taskId = ev.dataTransfer.getData("text");
  const taskElement = document.getElementById(taskId);
  const targetList = ev.target.closest(".task-list");

  if (targetList) {
    targetList.appendChild(taskElement);

    // Update task's column in the tasks array
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.column = targetList.parentElement.id;
      saveTasks();
    }
  }
}

// Initialize the board
function initializeBoard() {
  tasks.forEach((task) => {
    const taskElement = createTaskElement(task);
    document
      .querySelector(`#${task.column} .task-list`)
      .appendChild(taskElement);
  });
}

// Event Listeners
document.getElementById("addTask").addEventListener("click", addTask);
document.getElementById("taskInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

// Add dragover animation
document.querySelectorAll(".task-list").forEach((list) => {
  list.addEventListener("dragenter", (e) => {
    e.preventDefault();
    list.classList.add("dragover");
  });

  list.addEventListener("dragleave", (e) => {
    e.preventDefault();
    list.classList.remove("dragover");
  });

  list.addEventListener("drop", (e) => {
    list.classList.remove("dragover");
  });
});

// Initialize the board when the page loads
initializeBoard();
