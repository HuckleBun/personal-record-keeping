document.addEventListener("DOMContentLoaded", function () {
    initNotesPage();
});

function initNotesPage() {
    renderNotes();
    loadActivities();

    document.getElementById("noteForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const activity = document.getElementById("activity").value;
        const description = document.getElementById("description").value;
        const hours = parseFloat(document.getElementById("hours").value);

        addNote({ title, activity, description, hours });

        document.getElementById("title").value = "";
        document.getElementById("activity").value = "";
        document.getElementById("description").value = "";
        document.getElementById("hours").value = "";
    });
}

function loadActivities() {
    const activities = JSON.parse(localStorage.getItem("activities")) || [
        "ESI Stage, Preparation, and Process",
    ];
    const activitySelect = document.getElementById("activity");

    activitySelect.innerHTML = '<option value="">Select Activity</option>';

    activities.forEach((activity) => {
        const option = document.createElement("option");
        option.value = activity;
        option.textContent = activity;
        activitySelect.appendChild(option);
    });

    localStorage.setItem("activities", JSON.stringify(activities));
}

function addNote(note) {
    note.id = Date.now();
    note.createdAt = new Date().toISOString();
    notes.push(note);
    saveData();
    renderNotes();
}

function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id);
    saveData();
    renderNotes();
}

function renderNotes() {
    const noteList = document.getElementById("noteList");
    noteList.innerHTML = "<h2>Saved Billings</h2>";
    notes.forEach((note) => {
        const date = new Date(note.createdAt);
        const formattedDate = `${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date
            .getDate()
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;

        const noteElement = document.createElement("div");
        noteElement.className = "note";
        noteElement.innerHTML = `
            <div class="note-header">
                <h3>${note.title}</h3>
                <span class="note-date">${formattedDate}</span>
            </div>
            <div class="note-content">
                <p class="activity">Activity: ${note.activity}</p>
                <p class="description">${note.description}</p>
                <p class="hours">Hours: ${note.hours}</p>
            </div>
            <button class="delete-btn" onclick="deleteNote(${note.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        noteList.appendChild(noteElement);
    });
}

function saveData() {
    localStorage.setItem("notes", JSON.stringify(notes));
    updateFileControlsVisibility();
}

function updateFileControlsVisibility() {
    const fileControlsBilling = document.querySelector(".file-controls-billing");
    if (fileControlsBilling) {
        fileControlsBilling.style.display = notes.length > 0 ? "flex" : "none";
    }
}

let notes = JSON.parse(localStorage.getItem("notes")) || [];