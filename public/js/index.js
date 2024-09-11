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
    );
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
        } else if (pageId === "password-generator-page") {
            initPasswordGeneratorPage();
        }
    }
}

function exportData(data, filename) {
    let exportData;
    if (filename.includes("billing")) {
        exportData = {
            notes: data,
            activities: JSON.parse(localStorage.getItem("activities")) || [],
        };
    } else {
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
                    notes = [...notes, ...importedData.notes];
                    notes = notes.filter(
                        (note, index, self) =>
                            index === self.findIndex((t) => t.id === note.id)
                    );

                    const existingActivities =
                        JSON.parse(localStorage.getItem("activities")) || [];
                    const mergedActivities = [
                        ...new Set([...existingActivities, ...importedData.activities]),
                    ];
                    localStorage.setItem("activities", JSON.stringify(mergedActivities));

                    saveData();
                    renderNotes();
                    loadActivities();
                    showNotification("Billing data imported successfully");
                } catch (error) {
                    console.error("Error importing billing data:", error);
                    showNotification(
                        "Error importing billing data: " + error.message,
                        true
                    );
                } finally {
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

                    tableData = [...tableData, ...importedData];
                    console.log("Merged table data:", tableData);

                    tableData = tableData.filter(
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

    if (fileControlsBilling) {
        fileControlsBilling.style.display = notes.length > 0 ? "flex" : "none";
    }

    if (fileControlsCaseInfo) {
        fileControlsCaseInfo.style.display = tableData.length > 0 ? "flex" : "none";
    }
}

function validateImportedData(data, type) {
    if (type === "billing") {
        return Array.isArray(data.notes) && Array.isArray(data.activities);
    } else if (type === "caseInfo") {
        return Array.isArray(data) && data.every(item => 
            typeof item === 'object' && 
            'id' in item && 
            'caseId' in item && 
            'caption' in item && 
            'globalDeduplication' in item && 
            'searchTerms' in item
        );
    }
    return false;
}

function showNotification(message, isError = false) {
    // Implement this function to show notifications to the user
    console.log(isError ? "Error: " : "Notification: ", message);
    // You can add code here to display the notification in the UI
}

let notes = [];
let tableData = [];