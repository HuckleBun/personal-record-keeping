// Move getCaseData outside of the DOMContentLoaded event listener
function getCaseData(matterNumber) {
  const data = JSON.parse(localStorage.getItem(`case_${matterNumber}`)) || {
    overview: [],
    users: [],
    terms: {
      culling: {},
      privilege: {}
    },
    collections: []
  };
  
  // Ensure terms structure exists and is an object
  if (!data.terms) {
    data.terms = { culling: {}, privilege: {} };
  }

  // Convert arrays to objects if needed
  if (Array.isArray(data.terms.culling)) {
    const cullingObj = {};
    data.terms.culling = cullingObj;
  }
  if (Array.isArray(data.terms.privilege)) {
    const privilegeObj = {};
    data.terms.privilege = privilegeObj;
  }
  
  return data;
}

// Move saveCaseData outside as well since it's used with getCaseData
function saveCaseData(matterNumber, data) {
  localStorage.setItem(`case_${matterNumber}`, JSON.stringify(data));
  saveCases(); // Update the main cases list
}

// Move these functions outside of DOMContentLoaded
function saveCases() {
  const cases = [];
  document.querySelectorAll(".client-section").forEach((section) => {
    const client = section.querySelector("h2").textContent;
    section.querySelectorAll(".case-container").forEach((container) => {
      const caseBtn = container.querySelector(".case-btn");
      const [matterNumber, caption] = caseBtn.textContent.split(" | ");

      // Get the full case data
      const fullCaseData = getCaseData(matterNumber);
      console.log(`Saving full case data for ${matterNumber}:`, fullCaseData);

      // Ensure terms structure is correct before saving
      if (!fullCaseData.terms) {
        fullCaseData.terms = { culling: {}, privilege: {} };
      }
      if (Array.isArray(fullCaseData.terms.culling)) {
        fullCaseData.terms.culling = {};
      }
      if (Array.isArray(fullCaseData.terms.privilege)) {
        fullCaseData.terms.privilege = {};
      }

      cases.push({
        caption,
        matterNumber,
        client,
        ...fullCaseData
      });
    });
  });

  localStorage.setItem("cases", JSON.stringify(cases));
  console.log("Saved cases:", cases);
}

function loadCases() {
  const casesContainer = document.getElementById("cases-container");
  const savedCases = JSON.parse(localStorage.getItem("cases")) || [];

  // Clear existing cases
  casesContainer.innerHTML = "";

  // Group cases by client
  const casesByClient = {};
  savedCases.forEach((caseData) => {
    // Get the full case data from localStorage
    const fullCaseData = getCaseData(caseData.matterNumber);
    console.log(`Loading full case data for ${caseData.matterNumber}:`, fullCaseData);

    if (!casesByClient[caseData.client]) {
      casesByClient[caseData.client] = [];
    }
    // Use the full case data instead of just the basic case info
    casesByClient[caseData.client].push({
      ...caseData,
      ...fullCaseData
    });
  });

  // Create sections for each client
  Object.keys(casesByClient)
    .sort()
    .forEach((client) => {
      const clientSection = document.createElement("div");
      clientSection.className = "client-section";
      clientSection.innerHTML = `<h2>${client}</h2>`;

      // Sort cases by matter number
      casesByClient[client]
        .sort((a, b) => a.matterNumber.localeCompare(b.matterNumber))
        .forEach((caseData) => {
          const caseContainer = createCaseElement(
            caseData.caption,
            caseData.matterNumber,
            caseData.client
          );
          clientSection.appendChild(caseContainer);
        });

      casesContainer.appendChild(clientSection);
    });
}

