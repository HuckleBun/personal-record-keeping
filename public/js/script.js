function exportData(data, filename) {
  let exportData;
  if (filename.includes("billing")) {
    // For billing data, keep the current structure
    exportData = {
      notes: data,
      activities: JSON.parse(localStorage.getItem("activities")) || [],
    };
  } else {
    // For case info data, export as is
    exportData = data;
  }
  console.log("Exporting data:", exportData);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

let notes = [];
let tableData = [];

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  initPage();
  setupExportImport();
});

function loadData() {
  notes = JSON.parse(localStorage.getItem("notes")) || [];
  tableData = JSON.parse(localStorage.getItem("tableData")) || [];
}

function saveData() {
  localStorage.setItem("notes", JSON.stringify(notes));
  localStorage.setItem("tableData", JSON.stringify(tableData));
  console.log(
    "Saved tableData:",
    JSON.parse(localStorage.getItem("tableData"))
  ); // Add this line for debugging
  updateFileControlsVisibility();
}

function initPage() {
  const currentPage = document.querySelector(".page.active");
  if (currentPage) {
    const pageId = currentPage.id;
    if (pageId === "notes-page") {
      initNotesPage();
    } else if (pageId === "data-table-page") {
      initDataTablePage();
    }
  }
}

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

  // Clear existing options
  activitySelect.innerHTML = '<option value="">Select Activity</option>';

  activities.forEach((activity) => {
    const option = document.createElement("option");
    option.value = activity;
    option.textContent = activity;
    activitySelect.appendChild(option);
  });

  // Save the updated activities list back to localStorage
  localStorage.setItem("activities", JSON.stringify(activities));
}

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

function addNote(note) {
  note.id = Date.now();
  note.createdAt = new Date().toISOString();
  notes.push(note);
  saveData();
  renderNotes();
}

function addTableData(data) {
  data.id = Date.now();
  tableData.push(data);
  saveData();
  renderTable();
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);
  saveData();
  renderNotes();
}

function renderNotes() {
  const noteList = document.getElementById("noteList");
  noteList.innerHTML = "<h2>Saved Notes</h2>";
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

function setupExportImport() {
  const exportBillingBtn = document.getElementById("exportBillingBtn");
  const importBillingBtn = document.getElementById("importBillingBtn");
  const exportCaseInfoBtn = document.getElementById("exportCaseInfoBtn");
  const importCaseInfoBtn = document.getElementById("importCaseInfoBtn");

  if (exportBillingBtn) {
    exportBillingBtn.addEventListener("click", () => {
      console.log("Exporting billing data...");
      exportData(notes, "billing_data_backup.json");
    });
  }

  if (importBillingBtn) {
    importBillingBtn.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const importedData = await importData(file);
          if (!validateImportedData(importedData, "billing")) {
            throw new Error("Invalid data format for billing import");
          }
          // Merge imported notes with existing notes
          const mergedNotes = [...notes, ...importedData.notes];
          // Remove duplicates based on id
          notes = mergedNotes.filter(
            (note, index, self) =>
              index === self.findIndex((t) => t.id === note.id)
          );

          // Merge imported activities with existing activities
          const existingActivities =
            JSON.parse(localStorage.getItem("activities")) || [];
          const mergedActivities = [
            ...new Set([...existingActivities, ...importedData.activities]),
          ];
          localStorage.setItem("activities", JSON.stringify(mergedActivities));

          saveData();
          renderNotes();
          loadActivities(); // Reload the activities dropdown
          showNotification("Billing data imported successfully");
        } catch (error) {
          console.error("Error importing billing data:", error);
          showNotification(
            "Error importing billing data: " + error.message,
            true
          );
        } finally {
          // Reset the file input
          event.target.value = "";
        }
      }
    });
  }

  if (exportCaseInfoBtn) {
    exportCaseInfoBtn.addEventListener("click", () => {
      console.log("Exporting case info data...");
      exportData(tableData, "case_info_data_backup.json");
    });
  }

  if (importCaseInfoBtn) {
    importCaseInfoBtn.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          console.log("Starting import process");
          const importedData = await importData(file);
          console.log("Imported data:", importedData);

          if (!validateImportedData(importedData, "caseInfo")) {
            throw new Error("Invalid data format for case info import");
          }
          console.log("Data validation passed");

          // Merge imported data with existing table data
          const mergedTableData = [...tableData, ...importedData];
          console.log("Merged table data:", mergedTableData);

          // Remove duplicates based on id
          tableData = mergedTableData.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
          );
          console.log("Final table data after merge:", tableData);

          saveData();
          console.log("Data saved to localStorage");

          renderTable();
          console.log("Table rendered");

          showNotification("Case info data imported successfully");
        } catch (error) {
          console.error("Error importing case info data:", error);
          showNotification(
            "Error importing case info data: " + error.message,
            true
          );
        } finally {
          // Reset the file input
          event.target.value = "";
        }
      }
    });
  }

  updateFileControlsVisibility();
}

function updateFileControlsVisibility() {
  const fileControlsBilling = document.querySelector(".file-controls-billing");
  const fileControlsCaseInfo = document.querySelector(
    ".file-controls-case-info"
  );
  const exportBillingBtn = document.getElementById("exportBillingBtn");
  const exportCaseInfoBtn = document.getElementById("exportCaseInfoBtn");

  if (fileControlsBilling) {
    if (notes.length > 0) {
      fileControlsBilling.style.display = "flex";
      exportBillingBtn.style.display = "inline-block";
    } else {
      fileControlsBilling.style.display = "flex";
      exportBillingBtn.style.display = "none";
    }
  }

  if (fileControlsCaseInfo) {
    if (tableData.length > 0) {
      fileControlsCaseInfo.style.display = "flex";
      exportCaseInfoBtn.style.display = "inline-block";
    } else {
      fileControlsCaseInfo.style.display = "flex";
      exportCaseInfoBtn.style.display = "none";
    }
  }
}

function showNotification(message, isError = false) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  notification.style.backgroundColor = isError ? "#ff4444" : "#2ecc71"; // Changed to a darker green
  notification.style.color = "white";
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function validateImportedData(data, type) {
  if (type === "billing") {
    return data && Array.isArray(data.notes) && Array.isArray(data.activities);
  } else if (type === "caseInfo") {
    return (
      Array.isArray(data) &&
      data.every(
        (item) =>
          item.hasOwnProperty("id") &&
          item.hasOwnProperty("caseId") &&
          item.hasOwnProperty("caption") &&
          item.hasOwnProperty("globalDeduplication") &&
          item.hasOwnProperty("searchTerms")
      )
    );
  }
  return false;
}
