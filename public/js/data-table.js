document.addEventListener("DOMContentLoaded", function () {
    initDataTablePage();
});

function initDataTablePage() {
    renderTable();
    const addDataBtn = document.getElementById("addDataBtn");
    const dataModal = document.getElementById("dataModal");
    const dataForm = document.getElementById("dataForm");
    const tableFilter = document.getElementById("tableFilter");
    const closeBtn = dataModal.querySelector(".close");

    addDataBtn.addEventListener("click", function () {
        dataForm.reset();
        dataForm.onsubmit = handleAddData;
        dataModal.style.display = "block";
    });

    function handleAddData(e) {
        e.preventDefault();
        const caseId = document.getElementById("caseId").value;
        const caption = document.getElementById("caption").value;
        const globalDeduplication = document.getElementById(
            "globalDeduplication"
        ).value;
        const searchTerms = document.getElementById("searchTerms").value;

        addTableData({ caseId, caption, globalDeduplication, searchTerms });

        dataModal.style.display = "none";
        dataForm.reset();
    }

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
}

function addTableData(data) {
    data.id = Date.now();
    tableData.push(data);
    saveData();
    renderTable();
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

    document.querySelectorAll("#dataTable .edit-btn").forEach((button) => {
        button.addEventListener("click", function () {
            const id = parseInt(this.getAttribute("data-id"));
            editTableData(id);
        });
    });

    document.querySelectorAll("#dataTable .delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
            const id = parseInt(this.getAttribute("data-id"));
            deleteTableData(id);
        });
    });
}

function editTableData(id) {
    const item = tableData.find((data) => data.id === id);
    if (item) {
        document.getElementById("caseId").value = item.caseId;
        document.getElementById("caption").value = item.caption;
        document.getElementById("globalDeduplication").value =
            item.globalDeduplication;
        document.getElementById("searchTerms").value = item.searchTerms;

        const dataModal = document.getElementById("dataModal");
        dataModal.style.display = "block";

        const dataForm = document.getElementById("dataForm");
        dataForm.onsubmit = function (e) {
            e.preventDefault();
            item.caseId = document.getElementById("caseId").value;
            item.caption = document.getElementById("caption").value;
            item.globalDeduplication = document.getElementById(
                "globalDeduplication"
            ).value;
            item.searchTerms = document.getElementById("searchTerms").value;

            saveData();
            renderTable();
            dataModal.style.display = "none";
            dataForm.onsubmit = null;
        };
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
    const fileControlsCaseInfo = document.querySelector(
        ".file-controls-case-info"
    );
    if (fileControlsCaseInfo) {
        fileControlsCaseInfo.style.display = tableData.length > 0 ? "flex" : "none";
    }
}

let tableData = JSON.parse(localStorage.getItem("tableData")) || [];