// Add this function before the DOMContentLoaded event listener
function createCaseElement(caption, matterNumber, client) {
  const caseContainer = document.createElement("div");
  caseContainer.className = "case-container";

  // Create case button
  const caseBtn = document.createElement("button");
  caseBtn.className = "case-btn";
  caseBtn.textContent = `${matterNumber} | ${caption}`;

  // Create edit button
  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.onclick = () => {
    const editModal = document.getElementById("edit-modal");
    const closeBtn = editModal.querySelector(".close");
    const cancelBtn = editModal.querySelector(".cancel-btn");
    const modalTitle = editModal.querySelector(".modal-content h2");

    // Get current values from the case button text
    const currentText = caseBtn.textContent;
    const [currentMatterNumber, currentCaption] = currentText.split(" | ");
    const currentClient = caseContainer.closest(".client-section").querySelector("h2").textContent;

    // Populate form fields with current values
    document.getElementById("edit-caption").value = currentCaption;
    document.getElementById("edit-matter-number").value = currentMatterNumber;
    document.getElementById("edit-client").value = currentClient;

    // Update modal title to current caption
    modalTitle.textContent = currentCaption;

    // Show modal
    editModal.style.display = "block";

    // Close modal functions
    const closeModal = () => {
      editModal.style.display = "none";
    };

    // Add event listeners for closing
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    window.onclick = (event) => {
      if (event.target === editModal) {
        closeModal();
      }
    };

    // Handle form submission
    const editForm = editModal.querySelector("#edit-case-form");
    editForm.onsubmit = (e) => {
      e.preventDefault();
      const newCaption = document.getElementById("edit-caption").value;
      const newMatterNumber = document.getElementById("edit-matter-number").value;
      const newClient = document.getElementById("edit-client").value;

      // Update case button text
      caseBtn.textContent = `${newMatterNumber} | ${newCaption}`;

      // Handle client change if needed
      if (newClient !== currentClient) {
        const oldClientSection = caseContainer.closest(".client-section");
        caseContainer.remove();

        if (!oldClientSection.querySelector(".case-container")) {
          oldClientSection.remove();
        }

        const newClientSection = getOrCreateClientSection(newClient);
        insertCaseSorted(newClientSection, caseContainer, newMatterNumber);
      }

      saveCases();
      closeModal();
    };
  };

  // Create delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.title = "Delete Case";

  // Add delete functionality
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent case modal from opening
    const deleteModal = document.getElementById("delete-confirm-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");

    deleteModal.style.display = "block";

    const handleDelete = () => {
      // Remove from localStorage
      localStorage.removeItem(`case_${matterNumber}`);
      const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
      const updatedCases = savedCases.filter(c => c.matterNumber !== matterNumber);
      localStorage.setItem("cases", JSON.stringify(updatedCases));

      // Remove from UI
      const clientSection = caseContainer.closest(".client-section");
      caseContainer.remove();

      // Remove client section if empty
      if (!clientSection.querySelector(".case-container")) {
        clientSection.remove();
      }

      // Close modal
      deleteModal.style.display = "none";
      cleanup();
    };

    const handleCancel = () => {
      deleteModal.style.display = "none";
      cleanup();
    };

    const cleanup = () => {
      confirmDeleteBtn.removeEventListener("click", handleDelete);
      cancelDeleteBtn.removeEventListener("click", handleCancel);
    };

    confirmDeleteBtn.addEventListener("click", handleDelete);
    cancelDeleteBtn.addEventListener("click", handleCancel);

    // Close on outside click
    window.onclick = (event) => {
      if (event.target === deleteModal) {
        handleCancel();
      }
    };
  });

  // Add case button click handler
  caseBtn.addEventListener("click", () => {
    const caseData = getCaseData(matterNumber);
    console.log("Initial case data loaded:", caseData);

    const caseModal = document.createElement("div");
    caseModal.className = "modal";
    caseModal.dataset.matterNumber = matterNumber;
    caseModal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${caption}</h2>
        <div class="tabs">
          <button class="tab-button active" data-tab="overview">Overview</button>
          <button class="tab-button" data-tab="users">Users</button>
          <button class="tab-button" data-tab="collection">Collection</button>
          <button class="tab-button" data-tab="terms">Terms</button>
        </div>
        <div class="tab-content active" id="overview">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Setting</th>
                <th>Notes</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              ${generateOverviewRows(caseData.overview)}
            </tbody>
          </table>
        </div>
        <div class="tab-content" id="users">
          <button class="add-user-btn">Add User</button>
          <table class="users-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="tab-content" id="collection">
          <button class="add-collection-btn">Add Collection</button>
          <table class="collection-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Custodians</th>
                <th>Collection Type</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="tab-content" id="terms">
          <button class="add-terms-btn">Add Terms List</button>
          <div class="terms-lists">
            <div class="terms-section" data-type="culling">
              <div class="terms-header">
                <h3>Culling Terms</h3>
              </div>
              <div class="terms-lists-container"></div>
            </div>
            <div class="terms-section" data-type="privilege">
              <div class="terms-header">
                <h3>Privilege Terms</h3>
              </div>
              <div class="terms-lists-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(caseModal);
    caseModal.style.display = "block";

    // Get references to modal elements
    const closeBtn = caseModal.querySelector(".close");
    const modalContent = caseModal.querySelector(".modal-content");

    // Define close function
    function closeModal() {
      caseModal.remove();
    }

    // Add event listeners for closing
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    caseModal.addEventListener("click", function (e) {
      if (e.target === caseModal) {
        closeModal();
      }
    });

    // Prevent modal content clicks from bubbling up
    modalContent.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // Add tab functionality
    const tabButtons = caseModal.querySelectorAll(".tab-button");
    const tabContents = caseModal.querySelectorAll(".tab-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        // Add active class to clicked button and corresponding content
        button.classList.add("active");
        const tabId = button.getAttribute("data-tab");
        const tabContent = caseModal.querySelector(`#${tabId}`);
        tabContent.classList.add("active");

        // If terms tab is clicked, refresh terms data
        if (tabId === "terms") {
          const currentCaseData = getCaseData(matterNumber);
          if (currentCaseData.terms) {
            const cullingListsContainer = caseModal.querySelector(
              '[data-type="culling"] .terms-lists-container'
            );
            const privilegeListsContainer = caseModal.querySelector(
              '[data-type="privilege"] .terms-lists-container'
            );

            // Clear existing lists
            cullingListsContainer.innerHTML = "";
            privilegeListsContainer.innerHTML = "";

            // Reload terms lists
            if (currentCaseData.terms.culling && typeof currentCaseData.terms.culling === 'object') {
              Object.entries(currentCaseData.terms.culling).forEach(([listName, terms]) => {
                const listContainer = createTermsListElement(
                  listName,
                  terms,
                  "culling",
                  caseModal
                );
                cullingListsContainer.appendChild(listContainer);
              });
            }

            if (currentCaseData.terms.privilege && typeof currentCaseData.terms.privilege === 'object') {
              Object.entries(currentCaseData.terms.privilege).forEach(([listName, terms]) => {
                const listContainer = createTermsListElement(
                  listName,
                  terms,
                  "privilege",
                  caseModal
                );
                privilegeListsContainer.appendChild(listContainer);
              });
            }
          }
        }
      });
    });

    // Add Terms List button functionality
    const addTermsBtn = caseModal.querySelector(".add-terms-btn");
    addTermsBtn.addEventListener("click", () => {
      const termsModal = document.createElement("div");
      termsModal.className = "modal";
      termsModal.style.display = "block";
      termsModal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Add Terms List</h2>
          <div class="form-group">
            <label for="terms-list-name">List Name:</label>
            <input type="text" id="terms-list-name" required>
          </div>
          <div class="form-group">
            <label for="terms-input">Terms (one per line):</label>
            <textarea id="terms-input" rows="6" required></textarea>
          </div>
          <div class="radio-group">
            <input type="radio" id="culling" name="terms-type" value="culling" checked>
            <label for="culling">Culling Terms</label>
            <input type="radio" id="privilege" name="terms-type" value="privilege">
            <label for="privilege">Privilege Terms</label>
          </div>
          <div class="modal-buttons">
            <button class="cancel-btn">Cancel</button>
            <button class="save-btn">Save</button>
          </div>
        </div>
      `;

      document.body.appendChild(termsModal);

      // Handle save button click
      termsModal.querySelector(".save-btn").addEventListener("click", () => {
        const listName = termsModal.querySelector("#terms-list-name").value.trim();
        const terms = termsModal.querySelector("#terms-input").value.trim();
        const type = termsModal.querySelector('input[name="terms-type"]:checked').value;

        if (listName && terms) {
          const caseData = getCaseData(matterNumber);
          if (!caseData.terms) caseData.terms = { culling: {}, privilege: {} };
          if (!caseData.terms[type]) caseData.terms[type] = {};

          const termsList = terms.split("\n").filter(term => term.trim());
          caseData.terms[type][listName] = termsList;
          saveCaseData(matterNumber, caseData);

          // Add to UI
          const container = caseModal.querySelector(`[data-type="${type}"] .terms-lists-container`);
          const listContainer = createTermsListElement(listName, termsList, type, caseModal);
          container.appendChild(listContainer);

          termsModal.remove();
        }
      });

      // Handle close and cancel
      const closeModal = () => termsModal.remove();
      termsModal.querySelector(".close").addEventListener("click", closeModal);
      termsModal.querySelector(".cancel-btn").addEventListener("click", closeModal);
      termsModal.addEventListener("click", (e) => {
        if (e.target === termsModal) closeModal();
      });
    });

    // Add User button functionality
    const addUserBtn = caseModal.querySelector(".add-user-btn");
    const usersTable = caseModal.querySelector(".users-table tbody");

    // Function to save users
    function saveUsers() {
      const users = Array.from(usersTable.querySelectorAll("tr")).map((row) => ({
        firstName: row.cells[0].textContent,
        lastName: row.cells[1].textContent,
        email: row.cells[2].textContent,
      }));

      const caseData = getCaseData(matterNumber);
      caseData.users = users;
      saveCaseData(matterNumber, caseData);
    }

    // Add User Button Click Handler
    addUserBtn.addEventListener("click", () => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td>
          <button class="delete-user-btn">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;

      usersTable.appendChild(newRow);

      // Save when user edits the cells
      newRow.addEventListener("input", saveUsers);

      // Delete user
      newRow.querySelector(".delete-user-btn").addEventListener("click", () => {
        newRow.remove();
        saveUsers();
      });
    });

    // Load existing users if any
    if (caseData.users && caseData.users.length > 0) {
      caseData.users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td contenteditable="true">${user.firstName || ""}</td>
          <td contenteditable="true">${user.lastName || ""}</td>
          <td contenteditable="true">${user.email || ""}</td>
          <td>
            <button class="delete-user-btn">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        usersTable.appendChild(row);

        row.addEventListener("input", saveUsers);
        row.querySelector(".delete-user-btn").addEventListener("click", () => {
          row.remove();
          saveUsers();
        });
      });
    }

    // Add Overview saving functionality
    const overviewTable = caseModal.querySelector(".overview-table tbody");
    overviewTable.addEventListener("input", (e) => {
      if (e.target.matches("[contenteditable]")) {
        const rows = Array.from(overviewTable.querySelectorAll("tr"));
        const overviewData = rows.map((row) => ({
          category: row.cells[0].textContent,
          setting: row.cells[1].textContent,
          notes: row.cells[2].textContent,
          links: row.cells[3].textContent,
        }));

        const caseData = getCaseData(matterNumber);
        caseData.overview = overviewData;
        saveCaseData(matterNumber, caseData);
      }
    });

    // Add Collection functionality
    const addCollectionBtn = caseModal.querySelector(".add-collection-btn");
    const collectionTable = caseModal.querySelector(".collection-table tbody");

    // Function to save collections
    function saveCollections() {
      const collections = Array.from(collectionTable.querySelectorAll("tr")).map((row) => ({
        date: row.cells[0].textContent,
        source: row.cells[1].textContent,
        custodians: row.cells[2].textContent,
        type: row.cells[3].textContent,
        location: row.cells[4].textContent,
      }));

      const caseData = getCaseData(matterNumber);
      caseData.collections = collections;
      saveCaseData(matterNumber, caseData);
    }

    // Add Collection Button Click Handler
    addCollectionBtn.addEventListener("click", () => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td>
          <button class="delete-collection-btn">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;

      collectionTable.appendChild(newRow);

      // Save when user edits the cells
      newRow.addEventListener("input", saveCollections);

      // Delete collection
      newRow.querySelector(".delete-collection-btn").addEventListener("click", () => {
        newRow.remove();
        saveCollections();
      });
    });

    // Load existing collections if any
    if (caseData.collections && caseData.collections.length > 0) {
      caseData.collections.forEach(collection => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td contenteditable="true">${collection.date || ""}</td>
          <td contenteditable="true">${collection.source || ""}</td>
          <td contenteditable="true">${collection.custodians || ""}</td>
          <td contenteditable="true">${collection.type || ""}</td>
          <td contenteditable="true">${collection.location || ""}</td>
          <td>
            <button class="delete-collection-btn">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        collectionTable.appendChild(row);

        row.addEventListener("input", saveCollections);
        row.querySelector(".delete-collection-btn").addEventListener("click", () => {
          row.remove();
          saveCollections();
        });
      });
    }
  });

  // Append all buttons to case container
  caseContainer.appendChild(caseBtn);
  caseContainer.appendChild(editBtn);
  caseContainer.appendChild(deleteBtn);

  return caseContainer;
}

document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const addCaseBtn = document.getElementById("add-case-btn");
  const addCaseModal = document.getElementById("add-case-modal");
  const closeBtn = document.querySelector(".close");
  const submitBtn = document.getElementById("submit-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const caseForm = document.getElementById("case-form");
  const casesContainer = document.getElementById("cases-container");

  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  let caseToDelete = null;
  let modalToDelete = null;

  // Create hidden file input for import
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  // Export functionality
  document.getElementById('export-btn').addEventListener("click", () => {
    // Get all cases data
    const cases = JSON.parse(localStorage.getItem("cases")) || [];
    const exportData = {
      cases: cases,
      caseDetails: {}
    };

    // Get detailed data for each case
    cases.forEach(caseData => {
      const detailedData = getCaseData(caseData.matterNumber);
      exportData.caseDetails[caseData.matterNumber] = detailedData;
    });

    // Create and download file
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `case_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Import functionality
  document.getElementById('import-btn').addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Import main cases data
          localStorage.setItem("cases", JSON.stringify(importedData.cases));
          
          // Import detailed case data
          Object.entries(importedData.caseDetails).forEach(([matterNumber, data]) => {
            localStorage.setItem(`case_${matterNumber}`, JSON.stringify(data));
          });
          
          // Reload cases display
          loadCases();
          
          // Show success message
          alert("Cases imported successfully!");
        } catch (error) {
          alert("Error importing cases. Please make sure the file is valid.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    fileInput.value = "";
  });

  // Show add case modal
  addCaseBtn.addEventListener("click", () => {
    addCaseModal.style.display = "block";
  });

  // Close modal functions
  function closeModal() {
    addCaseModal.style.display = "none";
    caseForm.reset();
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === addCaseModal) {
      closeModal();
    }
  });

  // Load existing cases when the page loads
  loadCases();

  // Add this CSS to your stylesheet
  const style = document.createElement("style");
  style.textContent = `
      .terms-container {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
      }

      .terms-container::-webkit-scrollbar {
          width: 8px;
      }

      .terms-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
      }

      .terms-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
      }

      .terms-container::-webkit-scrollbar-thumb:hover {
          background: #555;
      }
  `;
  document.head.appendChild(style);

  // Add form validation function and event listeners
  function validateForm() {
    const caption = document.getElementById("caption").value;
    const matterNumber = document.getElementById("matter-number").value;
    const client = document.getElementById("client").value;
    const submitBtn = document.getElementById("submit-btn");

    submitBtn.disabled = !(caption && matterNumber && client);
  }

  // Add this inside the DOMContentLoaded event listener after getting DOM elements
  document.getElementById("caption").addEventListener("input", validateForm);
  document.getElementById("matter-number").addEventListener("input", validateForm);
  document.getElementById("client").addEventListener("change", validateForm);

  // Add form submission handler
  caseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const caption = document.getElementById("caption").value;
    const matterNumber = document.getElementById("matter-number").value;
    const client = document.getElementById("client").value;

    const clientSection = getOrCreateClientSection(client);
    const caseContainer = createCaseElement(caption, matterNumber, client);
    insertCaseSorted(clientSection, caseContainer, matterNumber);

    saveCases();
    closeModal();
  });
});

