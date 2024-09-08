let notes = JSON.parse(localStorage.getItem('notes')) || [];
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    // Determine which page we're on and run the appropriate initialization
    const currentPage = document.querySelector('.page.active');
    if (currentPage) {
        const pageId = currentPage.id;
        if (pageId === 'notes-page') {
            initNotesPage();
        } else if (pageId === 'data-table-page') {
            initDataTablePage();
        }
    }
});

function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
    } else {
        loadUserData();
    }
}

function loadUserData() {
    notes = JSON.parse(localStorage.getItem(`notes_${currentUser.email}`)) || [];
    tableData = JSON.parse(localStorage.getItem(`tableData_${currentUser.email}`)) || [];
}

function initNotesPage() {
    renderNotes();
    document.getElementById('noteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const hours = parseFloat(document.getElementById('hours').value);
        
        addNote({ title, description, hours });
        
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('hours').value = '';
    });

    // Add this block to handle logout on the billing page
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function initDataTablePage() {
    renderTable();
    const addDataBtn = document.getElementById('addDataBtn');
    const dataModal = document.getElementById('dataModal');
    const dataForm = document.getElementById('dataForm');
    const tableFilter = document.getElementById('tableFilter');
    const closeBtn = dataModal.querySelector('.close');

    addDataBtn.addEventListener('click', function() {
        // Clear the form when adding new data
        dataForm.reset();
        dataForm.onsubmit = handleAddData;
        dataModal.style.display = 'block';
    });

    function handleAddData(e) {
        e.preventDefault();
        const caseId = document.getElementById('caseId').value;
        const caption = document.getElementById('caption').value;
        const globalDeduplication = document.getElementById('globalDeduplication').value;
        const searchTerms = document.getElementById('searchTerms').value;
        
        addTableData({ caseId, caption, globalDeduplication, searchTerms });
        
        dataModal.style.display = 'none';
        dataForm.reset();
    }

    tableFilter.addEventListener('input', function() {
        renderTable(this.value);
    });

    closeBtn.addEventListener('click', function() {
        dataModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == dataModal) {
            dataModal.style.display = 'none';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function addNote(note) {
    const newNote = { 
        ...note, 
        id: Date.now(),
        createdAt: new Date().toLocaleDateString('en-US') // Add creation date
    };
    notes.push(newNote);
    saveNotes();
    renderNotes();
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function saveNotes() {
    localStorage.setItem(`notes_${currentUser.email}`, JSON.stringify(notes));
}

function renderNotes() {
    const noteList = document.getElementById('noteList');
    noteList.innerHTML = '<h2>Saved Notes</h2>';
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `
            <div class="note-header">
                <h3>${note.title}</h3>
                <span class="note-date">${note.createdAt}</span>
            </div>
            <div class="note-content">
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

function addTableData(data) {
    tableData.push(data);
    saveTableData();
    renderTable();
}

function saveTableData() {
    localStorage.setItem(`tableData_${currentUser.email}`, JSON.stringify(tableData));
}

function renderTable(filter = '') {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';
    
    const filteredData = tableData.filter(item => 
        Object.values(item).some(value => 
            value.toString().toLowerCase().includes(filter.toLowerCase())
        )
    );

    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.caseId}</td>
            <td>${item.caption}</td>
            <td>${item.globalDeduplication}</td>
            <td>${item.searchTerms}</td>
            <td class="actions-column">
                <button class="icon-btn edit-btn" data-caseid="${item.caseId}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete-btn" data-caseid="${item.caseId}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('#dataTable .edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const caseId = this.getAttribute('data-caseid');
            editTableData(caseId);
        });
    });

    document.querySelectorAll('#dataTable .delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const caseId = this.getAttribute('data-caseid');
            deleteTableData(caseId);
        });
    });
}

function editTableData(caseId) {
    const item = tableData.find(data => data.caseId === caseId);
    if (item) {
        document.getElementById('caseId').value = item.caseId;
        document.getElementById('caption').value = item.caption;
        document.getElementById('globalDeduplication').value = item.globalDeduplication;
        document.getElementById('searchTerms').value = item.searchTerms;

        const dataModal = document.getElementById('dataModal');
        dataModal.style.display = 'block';

        const dataForm = document.getElementById('dataForm');
        dataForm.onsubmit = function(e) {
            e.preventDefault();
            // Update the existing item
            item.caseId = document.getElementById('caseId').value;
            item.caption = document.getElementById('caption').value;
            item.globalDeduplication = document.getElementById('globalDeduplication').value;
            item.searchTerms = document.getElementById('searchTerms').value;

            saveTableData();
            renderTable();
            dataModal.style.display = 'none';
            dataForm.onsubmit = null; // Reset the onsubmit handler
        };
    }
}

function deleteTableData(caseId) {
    tableData = tableData.filter(item => item.caseId !== caseId);
    saveTableData();
    renderTable();
}
