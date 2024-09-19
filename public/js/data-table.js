document.addEventListener("DOMContentLoaded", function () {
    initDataTablePage();
    attachEventListeners();
});

function initDataTablePage() {
    renderTable();
    const addDataBtn = document.getElementById("addDataBtn");
    const dataModal = document.getElementById("dataModal");
    const dataForm = document.getElementById("dataForm");
    const tableFilter = document.getElementById("tableFilter");
    const closeBtn = dataModal.querySelector(".close");
    const searchTermsBox = document.getElementById("searchTerms");
    const submitDataBtn = document.getElementById("submitDataBtn");

    addDataBtn.addEventListener("click", function () {
        dataForm.reset();
        dataForm.onsubmit = handleAddData;
        dataModal.style.display = "flex";
    });

    tableFilter.addEventListener("input", function () {
        renderTable(this.value);
    });

    closeBtn.addEventListener("click", function () {
        dataModal.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target == dataModal) {
            dataModal.style.display = "none";
        }
    });

    submitDataBtn.addEventListener("click", handleAddData);

    initTermsModal();
}

function initTermsModal() {
    const addTermsBtn = document.getElementById("addTermsBtn");
    const termsModal = document.getElementById("termsModal");
    const termsForm = document.getElementById("termsForm");
    const termInput = document.getElementById("termInput");
    const addTermBtn = document.getElementById("addTermBtn");
    const termsList = document.getElementById("termsList");
    const termsCloseBtn = termsModal.querySelector(".close");

    addTermsBtn.addEventListener("click", function() {
        terms = Array.from(document.querySelectorAll('#searchTerms .search-term')).map(span => span.textContent);
        renderTermsList();
        termsModal.style.display = "block";
    });

    addTermBtn.addEventListener("click", addTerm);

    termInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTerm();
        }
    });

    termsForm.addEventListener("submit", function(e) {
        e.preventDefault();
        renderSearchTerms();
        termsModal.style.display = "none";
    });

    termsCloseBtn.addEventListener("click", function() {
        termsModal.style.display = "none";
    });
}

function addTerm() {
    const termInput = document.getElementById("termInput");
    const term = termInput.value.trim();
    if (term && !terms.includes(term)) {
        terms.push(term);
        renderTermsList();
        termInput.value = "";
    }
}

function renderTermsList() {
    const termsList = document.getElementById("termsList");
    termsList.innerHTML = terms.map(term => `
        <div class="term-item">
            ${term}
            <button type="button" class="remove-term" data-term="${term}">Remove</button>
        </div>
    `).join('');

    document.querySelectorAll(".remove-term").forEach(btn => {
        btn.addEventListener("click", function() {
            const termToRemove = this.getAttribute("data-term");
            terms = terms.filter(term => term !== termToRemove);
            renderTermsList();
        });
    });
}

function renderSearchTerms() {
    const searchTermsBox = document.getElementById("searchTerms");
    searchTermsBox.innerHTML = terms.map(term => `<span class="search-term">${term}</span>`).join('');
}

function handleAddData(e) {
    if (e) e.preventDefault();
    const caseId = document.getElementById("caseId").value;
    const caption = document.getElementById("caption").value;
    const globalDeduplication = document.querySelector('input[name="globalDeduplication"]:checked').value;
    const searchTerms = terms.join('\n');

    if (caseId && caption && globalDeduplication) {
        addTableData({ caseId, caption, globalDeduplication, searchTerms });

        document.getElementById("dataModal").style.display = "none";
        document.getElementById("dataForm").reset();
        terms = [];
        renderSearchTerms();
    } else {
        alert("Please fill in all required fields.");
    }
}

function addTableData(data) {
    data.id = Date.now();
    tableData.push(data);
    saveData();
    renderTable();
    attachEventListeners();
}