// Update your delete functionality to remove from localStorage
function deleteCase(matterNumber) {
  const savedCases = JSON.parse(localStorage.getItem("cases")) || [];
  const updatedCases = savedCases.filter(
    (c) => c.matterNumber !== matterNumber
  );
  localStorage.setItem("cases", JSON.stringify(updatedCases));

  // Also remove the case's detailed data
  localStorage.removeItem(`case_${matterNumber}`);

  loadCases(); // Refresh the display
}

function generateOverviewRows(overviewData) {
  const defaultCategories = [
    "Matter Name/Caption",
    "Client Represented",
    "Relativity WS Name",
    "Relativity WS TZ",
    "Global Deduplication Setting",
    "Protocol",
    "Analytics Run",
  ];

  if (!overviewData || overviewData.length === 0) {
    return defaultCategories
      .map(
        (category) => `
            <tr>
                <td>${category}</td>
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
            </tr>
        `
      )
      .join("");
  }

  return overviewData
    .map(
      (row) => `
        <tr>
            <td>${row.category}</td>
            <td contenteditable="true">${row.setting || ""}</td>
            <td contenteditable="true">${row.notes || ""}</td>
            <td contenteditable="true">${row.links || ""}</td>
        </tr>
    `
    )
    .join("");
}

function createTermsSection(title, type, termsLists) {
  const section = document.createElement("div");
  section.className = "terms-section";
  section.dataset.type = type;
  section.innerHTML = `
    <div class="terms-header">
      <h3>${title}</h3>
    </div>
    <div class="terms-lists-container"></div>
  `;

  const listsContainer = section.querySelector(".terms-lists-container");

  // Add initial terms lists if any exist
  if (termsLists) {
    Object.entries(termsLists)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([listName, termsList]) => {
        const listContainer = createTermsListElement(
          listName,
          termsList,
          type,
          section
        );
        listsContainer.appendChild(listContainer);
      });
  }

  return section;
}

function createTermsListElement(listName, termsList, type, modal) {
  const listContainer = document.createElement("div");
  listContainer.style.display = "flex";
  listContainer.style.gap = "10px";
  listContainer.style.alignItems = "center";

  const listButton = document.createElement("button");
  listButton.className = "terms-list-btn";
  listButton.textContent = listName;
  listButton.style.margin = "0";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.title = "Delete Terms List";

  listContainer.appendChild(listButton);
  listContainer.appendChild(deleteButton);

  // Add click handler for the list button
  listButton.onclick = () => {
    const viewModal = document.createElement("div");
    viewModal.className = "modal";
    viewModal.style.display = "block";
    viewModal.dataset.matterNumber = modal.dataset.matterNumber;

    viewModal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>${listName}</h2>
        <div class="terms-list-actions">
          <button class="edit-terms-btn" title="Edit terms">
            <i class="fas fa-edit"></i>
          </button>
          <button class="copy-terms-btn" title="Copy to clipboard">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="terms-list-view">
          ${Array.isArray(termsList) ? termsList.map(term => `<div class="term">${term}</div>`).join("") : ''}
        </div>
      </div>
    `;

    document.body.appendChild(viewModal);

    // Edit button functionality
    viewModal.querySelector(".edit-terms-btn").onclick = () => {
      const editTermsModal = document.createElement("div");
      editTermsModal.className = "modal";
      editTermsModal.style.display = "block";

      editTermsModal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Edit Terms</h2>
          <textarea style="width: 100%; height: 300px; margin: 20px 0;">${Array.isArray(termsList) ? termsList.join("\n") : ''}</textarea>
          <div class="modal-buttons">
            <button class="save-changes-btn submit-btn">Save Changes</button>
            <button class="cancel-edit-btn cancel-btn">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(editTermsModal);

      // Save changes functionality
      editTermsModal.querySelector(".save-changes-btn").onclick = () => {
        const newTerms = editTermsModal.querySelector("textarea").value
          .split("\n")
          .filter(term => term.trim());

        console.log("Saving edited terms:", {
          matterNumber: modal.dataset.matterNumber,
          listName,
          type,
          newTerms
        });

        // Update the terms in localStorage
        const caseData = getCaseData(modal.dataset.matterNumber);
        console.log("Current case data before edit save:", caseData);

        if (!caseData.terms) caseData.terms = { culling: {}, privilege: {} };
        caseData.terms[type][listName] = newTerms;
        
        console.log("Updated case data before saving edit:", caseData);
        saveCaseData(modal.dataset.matterNumber, caseData);
        console.log("Edited terms saved to localStorage");

        // Update the terms view
        viewModal.querySelector(".terms-list-view").innerHTML = 
          newTerms.map(term => `<div class="term">${term}</div>`).join("");

        // Update the termsList variable
        termsList = newTerms;

        editTermsModal.remove();
      };

      // Close edit modal functionality
      const closeEditModal = () => editTermsModal.remove();
      editTermsModal.onclick = (e) => {
        if (e.target === editTermsModal) closeEditModal();
      };
      editTermsModal.querySelector(".close").onclick = closeEditModal;
      editTermsModal.querySelector(".cancel-edit-btn").onclick = closeEditModal;
    };

    // Copy button functionality
    viewModal.querySelector(".copy-terms-btn").onclick = () => {
      const termsText = Array.isArray(termsList) ? termsList.join("\n") : '';
      navigator.clipboard.writeText(termsText).then(() => {
        const copyBtn = viewModal.querySelector(".copy-terms-btn i");
        copyBtn.className = "fas fa-check";
        setTimeout(() => {
          copyBtn.className = "fas fa-copy";
        }, 2000);
      });
    };

    // Close view modal functionality
    const closeViewModal = () => viewModal.remove();
    viewModal.onclick = (e) => {
      if (e.target === viewModal) closeViewModal();
    };
    viewModal.querySelector(".close").onclick = closeViewModal;
  };

  // Add delete button functionality
  deleteButton.onclick = (e) => {
    e.stopPropagation();

    // Create delete confirmation modal
    const deleteModal = document.createElement("div");
    deleteModal.className = "modal";
    deleteModal.style.display = "block";
    deleteModal.innerHTML = `
      <div class="modal-content delete-modal">
        <div class="delete-modal-header">
          <i class="fas fa-exclamation-triangle warning-icon"></i>
          <h2>Delete Terms List</h2>
        </div>
        <p>Are you sure you want to delete the <span class="highlight">"${listName}"</span> terms list?</p>
        <p class="delete-warning">This action cannot be undone.</p>
        <div class="modal-buttons">
          <button class="cancel-btn">Cancel</button>
          <button class="confirm-delete-btn">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(deleteModal);

    // Handle delete confirmation
    deleteModal.querySelector(".confirm-delete-btn").onclick = () => {
      console.log("Deleting terms list:", {
        matterNumber: modal.dataset.matterNumber,
        listName,
        type
      });

      const caseData = getCaseData(modal.dataset.matterNumber);
      console.log("Current case data before delete:", caseData);

      if (caseData.terms && caseData.terms[type]) {
        delete caseData.terms[type][listName];
        console.log("Updated case data after delete:", caseData);
        saveCaseData(modal.dataset.matterNumber, caseData);
        console.log("Delete saved to localStorage");
      }

      // Remove the list container from the UI
      listContainer.remove();

      // Close the delete modal
      deleteModal.remove();
    };

    // Handle cancel
    const closeDeleteModal = () => deleteModal.remove();
    deleteModal.querySelector(".cancel-btn").onclick = closeDeleteModal;
    deleteModal.onclick = (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    };
  };

  return listContainer;
}