function renderTable(filter = "") {
    console.log("renderTable called with filter:", filter);
    console.log("Current tableData:", tableData);

    const tableBody = document.querySelector("#dataTable tbody");
    tableBody.innerHTML = "";

    const filteredData = tableData.filter((item) =>
        Object.values(item).some((value) =>
            value.toString().toLowerCase().includes(filter.toLowerCase())
        )
    );

    console.log("Filtered data to render:", filteredData);

    filteredData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.caseId}</td>
            <td>${item.caption}</td>
            <td>${item.globalDeduplication}</td>
            <td>${item.searchTerms}</td>
            <td class="actions-column">
                <button class="icon-btn edit-btn" data-id="${item.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete-btn" data-id="${item.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    console.log("Table rows added:", filteredData.length);

    attachEventListeners();
}

function attachEventListeners() {
    console.log("Attaching event listeners");
    document.querySelectorAll("#dataTable .edit-btn").forEach((button) => {
        button.removeEventListener("click", handleEditClick);
        button.addEventListener("click", handleEditClick);
    });

    document.querySelectorAll("#dataTable .delete-btn").forEach((button) => {
        button.removeEventListener("click", handleDeleteClick);
        button.addEventListener("click", handleDeleteClick);
    });
}

function handleEditClick(e) {
    e.preventDefault();
    console.log("Edit button clicked");
    const id = parseInt(this.getAttribute("data-id"));
    console.log("Editing item with id:", id);
    editTableData(id);
}

function handleDeleteClick(e) {
    e.preventDefault();
    console.log("Delete button clicked");
    const id = parseInt(this.getAttribute("data-id"));
    console.log("Deleting item with id:", id);
    deleteTableData(id);
}

function editTableData(id) {
    console.log("editTableData called with id:", id);
    const item = tableData.find((data) => data.id === id);
    if (item) {
        console.log("Item found:", item);
        document.getElementById("caseId").value = item.caseId;
        document.getElementById("caption").value = item.caption;
        document.querySelector(`input[name="globalDeduplication"][value="${item.globalDeduplication}"]`).checked = true;
        terms = item.searchTerms.split('\n').map(term => term.trim()).filter(term => term !== '');
        renderSearchTerms();

        const dataModal = document.getElementById("dataModal");
        dataModal.style.display = "flex";

        const dataForm = document.getElementById("dataForm");
        const submitDataBtn = document.getElementById("submitDataBtn");

        // Remove previous event listeners
        dataForm.onsubmit = null;
        submitDataBtn.onclick = null;

        // Add new event listeners
        const submitHandler = function (e) {
            e.preventDefault();
            console.log("Form submitted");
            updateItemData(item);
        };

        dataForm.onsubmit = submitHandler;
        submitDataBtn.onclick = submitHandler;
    } else {
        console.log("Item not found for id:", id);
    }
}

function updateItemData(item) {
    item.caseId = document.getElementById("caseId").value;
    item.caption = document.getElementById("caption").value;
    item.globalDeduplication = document.querySelector('input[name="globalDeduplication"]:checked').value;
    item.searchTerms = terms.join('\n');

    if (item.caseId && item.caption && item.globalDeduplication) {
        console.log("Updating item:", item);
        saveData();
        renderTable();
        document.getElementById("dataModal").style.display = "none";
    } else {
        alert("Please fill in all required fields.");
    }
}

function deleteTableData(id) {
    tableData = tableData.filter((item) => item.id !== id);
    saveData();
    renderTable();
}

function saveData() {
    localStorage.setItem("tableData", JSON.stringify(tableData));
    updateFileControlsVisibility();
}

function updateFileControlsVisibility() {
    const fileControlsCaseInfo = document.querySelector(".file-controls-case-info");
    if (fileControlsCaseInfo) {
        fileControlsCaseInfo.style.display = tableData.length > 0 ? "flex" : "none";
    }
}

let tableData = JSON.parse(localStorage.getItem("tableData")) || [];
let terms = [];