// Add this CSS to your existing style element
const additionalStyle = document.createElement("style");
additionalStyle.textContent = `
    .terms-lists {
        display: flex;
        gap: 40px;
        max-height: 400px;  /* Set a max height for the container */
    }

    .terms-section {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .terms-list {
        max-height: 300px;  /* Set max height for the terms list */
        overflow-y: auto;   /* Enable vertical scrolling */
        padding-right: 10px;  /* Add padding for scrollbar */
    }

    /* Scrollbar styling */
    .terms-list::-webkit-scrollbar {
        width: 8px;
    }

    .terms-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .terms-list::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }

    .terms-list::-webkit-scrollbar-thumb:hover {
        background: #555;
    }

    /* Rest of your existing styles... */
    .terms-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .copy-terms-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        color: #4a90e2;
        font-size: 16px;
    }

    .copy-terms-btn:hover {
        color: #357abd;
    }

    .terms-list-btn {
        flex-grow: 1;
    }

    .delete-btn {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
    }

    .delete-modal {
      padding: 30px !important;
      text-align: center;
    }

    .delete-modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
    }

    .warning-icon {
      font-size: 48px;
      color: #f44336;
      margin-bottom: 15px;
    }

    .delete-modal h2 {
      color: #333;
      margin: 0;
      font-size: 24px;
    }

    .delete-modal p {
      color: #666;
      font-size: 16px;
      margin: 20px 0 30px;
      line-height: 1.5;
    }

    .delete-modal .highlight {
      color: #f44336;
      font-weight: bold;
    }

    .delete-modal .modal-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .confirm-delete-btn {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .confirm-delete-btn:hover {
      background-color: #d32f2f;
    }

    .close-delete-btn {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background-color 0.3s;
    }

    .close-delete-btn:hover {
      background-color: #45a049;
    }
`;
document.head.appendChild(additionalStyle);

// When opening the terms modal
function openTermsModal(matterNumber) {
  const termsModal = document.querySelector(".terms-modal");
  termsModal.style.display = "block";
  termsModal.dataset.matterNumber = matterNumber;

  // Get the current case data from localStorage
  const caseData =
    JSON.parse(localStorage.getItem(`case_${matterNumber}`)) || {};

  // Initialize terms structure if it doesn't exist
  if (!caseData.terms) {
    caseData.terms = { culling: [], privilege: [] };
    localStorage.setItem(`case_${matterNumber}`, JSON.stringify(caseData));
  }

  // Create a deep copy of the terms to work with
  const terms = {
    culling: [...(caseData.terms.culling || [])],
    privilege: [...(caseData.terms.privilege || [])],
  };

  // Update the display with the current terms
  updateTermsDisplay(termsModal, terms);
}

// Helper function to save users
function saveUsers(matterNumber, usersTable) {
  const users = Array.from(usersTable.querySelectorAll("tr")).map((row) => ({
    firstName: row.cells[0].textContent,
    lastName: row.cells[1].textContent,
    email: row.cells[2].textContent,
  }));

  const caseData = getCaseData(matterNumber);
  caseData.users = users;
  saveCaseData(matterNumber, caseData);
}

// Helper function for sorting cases
function sortCases(clientSection) {
  const cases = Array.from(clientSection.querySelectorAll(".case-container"));
  cases.sort((a, b) => {
    const aNumber = a.querySelector("button").textContent.split(" | ")[0];
    const bNumber = b.querySelector("button").textContent.split(" | ")[0];
    return aNumber.localeCompare(bNumber);
  });

  // Clear and re-append in sorted order
  cases.forEach((caseElement) => caseElement.remove());
  cases.forEach((caseElement) => clientSection.appendChild(caseElement));
}

function saveTermsList(matterNumber, listName, terms, type) {
  console.log("Saving terms list:", {
    matterNumber,
    listName,
    terms,
    type
  });
  const caseData = getCaseData(matterNumber);
  console.log("Current case data before save:", caseData);

  // Initialize terms structure if needed
  if (!caseData.terms) {
    caseData.terms = { culling: {}, privilege: {} };
  }
  if (!caseData.terms[type]) {
    caseData.terms[type] = {};
  }

  // Add new terms list
  caseData.terms[type][listName] = terms
    .split("\n")
    .filter((term) => term.trim());

  console.log("Updated case data before saving:", caseData);

  // Save to localStorage
  saveCaseData(matterNumber, caseData);
  console.log("Terms list saved to localStorage");

  return caseData.terms;
}

// Update the addCase function
function addCase(caption, matterNumber, client) {
    // Get or create the client section
    const clientSection = getOrCreateClientSection(client);

    // Create the case container
    const caseContainer = document.createElement('div');
    caseContainer.className = 'case-container';

    // Create the case button
    const caseBtn = document.createElement('button');
    caseBtn.className = 'case-btn';
    caseBtn.textContent = `${matterNumber} | ${caption}`;
    caseBtn.addEventListener('click', () => openCaseModal(matterNumber));

    // Create edit and delete buttons
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(matterNumber, caption, client);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(matterNumber);
    });

    // Append buttons to container
    caseContainer.appendChild(caseBtn);
    caseContainer.appendChild(editBtn);
    caseContainer.appendChild(deleteBtn);

    // Insert the case container in sorted order
    insertCaseSorted(clientSection, caseContainer, matterNumber);

    // Save case data
    const caseData = {
        caption,
        matterNumber,
        client,
        overview: [],
        users: [],
        terms: {
            culling: {},
            privilege: {}
        },
        collections: []
    };
    saveCaseData(matterNumber, caseData);
}

// Update the getOrCreateClientSection function
function getOrCreateClientSection(client) {
    // First try to find an existing section
    const existingSections = document.querySelectorAll('.client-section');
    for (const section of existingSections) {
        if (section.querySelector('h2').textContent === client) {
            return section;
        }
    }

    // If no existing section found, create a new one
    const clientSection = document.createElement('div');
    clientSection.className = 'client-section';
    
    const clientHeader = document.createElement('h2');
    clientHeader.textContent = client;
    clientSection.appendChild(clientHeader);

    // Find the correct position to insert the new section
    const casesContainer = document.getElementById('cases-container');
    const sections = Array.from(casesContainer.children);
    const insertIndex = sections.findIndex(section => 
        section.querySelector('h2').textContent.localeCompare(client) > 0
    );

    if (insertIndex === -1) {
        casesContainer.appendChild(clientSection);
    } else {
        casesContainer.insertBefore(clientSection, sections[insertIndex]);
    }

    return clientSection;
}

function insertCaseSorted(clientSection, caseContainer, matterNumber) {
    // Get all existing cases in this client section
    const cases = Array.from(clientSection.querySelectorAll('.case-container'));
    
    // Helper function to extract and compare matter numbers
    const compareMatterNumbers = (a, b) => {
        // Remove any non-digit characters and convert to number for comparison
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
    };

    // Find the correct position to insert the new case
    const insertIndex = cases.findIndex(existingCase => {
        const existingMatterNumber = existingCase
            .querySelector('.case-btn')
            .textContent.split(' | ')[0];
        
        return compareMatterNumbers(existingMatterNumber, matterNumber) > 0;
    });

    // Insert the case at the correct position
    if (insertIndex === -1) {
        clientSection.appendChild(caseContainer);
    } else {
        clientSection.insertBefore(caseContainer, cases[insertIndex]);
    }
}
